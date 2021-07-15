'use strict';

const assert = require('assert');
const util = require('./util');
const su = require('./str-util');

class Subgoal{
  identsObj = O.obj();
  identsArr = [];
  premises = [];
  goal = null;

  static *new(call, ctx, prop=null, identsObj=null, identsArr=null, premises=null){
    const subgoal = new this();

    subgoal.call = call;
    subgoal.ctx = ctx;

    if(identsObj !== null)
      subgoal.identsObj = util.copyObj(identsObj);

    if(identsArr !== null)
      subgoal.identsArr = identsArr.slice();

    if(premises !== null)
      subgoal.premises = premises.slice();

    if(prop !== null)
      yield [call, [subgoal, 'addProp'], prop];

    return [1, subgoal];
  }

  *addProp(prop){
    assert(this.goal === null);

    const {call, ctx, identsObj, identsArr, premises} = this;

    prop = yield [call, [prop, 'simplify'], ctx];

    const newNames = O.obj();
    const symExprObj = O.obj();
    const unisList = [];

    while(1){
      const uni = prop.getUni(ctx);
      if(uni === null) break;

      const [sym, expr, type] = uni;
      prop = expr;

      const newName = util.getAvailIdent(ctx, newNames, 0);
      const newExpr = new Ident(newName);

      newNames[newName] = 1;
      identsArr.push(newName);

      newExpr.type = type;
      symExprObj[sym] = newExpr;
      unisList.push(newExpr);

      const typeIdents = yield [[type, 'getFreeIdents'], ctx];

      for(const sym of O.keys(typeIdents)){
        if(O.has(symExprObj, sym)) continue;

        const newTypeName = util.getAvailIdent(ctx, newNames, 2);
        newNames[newTypeName] = 1;

        symExprObj[sym] = new Ident(newTypeName, 1);
        identsObj[newTypeName] = [0, [0, []]];
      }
    }

    const unisNum = unisList.length;

    for(let i = 0; i !== unisNum; i++){
      const ident = unisList[i];
      assert(ident.isIdent);
      assert(!ident.isType);

      const {name, type} = ident;
      assert(type !== null);

      const identNew = yield [[ident, 'substIdents'], symExprObj];
      const typeNew = identNew.type;

      unisList[i] = identNew;
      identsObj[name] = [typeNew, [0, []]];
    }

    prop = yield [[prop, 'substIdents'], symExprObj];

    const [unis, imps] = prop.getPropInfo(ctx);
    assert(unis.length === 0);

    const goal = imps.pop();

    for(let i = imps.length - 1; i !== -1; i--)
      premises.push(imps[i]);

    this.goal = goal;
  }

  *toStr(){
    const {ctx, identsArr, premises, goal} = this;
    const premisesNum = premises.length;
    const toStrIdents = util.obj2();

    const sections = [];
    let lines = [];

    const push = line => {
      lines.push(line);
    };

    const ppush = () => {
      if(lines.length === 0)
        return;

      sections.push(lines.join('\n'));
      lines = [];
    };

    for(const name of identsArr){
      const type = ctx.getType(name);
      assert(type !== null);

      push(`${name} :: ${yield [[type, 'toStr'], ctx, toStrIdents]}`);
    }
    ppush();

    const padSize = String(premisesNum).length + 1;

    for(let i = 0; i !== premisesNum; i++){
      const numStr = String(`${i + 1}.`).padEnd(padSize);
      const exprStr = yield [[premises[i], 'toStr'], ctx, toStrIdents];

      push(`${numStr} ${exprStr}`);
    }
    ppush();

    push(`${String('%.').padEnd(padSize)} ${yield [[goal, 'toStr'], ctx, toStrIdents]}`);
    ppush();

    return sections.join('\n\n');
  }
}

module.exports = Subgoal;

const Expr = require('./expr');

const {Ident, Call, Lambda} = Expr;