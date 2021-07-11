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

  static fromImps(imps){
    assert(imps.length !== 0);
    return O.last(imps).addImps(imps.slice(0, -1));
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
    if(typeInfo === null) return null;

    const [unifier, typeRaw] = typeInfo;
    const type = O.rec([typeRaw, 'performAssignments'], unifier.assignments);

    this.#type = type;
    return type;
  }

  set type(type){
    assert(!this.isType);
    this.#type = type;
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
    expr.#typeInfo = this.#typeInfo;

    return expr;
  }

  log(ctx){
    log(O.rec([this, 'toStr'], ctx));
  }

  getUnOp(ctx=null){
    if(!this.isCall) return null;

    const {target, arg} = this;
    if(!target.isIdent) return null;

    const op = target.name;
    if(ctx !== null && !ctx.hasUnaryOp(op)) return null;

    return [op, arg];
  }

  getBinOp(ctx=null){
    if(!this.isCall) return null;

    const {target, arg} = this;
    const un = target.getUnOp();

    if(un === null) return null;
    if(ctx !== null && !ctx.hasBinaryOp(un[0])) return null;

    return [...un, arg];
  }

  getBinder(ctx=null){
    const un = this.getUnOp();
    if(un === null) return null;

    const [binder, lam] = un;
    if(ctx !== null && !ctx.hasBinder(binder)) return null;
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

  *alpha(ctx, idents=O.obj()){
    if(!this.isType){
      const expr = yield [[this, 'alphaV'], ctx, idents];
      const type = this.type !== null ?
        yield [[this.type, 'alpha'], ctx, idents] : null;

      expr.type = type;

      return expr;
    }

    const identsNew = yield [[this, 'getFreeIdents'], ctx];

    for(const name of O.keys(identsNew)){
      // assert(isStr(name));
      // assert(name.startsWith('\''));

      if(O.has(idents, name)) continue;
      idents[name] = util.newSym();
    }

    return O.tco([this, 'renameIdents'], ctx, idents);
  }

  *beta(ctx){
    assert(!this.isType);

    const expr = yield [[this, 'alpha'], ctx];
    return O.tco([expr, 'betaV'], ctx);
  }

  *mkTypeUnifier(ctx){
    assert(!this.isType);

    const identsObj = yield [[this, 'getSymIdents']];
    const unifier = yield [[Unifier.TypeUnifier, 'new'], ctx, identsObj];

    yield [[this, 'getType'], unifier];

    return unifier;
  }

  *unifyTypes(ctx){
    const unifier = yield [[this, 'mkTypeUnifier'], ctx];
    return O.tco([unifier, 'solve']);
  }

  // Private method used by `unifyTypes` and `getTypeU`
  // Do not call from external code!
  *getType(unifier){
    assert(!this.isType);
    // assert(this.#typeInfo === null);

    const type = yield [[this, 'getTypeU'], unifier];
    this.#typeInfo = [unifier, type];

    return type;
  }

  addImps(imps){
    return imps.reduceRight((e1, e2) => {
      return Expr.mkBinOp('⟶', e2, e1);
    }, this);
  }

  addUnis(unis, idents=null){
    return unis.reduceRight((e, sym) => {
      if(idents !== null && !O.has(idents, sym))
        return e;

      return Expr.mkBinder('∀', new Lambda(sym, e));
    }, this);
  }

  *simplify(ctx){
    assert(!this.isType);

    const freeIdents = yield [[this, 'getFreeIdents'], ctx];
    assert(util.empty(freeIdents));

    let expr = yield [[this, 'alpha'], ctx];
    let result = yield [[expr, 'unifyTypes'], ctx];

    if(result[0] === 0)
      return [0, `Unification error: ${result[1]}`];

    expr = yield [[expr, 'beta'], ctx];

    const [unis, imps] = expr.getPropInfo(ctx);

    expr = Expr.fromImps(imps);
    expr = expr.addUnis(unis, yield [[expr, 'getFreeIdents'], ctx]);

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

  *spec(ctx, e){
    if(this.getUni(ctx) === null)
      return [0, `Expression is not universally quantified`];

    const e1 = yield [[e, 'alpha'], ctx];
    const expr = new Call(this.arg, e1);

    return O.tco([expr, 'simplify'], ctx);
  }

  // Modus Ponens
  *mp(ctx, e){
    let result;

    result = yield [[this, 'simplify'], ctx];
    if(result[0] === 0) return result;
    const expr = result[1];

    result = yield [[e, 'simplify'], ctx];
    if(result[0] === 0) return result;
    const ant = result[1];

    const [unis1, imps1] = expr.getPropInfo(ctx);
    const [unis2, imps2] = ant.getPropInfo(ctx)//[[ant.arg.name], [ant.arg.expr]]

    if(imps1.length === 1)
      return [0, `No premises found`];

    const vars1 = O.arr2obj(unis1, null);
    const vars2 = O.arr2obj(unis2, null);
    const vars = util.mergeUniq(vars1, vars2);

    const unifier = yield [[Unifier.ValueUnifier, 'new'], ctx, vars];

    const lhs = imps1.shift();
    const rhs = Expr.fromImps(imps2);

    unifier.addEq(lhs, rhs);
    result = yield [[unifier, 'solve']];
    if(result[0] === 0) return result;

    const exprNew = Expr.fromImps(imps1);
    const freeVars = [];

    let exprFinal = exprNew;

    for(const sym of O.keys(vars)){
      const val = vars[sym];

      if(val === null){
        freeVars.push(sym);
        continue;
      }

      exprFinal = yield [[exprFinal, 'substIdent'], sym, val];
    }

    /*const freeIdents = yield [[exprFinal, 'getFreeIdents'], ctx];

    for(const sym of freeVars){
      if(!O.has(vars2, sym)) continue;
      if(!O.has(freeIdents, sym)) continue;

      return [0, `Universally quantified variable escaped antecedent`];
    }*/

    return [1, [freeVars, exprFinal]];
  }

  // Direct application of Modus Ponens
  *apply(ctx, e){
    const result = yield [[this, 'mp'], ctx, e];
    if(result[0] === 0) return result;

    const [freeVars, expr] = result[1];
    const exprNew = expr.addUnis(freeVars);

    return O.tco([exprNew, 'simplify'], ctx);
  }

  getLamArgType(){
    assert(this.isLam);

    const {type} = this;
    assert(type !== null);

    const binOp = type.getBinOp();
    assert(binOp !== null);
    assert(binOp[0] === '⟹');

    return binOp[1];
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
      idents[name] = this.type;

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

    /*eta: if(0){
      if(!expr.isCall) break eta;

      const {target, arg} = expr;

      if(!arg.isIdent) break eta;
      if(arg.name !== name) break eta;
      if(yield [[target, 'hasIdent'], name]) break eta;

      return O.tco([target, 'betaV'], ctx);
    }*/

    return this.from(name, expr);
  }

  *substIdent(nm, e){
    // if(O.z)debugger; // Lambda
    const {name, expr} = this;
    return this.from(name, yield [[expr, 'substIdent'], nm, e]);
  }

  *getSymIdents(idents=O.obj()){
    const {name, expr} = this;

    if(isSym(name)){
      const type = this.type;

      if(type !== null){
        const binOp = type.getBinOp();
        assert(binOp !== null);

        idents[name] = binOp[1];
      }else{
        idents[name] = null;
      }
    }

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

        if(arity === 1)
          return [p, `${
            ctx.name2str(op)} ${
            yield [[args[0], 'toStr'], ctx, idents, ps[0]]}`];

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