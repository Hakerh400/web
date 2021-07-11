'use strict';

const assert = require('assert');
const util = require('./util');

const {isStr, isSym, isStrOrSym} = util;

class Equation{
  constructor(unifier, lhs, rhs){
    this.unifier = unifier;

    this.lhs = lhs;
    this.rhs = rhs;
    this.pri1 = this.pri(lhs);
    this.pri2 = this.pri(rhs);

    this.sort();
    
    // assert(this.pri(this.lhs) === this.pri1);
    // assert(this.pri(this.rhs) === this.pri2);
    // assert(this.pri1 <= this.pri2);
  }

  pri(expr){ O.virtual('pri'); }

  flip(){
    const {lhs, rhs, pri1, pri2} = this;

    this.lhs = rhs;
    this.rhs = lhs;
    this.pri1 = pri2;
    this.pri2 = pri1;

    return this;
  }

  sort(){
    if(this.pri1 > this.pri2)
      this.flip();

    return this;
  }

  *toStr(unifier, idents=O.obj2()){
    const {lhs, rhs} = this;
    const expr = Expr.mkBinOp('≡', lhs, rhs);

    return O.tco([expr, 'toStr'], unifier, idents);
  }
}

class TypeEquation extends Equation{
  pri(expr){
    assert(expr.isType);

    if(expr.isIdent){
      const {name} = expr;

      if(isSym(name)) return 0;
      return 1;
    }

    if(expr.isCall)
      return 2;

    assert.fail();
  }
}

class ValueEquation extends Equation{
  pri(expr){
    const {unifier} = this;
    assert(!expr.isType);

    if(expr.isIdent){
      const {name} = expr;

      if(unifier.hasVar(name)) return 0;
      return 1;
    }

    if(expr.isLam)
      return 2;

    if(expr.isCall){
      return 3;

      /*const [target, args] = expr.getCall();
      if(!target.isIdent) return 3;

      const {name} = target;
      if(unifier.hasVar(name)) return 0;

      return 3;*/
    }

    assert.fail();
  }
}

module.exports = Object.assign(Equation, {
  TypeEquation,
  ValueEquation,
});

const Expr = require('./expr');

const {Ident, Call, Lambda} = Expr;