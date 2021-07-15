'use strict';

const assert = require('assert');
const util = require('./util');
const su = require('./str-util');

const newObj = () => O.obj();
const nullf = () => null;

const template = {
  idents:  newObj,
  ops:     newObj,
  binders: newObj,
  spacing: newObj,
  meta:    newObj,
  rules:   newObj,
  proof:   nullf,
};

const templateKeys = O.keys(template);

class Context{
  static from(ctx){
    return new Context(ctx);
  }

  identsCache = null;

  constructor(ctx=null){
    if(ctx === null){
      for(const key of templateKeys)
        this[key] = template[key](this);

      this.ops[' '] = [null, [80, [0, 1]]];
    }else{
      for(const key of templateKeys)
        this[key] = ctx[key];
    }
  }

  copy(){
    return new Context(this);
  }

  hasRule(name){
    return O.has(this.rules, name);
  }

  hasName(name){
    if(O.has(this.idents, name)) return 1;
    if(O.has(this.ops, name)) return 1;
    if(O.has(this.binders, name)) return 1;

    return 0;
  }

  hasMeta(name){
    return O.has(this.meta, name);
  }

  getMeta(name){
    if(!this.hasMeta(name)) return null;
    return this.meta[name];
  }

  hasSpacingInfo(name){
    return O.has(this.spacing, name);
  }

  setSpacingInfo(name, info){
    this.spacing[name] = info;
  }

  hasIdent(name){
    if(O.has(this.idents, name)){
      this.identsCache = this.idents;
      return 1;
    }

    const {proof} = this;

    if(proof === null || proof.length === 0)
      return 0;

    const subgoal = proof[0];

    this.identsCache = subgoal.identsObj;
    return O.has(subgoal.identsObj, name);
  }

  hasUnaryOp(name){
    return this.hasOp(name) && this.getArity(name) === 1;
  }

  hasBinaryOp(name){
    return this.hasOp(name) && this.getArity(name) === 2;
  }

  hasType(name){
    const info = this.getInfo(name);
    if(info === null) return null;

    return util.isNum(info[0]);
  }

  getTypeArity(name){
    if(!this.hasType(name)) return null;
    return this.getInfo(name)[0];
  }

  getType(name){
    const info = this.getInfo(name);
    if(info === null) return null;

    const type = info[0];
    if(util.isNum(type)) return null;

    return type;
  }

  name2str(name, addParens=0){
    const {spacing} = this;

    let str = name;

    addSpacing: if(O.has(spacing, name)){
      const [before, after, inParens] = spacing[name];

      if(addParens !== 2){
        if(addParens && !inParens)
          break addSpacing;
      }else{
        if(!inParens)
          break addSpacing;
      }

      str = su.addSpacing(name, before, after);
    }

    if(addParens === 2 || (addParens && this.hasOpOrBinder(name)))
      str = su.addParens(str);

    return str;
  }

  getInfo(name){
    if(this.hasIdent(name)) return this.identsCache[name];
    if(this.hasOp(name)) return this.ops[name];

    if(this.hasBinder(name)){
      if(name === this.meta.lambda)
        return null;

      return this.binders[name];
    }

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
    if(!info) return null;
    return info[1].length;
  }

  getPrec(name){
    const info = this.getPrecInfo(name);
    if(!info) return null;
    return info[0];
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
    if(name === this.meta.lambda)
      return 1;

    return O.has(this.binders, name);
  }
}

const get = (obj, key) => {
  if(obj === null) return null;
  return obj[key];
};

module.exports = Context;

const Expr = require('./expr');
const Subgoal = require('./subgoal');

const {Ident, Call, Lambda} = Expr;