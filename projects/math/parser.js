'use strict';

const assert = require('assert');
const Expr = require('./expr');
const cs = require('./parser-ctors');
const su = require('./str-util');

const {Term, Op, Binder, End} = cs;
const {Ident, Call, Lambda} = Expr;

const parse = (ctx, str) => {
  const strLen = str.length;
  const parens = [];

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

    if(/[\(\)\.]/.test(c)){
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
          if(!ctx.hasOpOrBinder(name + c)) break;
          
          name += c;
          inc();
        }

        return name;
      }

      if(i === strLen) break;

      const c = str[i];
      if(/[\s\(\)\.]/.test(c)) break;

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

  const op2str = name => {
    return su.addParens(ctx.name2str(name));
  };

  const parse = function*(idents=O.obj(), isGroup=0){
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
      const {prec} = top;

      while(1){
        const slen = stack.length;
        assert(slen >= 1);

        const opnd2 = stack[slen - 1];
        assert(opnd2.isTerm);

        if(slen === 1) break;
        assert(slen >= 3);

        const op = stack[slen - 2];
        assert(op.isBinary);

        const opPrec = op.precs[1];
        if(prec >= opPrec) break;

        const opnd1 = stack[slen - 3];
        assert(opnd1.isTerm);

        const expr1 = opnd1.expr;
        const expr2 = opnd2.expr;

        pop(3);
        push(new Term(new Call(new Call(new Ident(op.name), expr1), expr2)));
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
            const name = prev.obtainedByUnaryOp;

            if(name !== null)
              err(`Cannot mix unary operator ${op2str(name)} with function application`);

            pop(2);
            push(new Term(new Call(prev.expr, top.expr)));

            continue;
          }

          if(prev.isUnary){
            const {name} = prev;

            pop(2);
            push(new Term(new Call(new Ident(name), top.expr), name));

            continue;
          }

          break;
        }

        if(top.isOp){
          if(top.isUnary){
            if(slen === 1) break;

            const prev = stack[slen - 2];

            if(prev.isTerm)
              err(`Unary operator ${op2str(top.name)} immediately after a term`);

            break;
          }

          if(top.isBinary){
            if(slen === 1){
              if(isOnlyInGroup())
                return new Ident(top.name);

              err(`Binary operator ${op2str(top.name)} at the beginning of a group`);
            }

            const prev = stack[slen - 2];

            if(prev.isOp){
              const {isUnary, isBinary} = prev;
              assert(isUnary || isBinary);

              err(`Binary operator ${op2str(top.name)} immediately after ${
                isUnary ? 'unary' : 'binary'} operator ${op2str(prev.name)}`);
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

      if(tkNext !== ')') return; 0;

      getToken();
      return 1;
    };
    
    while(1){
      const ret = reduceStack();
      if(ret) return ret;

      const tk = getToken();
      if(tk === ')') break;

      if(tk === '('){
        const expr = yield [parse, idents, 1];

        if(i === strLen){
          iPrev = parens[0];
          err(`Unmatched open parenthese`);
        }
        
        assert(str[inc()] === ')');

        push(new Term(expr));
        continue;
      }

      if(ctx.hasOpOrBinder(tk)){
        const info = ctx.getInfo(tk);

        if(ctx.hasOp(tk)){
          push(new Op(tk, info));
          continue;
        }

        if(ctx.hasBinder(tk)){
          const name = tk;
          const isLam = name === 'λ';

          if(!isLam && isOnlyInGroup())
            return new Ident(name);

          const identsArr = [];

          while(1){
            const tk = getToken();
            if(tk === '.') break;

            if(/[\(\)]/.test(tk))
              err(`Missing dot separator for ${op2str(name)}`);

            if(ctx.hasOpOrBinder(tk))
              err(`Identifier ${
                op2str(tk)} cannot be used as a bound variable, because it has already been declared as ${
                ctx.hasOp(tk) ? 'an operator' : 'a binder'}`);

            identsArr.push(tk);
          }

          if(identsArr.length === 0)
            err(`Binder ${op2str(name)} must have at least one bound variable`);

          const identsNew = Object.assign(O.arr2obj(identsArr), idents);
          const expr = yield [parse, identsNew];

          const expr1 = identsArr.reduceRight((expr, ident) => {
            const lam = new Lambda(ident, expr);

            if(isLam) return lam;
            return new Call(new Ident(name), lam);
          }, expr);

          push(new Term(expr1));
          reduceStack();

          continue;
        }

        assert.fail();
      }

      if(!(ctx.hasIdent(tk) || O.has(idents, tk)))
        err(`Undefined identifier ${O.sf(tk)}`);

      push(new Term(new Ident(tk)));
    }

    if(stack.length === 0)
      err(`Empty ${isGroup ? 'group' : 'expression'}`);

    const last = O.last(stack);

    if(last.isOp)
      err(`Operator ${op2str(last.name)} at the end of a group`);

    assert(last.isTerm);

    push(new End());
    combineStackElems();

    assert(stack.length === 2);
    assert(pop().isEnd);

    const result = stack[0];
    assert(result.isTerm);

    return result.expr;
  };

  try{
    const expr = O.rec(parse);

    if(i !== str.length){
      assert(str[i] === ')');
      iPrev = i;
      err(`Unmatched closed parenthese`);
    }

    return [1, expr];
  }catch(e){
    if(!(e instanceof ParserError)) throw e;
    return [0, e];
  }
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
  Context,
  ParserError,
};