'use strict';

const assert = require('assert');
const Equation = require('./equation');
const util = require('./util');

const {TypeEquation} = Equation

class Unifier{
  static get eqCtor(){ O.virtual('eqCtor'); }

  eqs = [];

  constructor(ctx){
    this.ctx = ctx;
  }

  get ctor(){ return this.constructor; }
  get eqCtor(){ return this.ctor.eqCtor; }

  *solve(){ O.virtual('solve'); }

  addEq(lhs, rhs){
    this.eqs.push(new this.eqCtor(lhs, rhs));
  }

  addEqs(eqs){
    for(const [lhs, rhs] of eqs)
      this.addEq(lhs, rhs);
  }

  solve(){ O.virtual('solve'); }
  toStr(){ O.virtual('toStr'); }

  err(msg){
    return [0, msg];
  }
}

class TypeUnifier extends Unifier{
  static get eqCtor(){ return TypeEquation; }

  constructor(ctx, identsObj){
    super(ctx);

    const objNew = O.obj();

    for(const key of O.keys(identsObj))
      objNew[key] = new Ident(util.newSym(), 1);

    this.identsObj = objNew;

    const identsArr = O.keys(objNew);
    const identsNum = identsArr.length;
    const identNames = util.getAvailIdents(ctx, O.obj(), 0, identsNum);

    const identIndices = O.obj();
    identsArr.forEach((sym, i) => identIndices[sym] = i);

    const symStrObj = O.obj();
    const strSymObj = O.obj();

    for(const sym of identsArr){
      const name = identNames[identIndices[sym]];

      symStrObj[sym] = name;
      strSymObj[name] = sym;
    }

    this.identsArr = identsArr;
    this.identNames = identNames;

    this.symStrObj = symStrObj;
    this.strSymObj = strSymObj;
    this.identsBase = [symStrObj, strSymObj];
  }

  getIdentType(name){
    const {identsObj} = this;

    assert(O.has(identsObj, name));
    return identsObj[name];
  }

  *solve(){
    const {eqCtor, ctx, eqs, identsObj, identsArr} = this;

    while(1){
      // O.logb();
      // log(yield [[this, 'toStr']]);
      // alert();
      if(eqs.length === 0) break;

      const eq = eqs.shift();
      const {lhs, rhs} = eq;

      const pri1 = eq.pri(lhs);
      const pri2 = eq.pri(rhs);

      if(pri1 === 0){
        const idents = yield [[rhs, 'getFreeIdents'], ctx];
        const sym = lhs.name;

        if(O.has(idents, sym)){
          if(pri2 !== 0)
            return this.err(`Occurs check`);

          continue;
        }

        for(let i = 0; i !== eqs.length; i++){
          const {lhs: lhs1, rhs: rhs1} = eqs[i];
          // if(i===4)O.z=1

          eqs[i] = new eqCtor(
            yield [[lhs1, 'substIdent'], ctx, sym, rhs],
            yield [[rhs1, 'substIdent'], ctx, sym, rhs],
          );
        }

        for(const ident of identsArr)
          identsObj[ident] = yield [[identsObj[ident], 'substIdent'], ctx, sym, rhs];

        continue;
      }

      if(pri1 === 1){
        if(pri2 === 2)
          return this.err(`Type mismatch (const vs. composition)`);

        if(rhs.name !== lhs.name)
          return this.err(`Type mismatch (name)`);

        continue;
      }

      if(pri1 === 2){
        const {target: x1, arg: x2} = lhs;
        const {target: y1, arg: y2} = rhs;

        this.addEqs([
          [x1, y1],
          [x2, y2],
        ]);

        continue;
      }

      assert.fail();
    }

    return [1, this.identsObj];
  }

  *toStr(){
    const {ctx, eqs, identsObj, identsArr, symStrObj} = this;
    const idents = this.identsBase;

    const s1 = (yield [O.mapr, identsArr, function*(sym){
      const type = yield [[identsObj[sym], 'toStr'], ctx, idents];
      return `${symStrObj[sym]} :: ${type}`;
    }]).join('\n')

    const s2 = (yield [O.mapr, eqs, function*(eq){
      return O.tco([eq, 'toStr'], ctx, idents);
    }]).join('\n');

    return `${s1}\n\n${s2}`;
  }
}

module.exports = Object.assign(Unifier, {
  TypeUnifier,
});

const Expr = require('./expr');

const {Ident, Call, Lambda} = Expr;