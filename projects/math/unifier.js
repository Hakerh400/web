'use strict';

const assert = require('assert');
const Equation = require('./equation');
const util = require('./util');

const {isStr, isSym, isStrOrSym} = util;

class Unifier{
  static get eqCtor(){ O.virtual('eqCtor'); }

  eqs = [];

  constructor(ctx){
    this.ctx = ctx;
  }

  get ctor(){ return this.constructor; }
  get eqCtor(){ return this.ctor.eqCtor; }

  mkEq(lhs, rhs){
    return new this.eqCtor(this, lhs, rhs);
  }

  addEq(lhs, rhs){
    this.eqs.push(this.mkEq(lhs, rhs));
  }

  addEqs(eqs){
    for(const [lhs, rhs] of eqs)
      this.addEq(lhs, rhs);
  }

  *solve(){ O.virtual('solve'); }
  *toStr(){ O.virtual('toStr'); }

  err(msg){
    return [0, msg];
  }
}

class TypeUnifier extends Unifier{
  static get eqCtor(){ return Equation.TypeEquation; }

  static *new(ctx, identsObj){
    const unifier = new this(ctx);

    unifier.assignments = [];

    const objNew = O.obj();
    const alphaIdents = O.obj();

    for(const sym of O.keys(identsObj)){
      const type = identsObj[sym];

      if(type === null){
        objNew[sym] = new Ident(util.newSym(), 1);
        continue;
      }

      objNew[sym] = yield [[type, 'alpha'], ctx, alphaIdents];
    }

    unifier.identsObj = objNew;

    const identsArr = O.keys(objNew);

    unifier.identsArr = identsArr;

    // DEBUG INFO
    {
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

      unifier.identNames = identNames;
      unifier.symStrObj = symStrObj;
      unifier.strSymObj = strSymObj;
      unifier.identsBase = [symStrObj, strSymObj];
    }

    return unifier;
  }

  getIdentType(name){
    const {identsObj} = this;

    assert(O.has(identsObj, name));
    return identsObj[name];
  }

  *solve(){
    const {ctx, eqs, identsObj, identsArr} = this;

    while(1){
      if(0){
        O.logb();
        log(yield [[this, 'toStr']]);
        if(prompt())z;
      }
      
      if(eqs.length === 0) break;

      const eq = eqs.pop();
      const {pri1, pri2, lhs, rhs} = eq;

      if(pri1 === 0){
        const idents = yield [[rhs, 'getFreeIdents'], ctx];
        const sym = lhs.name;

        if(O.has(idents, sym)){
          if(pri2 !== 0)
            return this.err(`Occurs check (type)`);

          continue;
        }

        // log(`\nASSIGN: ${yield [[new Ident(sym), 'toStr'], ctx]} ---> ${yield [[rhs, 'toStr'], ctx]}`);
        assert(!this.assignments.some(([a]) => a === sym));
        this.assignments.push([sym, rhs]);

        // O.z=1

        for(let i = 0; i !== eqs.length; i++){
          const {lhs: lhs1, rhs: rhs1} = eqs[i];
          // if(i===4)O.z=1

          eqs[i] = this.mkEq(
            yield [[lhs1, 'substIdent'], sym, rhs],
            yield [[rhs1, 'substIdent'], sym, rhs],
          );
        }

        for(const ident of identsArr)
          identsObj[ident] = yield [[identsObj[ident], 'substIdent'], sym, rhs];

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

    return [1, identsObj];
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

class ValueUnifier extends Unifier{
  static get eqCtor(){ return Equation.ValueEquation; }

  static *new(ctx, varsObj){
    const unifier = new this(ctx);
    const varsArr = O.keys(varsObj);

    unifier.varsObj = varsObj;
    unifier.varsArr = varsArr;

    // DEBUG INFO
    {
      const identsNum = varsArr.length;
      const identNames = util.getAvailIdents(ctx, O.obj(), 0, identsNum);

      const identIndices = O.obj();
      varsArr.forEach((sym, i) => identIndices[sym] = i);

      const symStrObj = O.obj();
      const strSymObj = O.obj();

      for(const sym of varsArr){
        const name = identNames[identIndices[sym]];

        symStrObj[sym] = name;
        strSymObj[name] = sym;
      }

      unifier.identNames = identNames;
      unifier.symStrObj = symStrObj;
      unifier.strSymObj = strSymObj;
      unifier.identsBase = [symStrObj, strSymObj];
    }

    return unifier;
  }

  hasVar(name){
    return O.has(this.varsObj, name);
  }

  *mkTypeUnifier(expr1, expr2){
    const {ctx} = this;

    const idents1 = yield [[expr1, 'getSymIdents']];
    const idents2 = yield [[expr2, 'getSymIdents']];
    const idents = util.mergeUniq(idents1, idents2);

    const unifier = yield [[TypeUnifier, 'new'], ctx, idents];

    yield [[expr1, 'getType'], unifier];
    yield [[expr2, 'getType'], unifier];

    return unifier;
  }

  *solve(){
    const {ctx, eqs, varsObj, varsArr} = this;

    assert(eqs.length === 1);
    const {lhs, rhs} = eqs[0];
    const typeUnifier = yield [[this, 'mkTypeUnifier'], lhs, rhs];

    const consts = O.obj();

    const mkConst = () => {
      const sym = util.newSym();
      consts[sym] = 1;
      return sym;
    };

    const hasConst = sym => {
      return O.has(consts, sym);
    };

    while(1){
      if(0){
        O.logb();
        log(yield [[this, 'toStr']]);
        if(prompt())z;
      }

      if(eqs.length === 0) break;

      const eq = eqs.pop();
      const {pri1, pri2, lhs, rhs} = eq;

      const mismatch = () => {
        const getExprType = pri => {
          if(pri === 1) return 'const';
          if(pri === 2) return 'lambda';
          if(pri === 3) return 'call';

          assert.fail();
        };

        const exprType1 = getExprType(pri1);
        const exprType2 = getExprType(pri2);

        return this.err(`Value mismatch (${exprType1} vs. ${exprType2})`)
      };

      const type1 = lhs.type;
      const type2 = rhs.type;

      assert(type1 !== null);
      assert(type2 !== null);

      typeUnifier.addEq(type1, type2);

      if(pri1 === 0){
        const idents = yield [[rhs, 'getFreeIdents'], ctx];

        if(lhs.isCall){
          assert.fail();

          /*const [target, args] = lhs.getCall();
          const sym = target.name;

          if(1|O.has(idents, sym)){
            eq.pri1 = 3;
            eq.sort();
            eqs.push(eq);
            continue;
          }

          const lam = yield [[rhs, 'mkLam'], args];
          continue;*/
        }

        const sym = lhs.name;

        if(O.has(idents, sym)){
          if(pri2 !== 0)
            return this.err(`Occurs check (value)`);

          continue;
        }

        for(const identSym of O.keys(idents))
          if(hasConst(identSym))
            return this.err(`Lambda argument escaped`);

        for(let i = 0; i !== eqs.length; i++){
          const {lhs: lhs1, rhs: rhs1} = eqs[i];

          eqs[i] = this.mkEq(
            yield [[lhs1, 'substIdent'], sym, rhs],
            yield [[rhs1, 'substIdent'], sym, rhs],
          );
        }

        for(const ident of varsArr){
          const val = varsObj[ident];

          if(ident === sym){
            assert(val === null);
            varsObj[sym] = rhs;
            continue;
          }

          if(val === null) continue;

          varsObj[ident] = yield [[val, 'substIdent'], sym, rhs];
        }

        continue;
      }

      if(pri1 !== pri2)
        return mismatch();

      if(pri1 === 1){
        if(rhs.name !== lhs.name)
          return this.err(`Value mismatch (name)`);

        continue;
      }

      if(pri1 === 2){
        const constSym = mkConst();
        const ident = new Ident(constSym);

        eq.pri(lhs);

        ident.type = lhs.getLamArgType(ctx);

        const lhs1 = yield [[lhs.expr, 'substIdent'], lhs.name, ident];
        const rhs1 = yield [[rhs.expr, 'substIdent'], rhs.name, ident];

        this.addEq(lhs1, rhs1);

        continue;
      }

      if(pri1 === 3){
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

    const result = yield [[typeUnifier, 'solve']];
    if(result[0] === 0) return result;

    return [1, varsObj];
  }

  *toStr(){
    const {ctx, eqs, varsObj, varsArr, symStrObj} = this;
    const idents = this.identsBase;

    const s1 = (yield [O.mapr, varsArr, function*(sym){
      const val = varsObj[sym];

      const valStr = val !== null ?
        yield [[val, 'toStr'], ctx, idents] : '?';

      return `${symStrObj[sym]}: ${valStr}`;
    }]).join('\n')

    const s2 = (yield [O.mapr, eqs, function*(eq){
      return O.tco([eq, 'toStr'], ctx, idents);
    }]).join('\n');

    return `${s1}\n\n${s2}`;
  }
}

module.exports = Object.assign(Unifier, {
  TypeUnifier,
  ValueUnifier,
});

const Expr = require('./expr');

const {Ident, Call, Lambda} = Expr;