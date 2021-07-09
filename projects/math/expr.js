'use strict';

const assert = require('assert');
const util = require('./util');
const su = require('./str-util');

const {isStr, isSym, isStrOrSym} = util;

class Expr{
  static mkUnOp(op, e1, isType){
    return new Call(new Ident(op, isType), e1, isType);
  }

  static mkBinOp(op, e1, e2, isType){
    return new Call(this.mkUnOp(op, e1, isType), e2, isType);
  }

  static mkBinder(name, lam){
    return this.mkUnOp(name, lam);
  }

  #typeInfo = null;
  #type = null;

  constructor(isType=0){
    this.isType = isType;
  }

  get ctor(){ return this.constructor; }

  get isIdent(){ return 0; }
  get isLam(){ return 0; }
  get isCall(){ return 0; }

  get type(){
    assert(!this.isType);

    if(this.#type !== null)
      return this.#type;

    const typeInfo = this.#typeInfo;
    assert(typeInfo !== null);

    const [unifier, typeRaw] = typeInfo;
    const type = O.rec([typeRaw, 'performAssignments'], unifier.assignments);

    this.#type = type;
    return type;
  }

  *alphaV(){ O.virtual('alphaV'); }
  *betaV(){ O.virtual('betaV'); }
  *substIdent(){ O.virtual('substIdent'); }
  *getSymIdents(){ O.virtual('getSymIdents'); }
  *getFreeIdents(){ O.virtual('getFreeIdents'); }
  *renameIdents(){ O.virtual('renameIdents'); }
  *getTypeU(){ O.virtual('getTypeU'); }
  *eq1(){ O.virtual('eq1'); }
  *toStr1(){ O.virtual('toStr1'); }

  from(...args){
    const expr = new this.ctor(...args);
    expr.isType = this.isType;
    return expr;
  }

  log(ctx){
    log(O.rec([this, 'toStr'], ctx));
  }

  getUnOp(ctx, checkArity=1){
    if(!this.isCall) return null;

    const {target, arg} = this;
    if(!target.isIdent) return null;

    const op = target.name;
    if(checkArity && !ctx.hasUnaryOp(op)) return null;

    return [op, arg];
  }

  getBinOp(ctx){
    if(!this.isCall) return null;

    const {target, arg} = this;
    const un = target.getUnOp(ctx, 0);

    if(un === null) return null;
    if(!ctx.hasBinaryOp(un[0])) return null;

    return [...un, arg];
  }

  getBinder(ctx){
    const un = this.getUnOp(ctx, 0);
    if(un === null) return null;

    const [binder, lam] = un;
    if(!ctx.hasBinder(binder)) return null;
    if(!lam.isLam) return null;

    return [binder, lam.name, lam.expr];
  }

  getUni(ctx){
    const binder = this.getBinder(ctx);

    if(binder === null) return null;
    if(binder[0] !== '∀') return null;

    return binder.slice(1);
  }

  getImp(ctx){
    const bin = this.getBinOp(ctx);
    
    if(bin === null) return null;
    if(bin[0] !== '⟶') return null;

    return bin.slice(1);
  }

  getPropInfo(ctx){
    const unis = [];
    const imps = [];

    let e = this;

    while(1){
      const uni = e.getUni(ctx);

      if(uni !== null){
        unis.push(uni[0]);
        e = uni[1];
        continue;
      }

      const imp = e.getImp(ctx);

      if(imp !== null){
        imps.push(imp[0]);
        e = imp[1];
        continue;
      }

      imps.push(e);
      break;
    }

    return [unis, imps];
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

    const identsObj = yield [[this, 'getSymIdents']];
    const unifier = new TypeUnifier(ctx, identsObj);

    yield [[this, 'getType'], unifier];

    return O.tco([unifier, 'solve']);
  }

  *getType(unifier){
    assert(!this.isType);
    assert(this.#typeInfo === null);

    const type = yield [[this, 'getTypeU'], unifier];
    this.#typeInfo = [unifier, type];

    return type;
  }

  *simplify(ctx){
    assert(!this.isType);

    let expr = yield [[this, 'alpha'], ctx];
    let result = yield [[expr, 'unifyTypes'], ctx];

    if(result[0] === 0)
      return [0, `Unification error: ${result[1]}`];

    expr = yield [[expr, 'beta'], ctx];

    const [unis, imps] = expr.getPropInfo(ctx);

    expr = imps.reduceRight((e1, e2) => {
      return Expr.mkBinOp('⟶', e2, e1);
    });

    expr = unis.reduceRight((e, sym) => {
      return Expr.mkBinder('∀', new Lambda(sym, e));
    }, expr);

    result = yield [[expr, 'unifyTypes'], ctx];
    assert(result[0]);

    return [1, expr];
  }

  *eq(other){
    assert(this.isType === other.isType);
    return O.tco([this, 'eq1']);
  }

  *hasIdent(sym){
    assert(isSym(sym));

    const idents = yield [[this, 'getSymIdents']];
    return O.has(idents, sym);
  }

  *performAssignments(assignments){
    let e = this;

    for(const [sym, expr] of assignments){
      // O.z=1
      // debugger;
      e = yield [[e, 'substIdent'], sym, expr];
    }

    return e;
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

    assert(isStrOrSym(name));
    this.name = name;
  }

  get isStr(){ return isStr(this.name); }
  get isSym(){ return isSym(this.name); }

  getName(ctx, idents){
    const sym = this.name;

    if(isStr(sym))
      return sym;
    // return String(this.name).match(/\d+/)[0];

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
    // const {name} = this;
    // if(!O.has(idents, name)) return this;
    // return this.from(idents[name]);

    const {name} = this;
    const name1 = O.has(idents, name) ? idents[name] : name;
    return this.from(name1);
  }

  *betaV(ctx){
    return this;
  }

  *substIdent(name, expr){
    // if(O.z)debugger; // Ident
    // if(String(name).includes(9))debugger;

    if(this.name === name) return expr;
    return this;
  }

  *getSymIdents(idents=O.obj()){
    const {name} = this;

    if(isSym(name))
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

  *getTypeU(unifier){
    const {ctx} = unifier;
    const {name} = this;

    if(isStr(name)){
      assert(ctx.has(name));
      const type = ctx.getType(name);
      return O.tco([type, 'alpha'], ctx);
    }

    return unifier.getIdentType(name);
  }

  *eq1(ctx, other){
    return this.name === other.name;
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
    const {name} = this;
    const expr = yield [[this.expr, 'betaV'], ctx];

    eta: if(0){
      if(!expr.isCall) break eta;

      const {target, arg} = expr;

      if(!arg.isIdent) break eta;
      if(arg.name !== name) break eta;
      if(yield [[target, 'hasIdent'], name]) break eta;

      return O.tco([target, 'betaV'], ctx);
    }

    return this.from(name, expr);
  }

  *substIdent(nm, e){
    // if(O.z)debugger; // Lambda
    const {name, expr} = this;
    return this.from(name, yield [[expr, 'substIdent'], nm, e]);
  }

  *getSymIdents(idents=O.obj()){
    const {name, expr} = this;

    if(isSym(name))
      idents[name] = 1;

    return O.tco([expr, 'getSymIdents'], idents);
  }

  *getFreeIdents(ctx, free=O.obj(), bound=O.obj()){
    const {name, expr} = this;
    bound[name] = 1;
    return O.tco([expr, 'getFreeIdents'], ctx, free, bound);
  }

  *renameIdents(ctx, idents){
    assert.fail();
  }

  *getTypeU(unifier){
    const {ctx} = unifier;
    const {name, expr} = this;

    const argType = unifier.getIdentType(name);
    const exprType = yield [[expr, 'getType'], unifier];

    return Expr.mkBinOp('⟹', argType, exprType, 1);
  }

  *eq1(ctx, other){
    if(this.name !== other.name) return 0;
    return O.tco(yield [[this.expr, 'eq1'], other.expr]);
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

    const expr = yield [[target.expr, 'substIdent'], target.name, arg];
    return O.tco([expr, 'beta'], ctx);
  }

  *substIdent(name, expr){
    // if(O.z)debugger; // Call
    const {target, arg} = this;//yield [[this, 'alphaV'], ctx];

    return this.from(
      yield [[target, 'substIdent'], name, expr],
      yield [[arg, 'substIdent'], name, expr],
    );
  }

  *getSymIdents(idents=O.obj()){
    const {target, arg} = this;

    yield [[target, 'getSymIdents'], idents];
    return O.tco([arg, 'getSymIdents'], idents);
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

  *getTypeU(unifier){
    const {ctx} = unifier;
    const {target, arg} = this;

    const targetType = yield [[target, 'getType'], unifier];
    const argType = yield [[arg, 'getType'], unifier];
    const resultType = new Ident(util.newSym(), 1);

    unifier.addEq(targetType, Expr.mkBinOp('⟹', argType, resultType, 1));

    return resultType;
  }

  *eq1(ctx, other){
    if(!(yield [[this.target, 'eq1'], other.target])) return 0;
    return O.tco([this.arg, 'eq1'], other.arg);
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