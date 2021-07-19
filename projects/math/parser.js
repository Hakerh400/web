'use strict';

const assert = require('assert');
const Expr = require('./expr');
const Context = require('./context');
const cs = require('./parser-ctors');
const util = require('./util');
const su = require('./str-util');

const {Term, Op, Binder, End} = cs;
const {Ident, Call, Lambda} = Expr;

const reservedChars = '(),.:#';

const reservedCharsObj = O.arr2obj(reservedChars);

const isReservedChar = tk => {
  if(/\s/.test(tk)) return 1;
  return O.has(reservedCharsObj, tk);
};

const parse = function*(ctx, str, isType=0){
  const proof = !isType ? ctx.proof : null;
  const subgoal = proof !== null ? proof.subgoal : null;
  const premises = subgoal !== null ? subgoal.premises : null;
  const goal = subgoal !== null ? subgoal.goal : null;

  const strLen = str.length;
  const parens = [];

  const lamSym = ctx.getMeta('lambda');

  let iPrev = 0;
  let i = 0;

  const err = msg => {
    throw new ParserError(ctx, str, iPrev, msg);
  };

  const inc = () => {
    return iPrev = i++;
  };

  // let z = {};
  const getToken = () => {
    // if(O.has(z, i))zz;z[i]=1;
    while(i < strLen && /\s/.test(str[i])) i++;
    if(i === strLen) return ')';

    const c = str[i];
    if(c !== ')') inc();

    if(isReservedChar(c)){
      if(c === '(')
        parens.push(iPrev);

      return c;
    }

    let name = c;
    let j = i - 1;

    loop: while(1){
      if(ctx.hasOpOrBinder(name)){
        iPrev = j;

        while(i !== strLen){
          const c = str[i];
          const nameNew = name + c;
          
          if(!ctx.hasOpOrBinder(nameNew)) break;

          name = nameNew;
          inc();
        }

        return name;
      }

      if(i === strLen) break;

      const c = str[i];
      if(isReservedChar(c)) break;

      const nameNew = name + c;

      for(let i = 1; i !== nameNew.length; i++)
        if(ctx.hasOpOrBinder(nameNew.slice(i)))
          break loop;

      name = nameNew;
      inc();
    }

    iPrev = j;
    return name;
  };

  const queryToken = () => {
    let j = i;
    let jPrev = iPrev;

    const tk = getToken();

    i = j;
    iPrev = jPrev;

    return tk;
  };

  const ident2str = name => {
    return ctx.name2str(name, 1);
  };

  const parse = function*(isType=0, idents=null, isGroup=0){
    if(!isType && idents === null)
      idents = O.obj();

    const stack = [];

    const push = elem => {
      stack.push(elem);
    };

    const pop = (n=1) => {
      assert(stack.length !== 0);
      assert(n > 0);

      const elem = O.last(stack);

      for(let i = 0; i !== n; i++)
        stack.pop();

      return elem;
    };

    const combineStackElems = () => {
      const slen = stack.length;
      assert(slen >= 2);

      const top = pop();
      assert(top.isBinary);

      const {prec} = top;

      while(1){
        const slen = stack.length;
        assert(slen >= 1);

        const opnd2 = stack[slen - 1];
        assert(opnd2.isTerm);
        if(slen === 1) break;

        const op = stack[slen - 2];

        if(op.isUnary){
          pop(2);
          push(new Term(newCall(newIdent(op.name), opnd2.expr)));
          continue;
        }

        assert(op.isBinary);
        assert(slen >= 3);

        const opPrec = op.precs[1];
        if(prec >= opPrec) break;

        const opnd1 = stack[slen - 3];
        assert(opnd1.isTerm);

        const expr1 = opnd1.expr;
        const expr2 = opnd2.expr;

        pop(3);
        push(new Term(newCall(newCall(newIdent(op.name), expr1), expr2)));
      }

      stack.push(top);
    };

    const reduceStack = () => {
      let first = 1;

      while(1){
        const slen = stack.length;

        if(slen === 0){
          assert(first);
          break;
        }

        first = 0;

        const top = stack[slen - 1];

        if(top.isTerm){
          if(slen === 1) break;

          const prev = stack[slen - 2];

          if(prev.isTerm){
            // err(`Cannot mix unary operator ${ident2str(name)} with function application`);

            pop(2);
            push(new Term(newCall(prev.expr, top.expr)));

            continue;
          }

          if(prev.isUnary){
            break;
            const {name} = prev;

            pop(2);
            push(new Term(newCall(newIdent(name), top.expr)));

            continue;
          }

          break;
        }

        if(top.isOp){
          if(slen === 1 && isOnlyInGroup())
            return newIdent(top.name);

          if(top.isUnary){
            if(slen === 1) break;

            const prev = stack[slen - 2];

            if(prev.isTerm)
              err(`Unary operator ${ident2str(top.name)} immediately after a term`);

            break;
          }

          if(top.isBinary){
            if(slen === 1)
              err(`Binary operator ${ident2str(top.name)} at the beginning of ${exprOrGroup(1)}`);

            const prev = stack[slen - 2];

            if(prev.isOp){
              const {isUnary, isBinary} = prev;
              assert(isUnary || isBinary);

              err(`Binary operator ${ident2str(top.name)} immediately after ${
                isUnary ? 'unary' : 'binary'} operator ${ident2str(prev.name)}`);
            }

            assert(prev.isTerm);
            combineStackElems();

            break;
          }

          assert.fail();
        }

        assert.fail();
      }
    };

    const isOnlyInGroup = () => {
      if(!isGroup) return 0;
      const tkNext = queryToken();

      if(tkNext !== ')') return 0;

      getToken();
      return 1;
    };

    const checkIdent = tk => {
      if(isReservedChar(tk))
        err(`Illegal token ${O.sf(tk)}`);

      const startsWithApostrophe = tk.startsWith('\'');

      if(startsWithApostrophe && tk.length === 1)
        err(`Illegal identifier ${ident2str(tk)}`);

      if(isType){
        if(!startsWithApostrophe)
          err(`Type variable must start with (\') character`)

        return;
      }

      if(startsWithApostrophe)
        err(`Illegal use of type variable ${ident2str(tk)} in value context`);
    };

    const exprOrGroup = (article=0) => {
      const str = isGroup ? 'group' : 'expression';
      if(!article) return str;
      return `${isGroup ? 'a' : 'an'} ${str}`;
    };

    const newIdent = name => {
      const expr = newExpr(Ident, name);
      if(!isType) return expr;

      if(name.startsWith('\'')){
        expr.typeArity = 0;
        return expr;
      }

      const info = ctx.getInfo(name);
      assert(info !== null);

      const arity = info[0];
      assert(typeof arity === 'number');

      expr.typeArity = arity;
      return expr;
    };

    const newLambda = (name, expr) => {
      assert(!isType);
      return newExpr(Lambda, name, expr);
    };

    const newCall = (target, arg) => {
      const expr = newExpr(Call, target, arg);
      if(!isType) return expr;

      const arity = target.typeArity;
      assert(arity !== null);

      checkFinished(arg);

      if(arity === 0){
        const ident = target.getCall()[0];
        assert(ident.isIdent);

        err(`Too many arguments for type ${O.rec([ident, 'toStr'], ctx)}`);
      }

      expr.typeArity = arity - 1;
      return expr;
    };

    const newExpr = (ctor, ...args) => {
      const expr = new ctor(...args);
      if(isType) expr.isType = 1;
      return expr;
    };
    
    while(1){
      const ret = reduceStack();
      if(ret) return ret;

      const tk = getToken();
      if(tk === ')') break;

      if(tk === '('){
        const expr = yield [parse, isType, idents, 1];

        if(i === strLen){
          iPrev = parens[0];
          err(`Unmatched open parenthese`);
        }

        assert(str[inc()] === ')');
        parens.pop();

        push(new Term(expr));
        continue;
      }

      if(tk === '#'){
        if(premises === null)
          err(`Cannot use \`#\` outside of a proof`);

        assert(!isType);
        assert(goal !== null);

        const premisesNum = premises.length;
        let expr;

        let tk = getToken();

        if(tk === '.'){
          expr = goal;
        }else{
          if(!su.isInt(tk))
            err(`Expected a premise number or a goal after \`#\``);

          const i = Number(tk) - 1;

          if(!(i >= 0 && i < premisesNum))
            err(`Invalid premise number ${tk} found in \`#\``);

          expr = premises[i];

          if(getToken() !== '.')
            err(`Expected \`.\` after the premise number`);
        }

        tk = getToken();

        if(tk !== '.'){
          for(const c of tk){
            if(c === ')')
              err(`Missing another \`.\` after the list of references`);

            if(!/[01]/.test(c))
              err(`Invalid character ${O.sf(c)} found in \`#\``);

            if(expr.isIdent)
              err(`Cannot dereference an identifier`);

            const n = c | 0;

            if(expr.isLam){
              if(n) err(`Cannot dereference second sub-expression from a lambda expression`);

              expr = expr.expr;
              continue;
            }

            if(expr.isCall){
              expr = n ? expr.arg : expr.target;
              continue;
            }

            assert.fail();
          }

          if(getToken() !== '.')
            err(`Expected \`.\` after the list of references`);
        }

        let name = getToken();

        if(name === ')')
          err(`Missing identifier name in \`#\``);

        if(isReservedChar(name))
          err(`${O.sf(name)} is not a valid identifier name`);
        
        if(!ctx.hasVal(name)){
          const toStrIdents = util.obj2();
          const symStrObj = toStrIdents[0];
          const strSymObj = toStrIdents[1];

          yield [[subgoal, 'toStr'], ctx, toStrIdents];

          if(!O.has(strSymObj, name))
            err(`Undefined identifier ${O.sf(name)} used in \`#\``);

          name = strSymObj[name];
        }

        const symNew = util.newSym();

        expr = yield [[expr, 'substIdent'], name, new Ident(symNew)];
        expr = new Lambda(symNew, expr);

        const freeIdents = yield [[expr, 'getFreeIdents'], ctx];
        const freeIdentsArr = O.keys(freeIdents);

        if(freeIdentsArr.length !== 0){
          const toStrIdents = util.obj2();
          const symStrObj = toStrIdents[0];

          yield [[subgoal, 'toStr'], ctx, toStrIdents];

          const sym = freeIdentsArr[0];
          assert(O.has(symStrObj, sym));

          err(`Identifier ${O.sf(symStrObj[sym])} appears free in \`#\``);
        }

        push(new Term(expr));
        continue;
      }

      const has = ctx.has(tk);
      const hasType = ctx.hasType(tk);

      if(!isType && hasType)
        err(`Type identifier ${ident2str(tk)} in value context`);

      if(isType && has && !hasType)
        err(`Value symbol ${ident2str(tk)} cannot be used in type context`);

      if(ctx.hasOpOrBinder(tk)){
        const info = ctx.getPrecInfo(tk);

        if(ctx.hasOp(tk)){
          push(new Op(tk, info));
          continue;
        }

        if(ctx.hasBinder(tk)){
          if(isType)
            err(`Binder ${ident2str(tk)} in type context`);

          const name = tk;
          const isLam = lamSym !== null && name === lamSym;

          if(!isLam && isOnlyInGroup())
            return newIdent(name);

          const identsArr = [];

          while(1){
            const tk = getToken();
            if(tk === '.') break;

            if(/[\(\)]/.test(tk))
              err(`Missing dot separator for ${ident2str(name)}`);

            if(!isType && ctx.hasType(tk))
              err(`Type identifier ${ident2str(tk)} cannot be used as a bound variable`);

            if(ctx.hasOpOrBinder(tk))
              err(`Identifier ${
                ident2str(tk)} cannot be used as a bound variable, because it has already been declared as ${
                ctx.hasOp(tk) ? 'an operator' : 'a binder'}`);

            identsArr.push(tk);
          }

          if(identsArr.length === 0)
            err(`Binder ${ident2str(name)} must have at least one bound variable`);

          assert(!isType);

          const identsNew = Object.assign(O.arr2obj(identsArr), idents);
          const expr = yield [parse, 0, identsNew];

          const expr1 = identsArr.reduceRight((expr, ident) => {
            const lam = newLambda(ident, expr);

            if(isLam) return lam;
            return newCall(newIdent(name), lam);
          }, expr);

          push(new Term(expr1));
          reduceStack();

          continue;
        }

        assert.fail();
      }

      if(!ctx.has(tk))
        checkIdent(tk);
      
      if(!isType && !(ctx.hasIdent(tk) || O.has(idents, tk)))
        err(`Undefined identifier ${O.sf(tk)}`);

      push(new Term(newIdent(tk)));
    }

    if(stack.length === 0)
      err(`Empty ${exprOrGroup()}`);

    const last = O.last(stack);

    if(last.isOp)
      err(`Operator ${ident2str(last.name)} at the end of ${exprOrGroup(1)}`);

    assert(last.isTerm);

    push(new End());
    combineStackElems();

    assert(stack.length === 2);
    assert(pop().isEnd);

    const result = stack[0];
    assert(result.isTerm);

    return result.expr;
  };

  const checkFinished = expr => {
    assert(isType);

    const arity = expr.typeArity;
    assert(arity !== null);

    if(arity === 0) return;

    const ident = expr.getCall()[0];
    assert(ident.isIdent);

    err(`Not enough arguments for type ${O.rec([ident, 'toStr'], ctx)}`);
  };

  try{
    const expr = O.rec(parse, isType);

    if(i !== str.length){
      assert(str[i] === ')');
      iPrev = i;
      err(`Unmatched closed parenthese`);
    }

    if(isType)
      checkFinished(expr);

    return [1, expr];
  }catch(e){
    if(!(e instanceof ParserError)) throw e;
    return [0, e];
  }
};

class ParserError{
  constructor(ctx, str, pos, msg){
    this.ctx = ctx;
    this.str = str;
    this.pos = pos;
    this.msg = msg;
  }
}

module.exports = {
  parse,
  ParserError,
};