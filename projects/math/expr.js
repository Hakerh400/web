'use strict';

const assert = require('assert');
const util = require('./util');
const su = require('./str-util');

class Expr{
  static bin(op, e1, e2, isType=0){
    return new Call(new Call(new Ident(op, isType), e1, isType), e2, isType);
  }

  constructor(isType=0){
    this.isType = isType;
  }

  get ctor(){ return this.constructor; }

  get isIdent(){ return 0; }
  get isLam(){ return 0; }
  get isCall(){ return 0; }

  *alphaV(){ O.virtual('alphaV'); }
  *betaV(){ O.virtual('betaV'); }
  *substIdent(){ O.virtual('substIdent'); }
  *getSymIdents(){ O.virtual('getSymIdents'); }
  *getFreeIdents(){ O.virtual('getFreeIdents'); }
  *renameIdents(){ O.virtual('renameIdents'); }
  *getType(){ O.virtual('getType'); }
  *toStr1(){ O.virtual('toStr1'); }

  from(...args){
    const expr = new this.ctor(...args);
    expr.isType = this.isType;
    return expr;
  }

  *alpha(ctx){
    if(!this.isType)
      return O.tco([this, 'alphaV'], ctx);

    const idents = yield [[this, 'getFreeIdents'], ctx];

    for(const name of O.keys(idents))
      idents[name] = util.newSym();

    return O.tco([this, 'renameIdents'], ctx, idents);
  }

  *beta(ctx){
    assert(!this.isType);

    const expr = yield [[this, 'alpha'], ctx];
    return O.tco([expr, 'betaV'], ctx);
  }

  *unifyTypes(ctx){
    assert(!this.isType);

    const identsObj = yield [[this, 'getSymIdents'], ctx];
    const unifier = new TypeUnifier(ctx, identsObj);

    yield [[this, 'getType'], unifier];

    return O.tco([unifier, 'solve']);
  }

  *toStr(ctx, idents=util.obj2(), prec=0){
    const [precNew, str] = yield [[this, 'toStr1'], ctx, idents];

    if(precNew !== null && precNew < prec)
      return su.addParens(str);

    return str;
  }
}

class NamedExpr extends Expr{
  constructor(name, isType){
    super(isType);

    assert(typeof name === 'string' || typeof name === 'symbol');
    this.name = name;
  }

  getName(ctx, idents){
    const sym = this.name;

    if(typeof sym === 'string')
      return sym;
    // if(this.isType)return String(this.name).match(/\d+/)[0]

    const symStrObj = idents[0];
    const strSymObj = idents[1];

    if(O.has(symStrObj, sym))
      return symStrObj[sym];

    const name = util.getAvailIdent(ctx, strSymObj, this.isType);

    symStrObj[sym] = name;
    strSymObj[name] = sym;

    return name;
  }
}

class Ident extends NamedExpr{
  get isIdent(){ return 1; }

  *alphaV(ctx, idents=O.obj()){
    const {name} = this;
    if(!O.has(idents, name)) return this;
    return this.from(idents[name]);
  }

  *betaV(ctx){
    return this;
  }

  *substIdent(ctx, name, expr){
    // if(O.z)debugger;
    if(this.name === name) return expr;
    return this;
  }

  *getSymIdents(ctx, idents=O.obj()){
    const {name} = this;

    if(typeof name === 'symbol')
      idents[name] = 1;

    return idents;
  }

  *getFreeIdents(ctx, free=O.obj(), bound=O.obj()){
    const {name} = this;

    if(!(O.has(bound, name) || ctx.has(name)))
      free[name] = 1;

    return free;
  }

  *renameIdents(ctx, idents){
    const {name} = this;

    if(!O.has(idents, name)) return this;
    return this.from(idents[name]);
  }

  *getType(unifier){
    const {ctx} = unifier;
    const {name} = this;

    if(typeof name === 'string'){
      assert(ctx.has(name))
      const type = ctx.getType(name);
      return O.tco([type, 'alpha'], ctx);
    }

    return unifier.getIdentType(name);
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
  constructor(name, expr, isType){
    super(name, isType);
    this.expr = expr;
  }

  get isLam(){ return 1; }

  *alphaV(ctx, idents=O.obj()){
    const {name, expr} = this;
    const sym = util.newSym();

    idents[name] = sym;
    return this.from(sym, yield [[expr, 'alphaV'], ctx, idents]);
  }

  *betaV(ctx){
    // const {name, expr} = yield [[this, 'alphaV'], ctx];

    // ???????????????????????????????????????????????
    // idents[name] = name;

    return this.from(this.name, yield [[this.expr, 'betaV'], ctx]);
  }

  *substIdent(ctx, nm, e){
    const {name, expr} = this;
    return this.from(name, yield [[expr, 'substIdent'], ctx, nm, e]);
  }

  *getSymIdents(ctx, idents=O.obj()){
    const {name, expr} = this;

    if(typeof name === 'symbol')
      idents[name] = 1;

    return O.tco([expr, 'getSymIdents'], ctx, idents);
  }

  *getFreeIdents(ctx, free=O.obj(), bound=O.obj()){
    const {name, expr} = this;
    bound[name] = 1;
    return O.tco([expr, 'getFreeIdents'], ctx, free, bound);
  }

  *renameIdents(ctx, idents){
    assert.fail();
  }

  *getType(unifier){
    const {ctx} = unifier;
    const {name, expr} = this;

    const identType = unifier.getIdentType(name);
    const exprType = yield [[expr, 'getType'], unifier];

    return Expr.bin('⟹', identType, exprType, 1);
  }

  *toStr1(ctx, idents){
    const names = [];
    let e = this;

    while(e.isLam){
      names.push(e.getName(ctx, idents));
      e = e.expr;
    }

    return [ctx.getPrec('λ'), `λ${
      names.join(' ')}. ${
      yield [[e, 'toStr'], ctx, idents]}`];
  }
}

class Call extends Expr{
  constructor(target, arg, isType){
    super(isType);
    this.target = target;
    this.arg = arg;
  }

  get isCall(){ return 1; }

  *alphaV(ctx, idents=O.obj()){
    const {target, arg} = this;
    const identsCopy = util.copyObj(idents);

    return this.from(
      yield [[target, 'alphaV'], ctx, idents],
      yield [[arg, 'alphaV'], ctx, identsCopy],
    );
  }

  *betaV(ctx){
    const target = yield [[this.target, 'betaV'], ctx];
    const arg = yield [[this.arg, 'betaV'], ctx];

    if(!target.isLam)
      return this.from(target, arg);

    const expr = yield [[target.expr, 'substIdent'], ctx, target.name, arg];
    return O.tco([expr, 'beta'], ctx);
  }

  *substIdent(ctx, name, expr){
    const {target, arg} = yield [[this, 'alphaV'], ctx];

    return this.from(
      yield [[target, 'substIdent'], ctx, name, expr],
      yield [[arg, 'substIdent'], ctx, name, expr],
    );
  }

  *getSymIdents(ctx, idents=O.obj()){
    const {target, arg} = this;

    yield [[target, 'getSymIdents'], ctx, idents];
    return O.tco([arg, 'getSymIdents'], ctx, idents);
  }

  *getFreeIdents(ctx, free=O.obj(), bound=O.obj()){
    const {target, arg} = this;

    yield [[target, 'getFreeIdents'], ctx, free, bound];
    return O.tco([arg, 'getFreeIdents'], ctx, free, bound);
  }

  *renameIdents(ctx, idents){
    const {target, arg} = this;
    
    return this.from(
      yield [[target, 'renameIdents'], ctx, idents],
      yield [[arg, 'renameIdents'], ctx, idents],
    );
  }

  *getType(unifier){
    const {ctx} = unifier;
    const {target, arg} = this;

    const targetType = yield [[target, 'getType'], unifier];
    const argType = yield [[arg, 'getType'], unifier];
    const resultType = new Ident(util.newSym(), 1);

    unifier.addEq(targetType, Expr.bin('⟹', argType, resultType, 1));

    return resultType;
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
          return [p, `${
            ctx.name2str(op)} ${
            yield [[args[0], 'toStr'], ctx, idents, ps[0]]}`];
        }

        if(arity === 2)
          return [p, `${
            yield [[args[0], 'toStr'], ctx, idents, ps[0]]} ${
            ctx.name2str(op)} ${
            yield [[args[1], 'toStr'], ctx, idents, ps[1]]}`];

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
    return [ctx.getPrec(' '), `${
      yield [[target, 'toStr'], ctx, idents, ps[0]]} ${
      yield [[arg, 'toStr'], ctx, idents, ps[1]]}`];
  }
}

module.exports = Object.assign(Expr, {
  Ident,
  Lambda,
  Call,
});

const Unifier = require('./unifier');

const {TypeUnifier} = Unifier;