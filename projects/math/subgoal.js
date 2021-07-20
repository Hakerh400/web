'use strict';

const assert = require('assert');
const util = require('./util');
const su = require('./str-util');

class Subgoal{
  constructor(identsObj=O.obj(), identsArr=[], premises=[], goal=null){
    this.identsObj = identsObj;
    this.identsArr = identsArr;
    this.premises = premises;
    this.goal = goal;
  }

  copy(){
    return new Subgoal(
      this.identsObj,
      this.identsArr,
      this.premises,
      this.goal,
    );
  }

  copyPremises(){
    this.premises = this.premises.slice();
  }

  addPremise(prop, index=null, copy=0){
    if(copy) this.copyPremises();

    const {premises} = this;

    if(index === null)
      index = premises.length;

    premises.splice(index, 0, prop);
  }

  *addGoal(ctx, prop){
    assert(this.goal === null);

    const {identsObj, identsArr, premises} = this;

    prop = yield [[prop, 'simplify'], ctx];

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

    for(const imp of imps)
      premises.push(imp);

    this.goal = goal;
  }

  *replaceGoal(ctx, goal){
    assert(this.goal !== null);

    this.identsObj = util.copyObj(this.identsObj);
    this.identsArr = this.identsArr.slice();
    this.premises = this.premises.slice();
    this.goal = null;

    return O.tco([this, 'addGoal'], ctx, goal);
  }

  *getUsedIdents(idents=O.obj()){
    const {premises, goal} = this;
    assert(goal !== null);

    for(const prem of premises)
      yield [[prem, 'getStrIdents'], idents];

    yield [[goal, 'getStrIdents'], idents];

    return idents;
  }

  *simplify(){
    const {identsObj, identsArr, premises, goal} = this;
    const usedIdents = yield [[this, 'getUsedIdents']];

    let unusedIdents = null;
    let identsObjNew = null;

    for(const name of O.keys(identsObj)){
      if(O.has(usedIdents, name)) continue;

      if(identsObjNew === null){
        unusedIdents = O.obj();
        identsObjNew = util.copyObj(identsObj);
      }

      unusedIdents[name] = 1;
      delete identsObjNew[name];
    }

    if(unusedIdents === null)
      return this;

    const identsArrNew = identsArr.filter(name => O.has(identsObjNew, name));

    this.identsObj = identsObjNew;
    this.identsArr = identsArrNew;

    return this;
  }

  *toStr(ctx, toStrIdents=util.obj2()){
    assert(this.goal !== null);

    const {identsArr, premises, goal} = this;
    const premisesNum = premises.length;

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

    push(yield [[goal, 'toStr'], ctx, toStrIdents]);
    ppush();

    return sections.join('\n\n');
  }
}

module.exports = Subgoal;

const Expr = require('./expr');

const {Ident, Call, Lambda} = Expr;