'use strict';

const assert = require('assert');
const su = require('./str-util');

const identChars = O.chars('a', 'z');

class Expr{
  get isIdent(){ return 0; }
  get isLam(){ return 0; }
  get isCall(){ return 0; }

  *alpha(){ O.virtual('alpha'); }
  *beta(){ O.virtual('beta'); }
  *substIdent(){ O.virtual('substIdent'); }
  *toStr1(){ O.virtual('toStr1'); }

  *toStr(ctx, idents=obj2(), prec=0){
    const [precNew, str] = yield [[this, 'toStr1'], ctx, idents];

    if(precNew !== null && precNew < prec)
      return su.addParens(str);

    return str;
  }
}

class NamedExpr extends Expr{
  constructor(name){
    super();
    this.name = name;
  }

  getName(ctx, idents){
    const sym = this.name;

    if(typeof sym === 'string')
      return sym;

    const symStrObj = idents[0];
    const strSymObj = idents[1];

    if(O.has(symStrObj, sym))
      return symStrObj[sym];

    const name = getAvailIdent(ctx, strSymObj);

    symStrObj[sym] = name;
    strSymObj[name] = sym;

    return name;
  }
}

class Ident extends NamedExpr{
  get isIdent(){ return 1; }

  *alpha(ctx, idents=O.obj()){
    const {name} = this;
    if(!O.has(idents, name)) return this;
    return new Ident(idents[name]);
  }

  *beta(ctx, idents=O.obj()){
    return this;
  }

  *substIdent(ctx, name, expr){
    if(this.name === name) return expr;
    return this;
  }

  *toStr1(ctx, idents){
    const name = this.getName(ctx, idents);
    const name1 = ctx.name2str(name);

    if(ctx.hasOpOrBinder(name))
      return [null, su.addParens(name1)];

    return [null, name1];
  }
}

class Lambda extends NamedExpr{
  constructor(name, expr){
    super(name);
    this.expr = expr;
  }

  get isLam(){ return 1; }

  *alpha(ctx, idents=O.obj()){
    const {name, expr} = this;
    const sym = Symbol();

    idents[name] = sym;
    return new Lambda(sym, yield [[expr, 'alpha'], ctx, idents]);
  }

  *beta(ctx, idents=O.obj()){
    const {name, expr} = yield [[this, 'alpha'], ctx, idents];

    // idents[name] = name;
    return new Lambda(name, yield [[expr, 'beta'], ctx, idents]);
  }

  *substIdent(ctx, nm, e){
    const {name, expr} = this;
    return new Lambda(name, yield [[expr, 'substIdent'], ctx, nm, e]);
  }

  *toStr1(ctx, idents){
    const names = [];
    let e = this;

    while(e.isLam){
      names.push(e.getName(ctx, idents));
      e = e.expr;
    }

    return [ctx.getPrec('λ'), `λ${names.join(' ')}. ${yield [[e, 'toStr'], ctx, idents]}`];
  }
}

class Call extends Expr{
  constructor(target, arg){
    super();
    this.target = target;
    this.arg = arg;
  }

  get isCall(){ return 1; }

  *alpha(ctx, idents=O.obj()){
    const {target, arg} = this;
    const identsCopy = copyObj(idents);

    return new Call(
      yield [[target, 'alpha'], ctx, idents],
      yield [[arg, 'alpha'], ctx, identsCopy],
    );
  }

  *beta(ctx, idents=O.obj()){
    const target = yield [[this.target, 'beta'], ctx, idents];
    const arg = yield [[this.arg, 'beta'], ctx, idents];

    if(!target.isLam)
      return new Call(target, arg);

    const expr1 = yield [[target.expr, 'substIdent'], ctx, target.name, arg];
    return O.tco([expr1, 'beta'], ctx, idents);
  }

  *substIdent(ctx, name, expr){
    const {target, arg} = yield [[this, 'alpha'], ctx];

    return new Call(
      yield [[target, 'substIdent'], ctx, name, expr],
      yield [[arg, 'substIdent'], ctx, name, expr],
    );
  }

  *toStr1(ctx, idents){
    const {target, arg} = this;

    let op = null;
    let args = [];
    let e = this;

    while(e.isCall){
      args.push(e.arg);
      e = e.target;
      if(e.isIdent) op = e.getName(ctx, idents);
    }

    if(op !== null){
      checkOp: if(ctx.hasOp(op)){
        const p = ctx.getPrec(op);
        assert(p !== null);

        const arity = ctx.getArity(op);
        if(args.length !== arity) break checkOp;

        const ps = ctx.getPrecs(op);
        assert(ps.length === arity);

        args.reverse();

        if(arity === 1){
          return [p, `${ctx.name2str(op)} ${yield [[args[0], 'toStr'], ctx, idents, ps[0]]}`];
        }

        if(arity === 2)
          return [p, `${yield [[args[0], 'toStr'], ctx, idents, ps[0]]} ${ctx.name2str(op)} ${yield [[args[1], 'toStr'], ctx, idents, ps[1]]}`];

        assert.fail();
      }

      checkBinder: if(ctx.hasBinder(op)){
        const p = ctx.getPrec(op);
        assert(p !== null);

        const arity = ctx.getArity(op);
        if(args.length !== arity) break checkBinder;

        const ps = ctx.getPrecs(op);
        assert(ps.length === arity);

        args.reverse();

        if(arity === 1){
          const arg = args[0];
          if(!arg.isLam) break checkBinder;

          const name = arg.getName(ctx, idents);
          const str = yield [[arg.expr, 'toStr'], ctx, idents];

          if(str.startsWith(op))
            return [p, str.replace(op, `${op}${name} `)];

          return [p, `${op}${name}. ${str}`];
        }

        assert.fail();
      }
    }

    const ps = ctx.getPrecs(' ');
    return [ctx.getPrec(' '), `${yield [[target, 'toStr'], ctx, idents, ps[0]]} ${yield [[arg, 'toStr'], ctx, idents, ps[1]]}`];
  }
}

const getAvailIdent = (ctx, strSymObj) => {
  for(let i = 0;; i++){
    const name = genIdent(i);

    if(ctx.hasIdent(name)) continue;
    if(O.has(strSymObj, name)) continue;

    return name;
  }
};

const genIdent = i => {
  return O.arrOrder.str(identChars, i + 1);
};

const copyObj = obj => {
  return Object.assign(O.obj(), obj);
};

const obj2 = () => {
  return [O.obj(), O.obj()];
};

module.exports = Object.assign(Expr, {
  Ident,
  Lambda,
  Call,
});