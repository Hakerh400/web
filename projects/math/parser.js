'use strict';

const assert = require('assert');
const Expr = require('./expr');
const su = require('./str-util');

const {Ident, Call, Lambda} = Expr;

const parse = (ctx, str) => {
  if(ctx.hasDef(str))
    return [1, new Ident(str)];

  return [0, new Error(str, 0, 'Error')];
};

class Context{
  constructor(idents, ops, binders, longOpNames){
    this.idents = idents;
    this.ops = ops;
    this.binders = binders;
    this.longOpNames = longOpNames;
  }

  hasDef(name){
    if(O.has(this.idents, name)) return 1;
    if(O.has(this.ops, name)) return 1;
    if(O.has(this.binders, name)) return 1;
    return 0;
  }

  isUnaryOp(name){
    return this.isOp(name) && this.getArity(name) === 1;
  }

  isBinaryOp(name){
    return this.isOp(name) && this.getArity(name) === 2;
  }

  name2str(name){
    if(O.has(this.longOpNames, name))
      return su.addSpaces(name);

    return name;
  }

  getArity(name){
    const info = this.getOpOrBinderInfo(name);
    if(info) return info[1].length;
    return null;
  }

  getOpOrBinderInfo(name){
    if(this.isOp(name)) return this.ops[name];
    if(this.isBinder(name)) return this.binders[name];
    return null;
  }

  getPrec(name){
    const info = this.getOpOrBinderInfo(name);
    if(info) return info[0];
    return null;
  }

  getPrecs(name){
    const info = this.getOpOrBinderInfo(name);
    if(info) return info[1].map(a => a + info[0]);
    return null;
  }

  isOpOrBinder(name){
    return this.isOp(name) || this.isBinder(name);
  }

  isOp(name){
    return O.has(this.ops, name);
  }

  isBinder(name){
    return O.has(this.binders, name);
  }
}

class Error{
  constructor(str, pos, msg){
    this.str = str;
    this.pos = pos;
    this.msg = msg;
  }
}

module.exports = {
  parse,
  Context,
  Error,
};