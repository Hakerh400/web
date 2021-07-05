'use strict';

const assert = require('assert');
const util = require('./util');

class Equation{
  constructor(lhs, rhs){
    if(this.cmp(lhs, rhs) > 0)
      [lhs, rhs] = [rhs, lhs];

    this.lhs = lhs;
    this.rhs = rhs;
  }

  pri(expr){ O.virtual('pri'); }

  cmp(lhs, rhs){
    return this.pri(lhs) - this.pri(rhs);
  }

  *toStr(ctx, idents=O.obj2()){
    const {lhs, rhs} = this;
    const expr = Expr.bin('≡', lhs, rhs, 1);

    return O.tco([expr, 'toStr'], ctx, idents);
  }
}

class TypeEquation extends Equation{
  pri(expr){
    assert(expr.isType);

    if(expr.isIdent){
      const {name} = expr;
      if(typeof name === 'symbol') return 0;
      return 1;
    }

    if(expr.isCall);
      return 2;

    assert.fail();
  }
}

module.exports = Object.assign(Equation, {
  TypeEquation,
});

const Expr = require('./expr');

const {Ident, Call, Lambda} = Expr;