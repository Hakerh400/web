'use strict';

const assert = require('assert');
const su = require('./str-util');

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

  hasIdent(name){
    return O.has(this.idents, name);
  }

  hasUnaryOp(name){
    return this.hasOp(name) && this.getArity(name) === 1;
  }

  hasBinaryOp(name){
    return this.hasOp(name) && this.getArity(name) === 2;
  }

  name2str(name){
    if(O.has(this.longOpNames, name))
      return su.addSpaces(name);

    return name;
  }

  getArity(name){
    const info = this.getInfo(name);
    if(info) return info[1].length;
    return null;
  }

  getInfo(name){
    if(this.hasOp(name)) return this.ops[name];
    if(this.hasBinder(name)) return this.binders[name];
    return null;
  }

  getPrec(name){
    const info = this.getInfo(name);
    if(info) return info[0];
    return null;
  }

  getPrecs(name){
    const info = this.getInfo(name);
    if(info) return info[1];
    return null;
  }

  hasOpOrBinder(name){
    return this.hasOp(name) || this.hasBinder(name);
  }

  hasOp(name){
    return O.has(this.ops, name);
  }

  hasBinder(name){
    return O.has(this.binders, name);
  }
}

module.exports = Context;