'use strict';

const assert = require('assert');
const Expr = require('./expr');
const cs = require('./parser-ctors');
const su = require('./str-util');

const {Term, Unary, Binary, Binder} = cs;
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

    while(1){
      if(ctx.hasOpOrBinder(name)){
        iPrev = j;
        return name;
      }

      if(i === strLen) break;

      const c = str[i];
      if(/[\s\(\)\.]/.test(c)) break;

      name += c;
      inc();
    }

    iPrev = j;
    return name;
  };

  const parse = function*(idents=O.obj()){
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

    const reduceStack = () => {
      let first = 1;

      while(1){
        const len = stack.length;

        if(len === 0){
          assert(first);
          break;
        }

        first = 0;

        const top = stack[len - 1];

        if(top.isTerm){
          if(len === 1) break;

          const prev = stack[len - 2];

          if(prev.isTerm){
            pop(2);
            push(new Term(new Call(prev.expr, top.expr)));
            continue;
          }

          break;
        }

        if(top.isUnary)
          break;

        if(top.isBinary){
          O.noimpl();
        }

        if(top.isLambda){
          O.noimpl();
        }

        assert.fail();
      }
    };
    
    while(1){
      reduceStack();

      const tk = getToken();
      if(tk === ')') break;

      if(tk === '('){
        const expr = yield [parse, idents];

        if(i === strLen){
          iPrev = parens.pop();
          err('Unmatched open parenthese');
        }
        
        assert(str[inc()] === ')');

        push(new Term(expr));
        continue;
      }

      if(ctx.hasOp(tk)){
        if(ctx.hasUnaryOp(tk)){
          push(new Unary(tk));
          continue;
        }

        if(ctx.hasBinaryOp(tk)){
          push(new Binary(tk));
          continue;
        }

        assert.fail();
      }

      if(ctx.hasBinder(tk)){
        continue;
      }

      if(!(ctx.hasIdent(tk) || O.has(idents, tk)))
        err(`Undefined identifier ${O.sf(tk)}`);

      push(new Term(new Ident()));
    }

    if(stack.length === 0)
      err('Empty group');

    return new Ident('test');
  };

  try{
    const expr = O.rec(parse);

    if(i !== str.length){
      assert(str[i] === ')');
      err('Unmatched closed parenthese');
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
    const info = this.getOpOrBinderInfo(name);
    if(info) return info[1].length;
    return null;
  }

  getOpOrBinderInfo(name){
    if(this.hasOp(name)) return this.ops[name];
    if(this.hasBinder(name)) return this.binders[name];
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