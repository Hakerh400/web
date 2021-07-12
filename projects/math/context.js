'use strict';

const assert = require('assert');
const su = require('./str-util');

class Context{
  constructor(idents, ops, binders, spaces){
    this.idents = idents;
    this.ops = ops;
    this.binders = binders;
    this.spaces = spaces;
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

  name2str(name, addParens=0){
    const {spaces} = this;

    let str = name;

    addSpaces: if(O.has(spaces, name)){
      const [before, after, inParens] = spaces[name];

      if(!addParens && !inParens)
        break addSpaces;

      str = su.addSpaces(name, before, after);;
    }

    if(addParens && this.hasOpOrBinder(name))
      str = su.addParens(name);

    return str;
  }

  getInfo(name){
    if(this.hasIdent(name)) return this.idents[name];
    if(this.hasOp(name)) return this.ops[name];
    if(this.hasBinder(name)) return this.binders[name];

    return null;
  }

  has(name){
    return this.getInfo(name) !== null;
  }

  hasType(name){
    const info = this.getInfo(name);

    if(info === null) return 0;
    if(typeof info[0] !== 'number') return 0;

    return 1;
  }

  getType(name){
    const info = this.getInfo(name);
    if(info === null) return null;

    assert(info[0] instanceof Expr);
    return info[0];
  }

  getTypeArity(name){
    if(!this.hasType(name)) return null;
    return this.getInfo(name)[0];
  }

  getPrecInfo(name){
    return get(this.getInfo(name), 1);
  }

  getArity(name){
    const info = this.getPrecInfo(name);
    if(info) return info[1].length;
    return null;
  }

  getPrec(name){
    const info = this.getPrecInfo(name);
    if(info) return info[0];
    return null;
  }

  getPrecs(name){
    const info = this.getPrecInfo(name);
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

const get = (obj, key) => {
  if(obj === null) return null;
  return obj[key];
};

module.exports = Context;

const Expr = require('./expr');

const {Ident, Call, Lambda} = Expr;