'use strict';

const assert = require('assert');

class Base{
  get isTerm(){ return 0; }
  get isUnary(){ return 0; }
  get isBinary(){ return 0; }
  get isBinder(){ return 0; }
}

class Term extends Base{
  constructor(expr){
    super();
    this.expr = expr;
  }

  get isTerm(){ return 1; }
}

class Unary extends Base{
  constructor(name){
    super();
    this.name = name;
  }

  get isUnary(){ return 1; }
}

class Binary extends Base{
  constructor(name){
    super();
    this.name = name;
  }

  get isBinary(){ return 1; }
}

class Binder extends Base{
  constructor(name){
    super();
    this.name = name;
  }

  get isBinder(){ return 1; }
}

module.exports = {
  Base,
  Term,
  Unary,
  Binary,
  Binder,
};