'use strict';

const assert = require('assert');
const util = require('./util');

const {isStr, isSym, isStrOrSym} = util;

class Equation{
  constructor(unifier, lhs, rhs){
    this.unifier = unifier;

    if(this.cmp(lhs, rhs) > 0)
      [lhs, rhs] = [rhs, lhs];

    this.pri1 = this.pri(lhs);
    this.pri2 = this.pri(rhs);

    assert(this.pri1 <= this.pri2);

    this.lhs = lhs;
    this.rhs = rhs;
  }

  pri(expr){ O.virtual('pri'); }

  cmp(lhs, rhs){
    return this.pri(lhs) - this.pri(rhs);
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

    if(expr.isCall)
      return 3;

    assert.fail();
  }
}

module.exports = Object.assign(Equation, {
  TypeEquation,
  ValueEquation,
});

const Expr = require('./expr');

const {Ident, Call, Lambda} = Expr;