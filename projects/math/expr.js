'use strict';

const assert = require('assert');

class Expr{
  get isIdent(){ return 0; }
  get isLam(){ return 0; }
  get isCall(){ return 0; }
}

class Ident extends Expr{
  constructor(name){
    super();
    assert(typeof name === 'string');
    this.name = name;
  }

  get isIdent(){ return 1; }
}

class Lambda extends Expr{
  constructor(name, expr){
    super();
    this.name = name;
    this.expr = expr;
  }

  get isLam(){ return 1; }
}

class Call extends Expr{
  constructor(target, arg){
    super();
    this.target = target;
    this.arg = arg;
  }

  get isCall(){ return 1; }
}

module.exports = Object.assign(Expr, {
  Ident,
  Lambda,
  Call,
});