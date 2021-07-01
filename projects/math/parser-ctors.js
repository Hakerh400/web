'use strict';

const assert = require('assert');

class Base{
  get isTerm(){ return 0; }
  get isOpOrBinder(){ return 0; }
  get isOp(){ return; 0; }
  get isBinder(){ return; 0; }
  get isEnd(){ return 0; }
  get prec(){ O.virtual('prec'); }
  get precs(){ O.virtual('precs'); }
  get arity(){ O.virtual('arity'); }
  get isUnary(){ O.virtual('isUnary'); }
  get isBinary(){ O.virtual('isBinary'); }
}

class Term extends Base{
  constructor(expr){
    super();
    this.expr = expr;
  }

  get isTerm(){ return 1; }
}

class OpOrBinder extends Base{
  constructor(name, info){
    super();

    if(name !== null)
      assert(typeof name === 'string');

    this.name = name;
    this.info = info;
  }

  get isOpOrBinder(){ return 1; }
  get isOp(){ return 0; }
  get isBinder(){ return 0; }
}

class Op extends OpOrBinder{
  get isOp(){ return 1; }
  get prec(){ return this.info[0]; }
  get precs(){ return this.info[1]; }
  get arity(){ return this.precs.length; }
  get isUnary(){ return this.arity === 1; }
  get isBinary(){ return this.arity === 2; }
}

class End extends Op{
  constructor(){
    super(null, [-2, [-2, -1]]);
  }

  get isEnd(){ return 1; }
}

class Binder extends OpOrBinder{
  get isBinder(){ return 1; }
}

module.exports = {
  Base,
  Term,
  OpOrBinder,
  Op,
  End,
  Binder,
};