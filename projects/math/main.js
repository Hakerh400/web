'use strict';

const assert = require('assert');
const parser = require('./parser');
const Expr = require('./expr');
const Context = require('./context');
const Subgoal = require('./subgoal');
const Editor = require('./editor');
const LineData = require('./line-data');
const specialChars = require('./special-chars');
const util = require('./util');
const su = require('./str-util');

const {min, max} = Math;
const {project} = O;
const {Ident, Call, Lambda} = Expr;

const {g} = O.ceCanvas(1);

const ws = 12;
const hs = 25;
const ofs = 15;

const smallNatMax = 1e3;
const mediumNatMax = 2 ** 30 - 1;

const idents = {
  // 'bool': 0,

  // 'True': `bool`,
  // 'False': `bool`,
  // 'undefined': `'a`,
  // 'isFunc': `'a ⟹ bool`,
};

const ops = {
  // '⟹': [2, [25, [1, 0]]],
  // '≡': [2, [70, [0, 1]]],

  // '⟶': [`bool ⟹ bool ⟹ bool`, [25, [1, 0]]],
  // '⟷': [`bool ⟹ bool ⟹ bool`, [24, [0, 1]]],
  // '∧': [`bool ⟹ bool ⟹ bool`, [35, [0, 1]]],
  // '∨': [`bool ⟹ bool ⟹ bool`, [30, [0, 1]]],
  // '¬': [`bool ⟹ bool`, [40, [0]]],
  // '=': [`'a ⟹ 'a ⟹ bool`, [50, [0, 1]]],
  // '≠': [`'a ⟹ 'a ⟹ bool`, [50, [0, 1]]],
  // ' ': [null, [80, [0, 1]]],
};

const binders = {
  // 'λ': null,
  // '∀': `('a ⟹ bool) ⟹ bool`,
  // '∃': `('a ⟹ bool) ⟹ bool`,
  // '∃!': `('a ⟹ bool) ⟹ bool`,
};

const spacing = {};

/*for(const key of O.keys(idents))
  idents[key] = [idents[key], [0, []]];

for(const key of O.keys(binders))
  binders[key] = [binders[key], [0, [0]]];

for(const obj of [idents, ops, binders]){
  for(const key of O.keys(obj)){
    const info = obj[key];
    const [typeInfo, precInfo] = info;
    const [prec, precs] = precInfo;

    if(typeof typeInfo === 'string'){
      const result = O.rec(parser.parse, ctx, typeInfo, 1);
      assert(result[0] === 1);

      info[0] = O.rec([result[1], 'alpha'], ctx);
    }

    const sum = precs.reduce((a, b) => a + b, 1);
    const div = sum * 2;

    for(let i = 0; i !== precs.length; i++){
      const p = prec + precs[i] / div;
      assert(!isNaN(p));

      precs[i] = p;
    }
  }
}*/

const mainEditor = new Editor();
const outputEditor = new Editor();

const linesData = [];

let iw, ih;
let w, h;

const main = () => {
  O.dbgAssert = 1;
  mainEditor.selected = 1;

  if(O.has(localStorage, project))
    load();

  mainEditor.updateLine(0);

  initCanvas();
  aels();

  onResize();
};

const initCanvas = () => {
  g.textBaseline = 'middle';
  g.textAlign = 'center';

  g.fontFamily = 'monospace';
  g.font((ws + hs) / 2);
};

const aels = () => {
  O.ael('keydown', onKeyDown);
  O.ael('keypress', onKeyPress);
  O.ael('resize', onResize);
};

const onNav = () => {
  const lineIndex = mainEditor.cy;
  const linesDataNum = linesData.length;

  if(lineIndex >= linesDataNum){
    outputEditor.clear();
    return;
  }

  const data = linesData[min(lineIndex, linesDataNum - 1)];
  outputEditor.setText(data.str);
};

const onUpdatedLine = lineIndex => {
  const {lines} = mainEditor;

  linesData.length = lineIndex;
  mainEditor.markedLine = null;

  for(let i = lineIndex; i !== lines.length; i++){
    const dataPrev = linesData[i - 1];
    const ctx = i === 0 ? new Context() : dataPrev.ctx;
    const data = O.rec(processLine, i, ctx);

    if(data === null){
      linesData[i] = dataPrev;
      continue;
    }

    linesData[i] = data;

    if(data.err){
      mainEditor.markedLine = [i, '#faa'];
      break;
    }
  }
}

const processLine = function*(lineIndex, ctx){
  const processResult = function*(result){
    if(!result) return result;

    if(result[0] === 0){
      const err = result[1];
      const msg = typeof err === 'string' ?
        err : err.msg//su.tab(err.pos, `^ ${err.msg}`);

      return O.breakRec(new LineData(lineIndex, ctx, msg, 1));
    }

    return result[1];
  };

  const call = function*(fn, ...args){
    const result = yield [fn, ...args];
    return O.tco(processResult, result);
  };

  const ret = str => {
    return [1, new LineData(lineIndex, ctx, str)];
  };

  const err = function*(msg){
    return O.tco(processResult, [0, msg]);
  };

  const syntErr = () => {
    return [0, `Syntax error near ${O.sf(line.trim())}`];
  };

  const {lines} = mainEditor;
  let line = lines[lineIndex];

  line = line.trimLeft();

  const eol = () => {
    return line.length === 0;
  };

  const neol = () => {
    return line.length !== 0;
  };

  const name2str = name => {
    return ctx.name2str(name, 2);
  };

  if(eol()) return null;

  const stack = [];

  const push = function*(str){
    stack.push(line);
    line = str;
  };

  const pop = function*(assertEmpty=1){
    assert(stack.length !== 0);

    if(assertEmpty)
      yield [call, assertEol];

    const str = line;
    line = stack.pop();

    return str;
  };

  const assertEol = function*(){
    if(neol())
      return [0, `Extra tokens found at the end: ${O.sf(line.trim())}`];

    return [1];
  };

  const assertFreeRule = function*(name){
    if(ctx.hasRule(name))
      return [0, `Rule ${O.sf(name)} already exists`];

    return [1];
  };

  const assertFree = function*(name){
    if(ctx.hasName(name))
      return [0, `Identifier ${name2str(name)} already exists`];

    return [1];
  };

  const assertDefined = function*(name){
    if(!ctx.hasName(name))
      return [0, `Undefined identifier ${name2str(name)}`];

    return [1];
  };

  const assertEq = function*(actual, str){
    const {isType} = actual;

    const expr = yield [call, parser.parse, ctx, str, isType];
    const expected = yield [call, [expr, 'simplify'], ctx];

    if(yield [[actual, 'eqAlpha'], expected])
      return [1];

    const str1 = yield [[expected, 'toStr'], ctx];
    const str2 = yield [[actual, 'toStr'], ctx];

    if(str2 !== str1)
      return [0, `${isType ? 'Types' : 'Values'} do not match\n${
        su.tab(1, `Expected: ${str1}`)}\n${
        su.tab(1, `Actual:${' '.repeat(2)} ${str2}`)}`];
  };

  const trimLine = (trim=1) => {
    if(!trim) return;
    line = line.trimLeft();
  };

  const advance = function*(str, trim){
    line = line.slice(str.length);
    trimLine(trim);

    return [1, str];
  };

  const getToken = function*(parens=0, trim){
    let match = line.match(/^[^\s\(\)\[\]\,\.\:]+/);

    if(match !== null)
      return O.tco(advance, match[0], trim);

    if(!parens) return [1, null];

    match = line.match(/^\(\s*([^\s\(\)\[\]\,\.\:]+)\s*\)/);
    if(match === null) return [1, null];

    yield [call, advance, match[0], trim];

    return [1, match[1]];
  };

  const getIdent = function*(){
    const name = yield [call, getToken, 1];

    if(name === null)
      return [0, `Missing identifier`];

    return [1, name];
  };

  const getExact = function*(str){
    if(!line.startsWith(str))
      return [0, `Expected ${O.sf(str)} near ${O.sf(line.trim())}`];

    return O.tco(advance, str);
  };

  const getSomeParens = function*(c1, c2, trim){
    const end = line.indexOf(c2);

    if(!line.startsWith(c1) || end === -1)
      return [0, `Invalid parenthesis near ${O.sf(line.trim())}`];
    
    let str = line.slice(1, end);
    line = line.slice(end + 1);
    trimLine(trim);

    str = str.trim();

    if(str.length === 0)
      return [1, []];

    return [1, str.split(',').map(a => a.trim())];
  };

  const getParens = function*(trim){
    return O.tco(getSomeParens, '(', ')', trim);
  };

  const getBrackets = function*(trim){
    return O.tco(getSomeParens, '[', ']', trim);
  };

  const getBraces = function*(trim){
    return O.tco(getSomeParens, '{', '}', trim);
  };

  const getInt = function*(min=null, max=null){
    if(min !== null) min = BigInt(min);
    if(max !== null) max = BigInt(max);

    if(min !== null && max !== null)
      assert(min <= max);

    const tk = yield [call, getToken];

    if(tk === null)
      return [0, `Missing number`];

    if(!su.isInt(tk))
      return [0, `Invalid number ${O.sf(tk)}`];

    const n = BigInt(tk);

    if(min !== null && n < min)
      return [0, `Number ${n} is too small (must be at least ${min})`];

    if(max !== null && n > max)
      return [0, `Number ${n} is too big (must be at most ${max})`];

    return [1, n];
  };

  const getNat = function*(max){
    return O.tco(getInt, 0, max);
  };

  const getSmallNat = function*(max=smallNatMax){
    assert(max <= smallNatMax);

    const n = yield [call, getNat, max];
    return [1, Number(n)];
  };

  const getMediumNat = function*(){
    const n = yield [call, getNat, mediumNatMax];
    return [1, Number(n)];
  };

  const getArity = function*(){
    return O.tco(getMediumNat);
  };

  const getIdentInfo = function*(){
    const elems = yield [call, getBrackets];

    if(elems.length !== 1)
      return [0, `Expected exactly one element in [${elems.join(', ')}]`];

    yield [call, push, elems[0]];

    const sort = yield [call, getToken];

    if(sort === null)
      return [0, `Missing identifier sort`];

    if(!O.has(parseIdentSortFuncs, sort))
      return [0, `Unknown identifier sort ${O.sf(sort)}`];

    const info = yield [call, parseIdentSortFuncs[sort]];
    yield [call, pop];

    return [1, info];
  };

  const getMeta = function*(name, addParens=1){
    let sym = ctx.getMeta(name);

    if(sym === null)
      return [0, `Meta symbol ${O.sf(name)} must already be defined`];

    if(addParens)
      sym = su.addParens(sym);

    return [1, sym];
  };

  const getExpr = function*(isType){
    const exprRaw = yield [call, parser.parse, ctx, line, isType];
    const expr = yield [call, [exprRaw, 'simplify'], ctx];

    line = '';

    return [1, expr];
  };

  const getProp = function*(){
    const prop = yield [call, getExpr];
    const boolSym = yield [call, getMeta, 'bool'];

    yield [call, assertEq, prop.type, boolSym];

    return [1, prop];
  };

  const getRuleName = function*(ruleType){
    const name = yield [call, getToken];

    if(name === null)
      return [0, `Missing ${ruleType} name`];

    yield [call, assertFreeRule, name];
    yield [call, getExact, ':'];

    return [1, name];
  };

  const parseIdentSortFuncs = {
    *prefix(){
      const arity = yield [call, getArity];
      return [1, ['operator', [arity, [0]]]];
    },

    *infixl(){
      const arity = yield [call, getArity];
      return [1, ['operator', [arity, [arity, arity + .5]]]];
    },

    *infixr(){
      const arity = yield [call, getArity];
      return [1, ['operator', [arity, [arity + .5, arity]]]];
    },

    *binder(){
      return [1, ['binder', [0, [0]]]];
    },
  };

  const insertIdentSortFuncs = {
    *identifier(name, info){
      ctx.idents = util.copyObj(ctx.idents)
      ctx.idents[name] = info;
    },

    *operator(name, info){
      ctx.ops = util.copyObj(ctx.ops)
      ctx.ops[name] = info;
    },

    *binder(name, info){
      ctx.binders = util.copyObj(ctx.binders)
      ctx.binders[name] = info;
    },
  };

  const metaSymbolFuncs = {
    *bool(name){
      yield [call, assertDefined, name];

      const arity = ctx.getTypeArity(name);

      if(arity !== 0)
        return [0, `Bool type cannot have arguments`];
    },

    *arrow(name){
      yield [call, assertDefined, name];

      const arity = ctx.getTypeArity(name);

      if(arity !== 2)
        return [0, `Arrow must be a binary type`];

      ctx.meta.arrow = name;
    },

    *lambda(name){
      yield [call, assertFree, name];
    },

    *uni(name){
      yield [call, assertDefined, name];

      if(ctx.hasType(name))
        return [0, `Universal quantifier cannot be a type`];

      const type = ctx.getType(name);
      assert(type !== null);

      const boolSym = yield [call, getMeta, 'bool'];
      const arrowSym = yield [call, getMeta, 'arrow'];

      yield [call, assertEq, type, `${arrowSym} (${arrowSym} 'a ${boolSym}) ${boolSym}`];
    },

    *imp(name){
      yield [call, assertDefined, name];

      if(ctx.hasType(name))
        return [0, `Implication cannot be a type`];

      const type = ctx.getType(name);
      assert(type !== null);

      const boolSym = yield [call, getMeta, 'bool'];
      const arrowSym = yield [call, getMeta, 'arrow'];

      yield [call, assertEq, type, `${arrowSym} ${boolSym} (${arrowSym} ${boolSym} ${boolSym})`];
    },

    *eq(name){
      yield [call, assertDefined, name];

      if(ctx.hasType(name))
        return [0, `Equality cannot be a type`];

      const type = ctx.getType(name);
      assert(type !== null);

      const boolSym = yield [call, getMeta, 'bool'];
      const arrowSym = yield [call, getMeta, 'arrow'];

      yield [call, assertEq, type, `${arrowSym} 'a (${arrowSym} 'a ${boolSym})`];
    },
  };

  const directiveFuncs = {
    *spacing(){
      const name = yield [call, getIdent];
      const before = yield [call, getSmallNat];
      const after = yield [call, getSmallNat];
      const inParens = yield [call, getSmallNat, 1];

      if(ctx.hasSpacingInfo(name))
        return [0, `Spacing has already been defined for ${name2str(name)}`];

      ctx = ctx.copy();
      ctx.spacing = util.copyObj(ctx.spacing);

      ctx.setSpacingInfo(name, [before, after, inParens]);

      return ret(`spacing ${name2str(name)} ${before} ${after} ${inParens}`);
    },

    *type(){
      const name = yield [call, getIdent];
      yield [call, assertFree, name];

      const arity = yield [call, getArity];

      let sort = 'identifier'
      let info = [0, []];

      if(line.startsWith('[')){
        [sort, info] = yield [call, getIdentInfo];

        if(sort !== 'operator')
          return [0, `Type identifier ${
            name2str(name)} cannot be defined as \`${
            sort}\``];
      }

      ctx = ctx.copy();

      assert(O.has(insertIdentSortFuncs, sort));
      yield [call, insertIdentSortFuncs[sort], name, [arity, info]];

      return ret(`type ${name2str(name)} ${arity}`);
    },

    *const(){
      const name = yield [call, getIdent];
      yield [call, assertFree, name];

      let sort = 'identifier'
      let info = [0, []];

      if(line.startsWith('['))
        [sort, info] = yield [call, getIdentInfo];

      yield [call, getExact, '::'];
      const type = yield [call, getExpr, 1];

      ctx = ctx.copy();

      assert(O.has(insertIdentSortFuncs, sort));
      yield [call, insertIdentSortFuncs[sort], name, [type, info]];

      return ret(`const ${name2str(name)} :: ${yield [[type, 'toStr'], ctx]}`);
    },

    *meta(){
      const name = yield [call, getToken];

      if(name === null)
        return [0, `Missing meta symbol name`];

      if(!O.has(metaSymbolFuncs, name))
        return [0, `Unknown meta symbol ${O.sf(name)}`];

      if(ctx.hasMeta(name))
        return [0, `Meta symbol ${O.sf(name)} has already been defined`];

      const ident = yield [call, getIdent, 0];

      ctx = ctx.copy();
      ctx.meta = util.copyObj(ctx.meta);

      yield [call, metaSymbolFuncs[name], ident];
      ctx.meta[name] = ident;

      return ret(`meta ${name} ${name2str(ident)}`);
    },

    *axiom(){
      const name = yield [call, getRuleName, 'axiom'];
      const prop = yield [call, getProp];

      ctx = ctx.copy();
      ctx.rules = util.copyObj(ctx.rules);
      ctx.rules[name] = prop;

      return ret(`axiom ${name}: ${yield [[prop, 'toStr'], ctx]}`);
    },

    *lemma(){
      const name = yield [call, getRuleName, 'lemma'];
      const prop = yield [call, getProp];

      ctx = ctx.copy();

      const subgoal = new Subgoal();
      yield [call, [subgoal, 'addProp'], call, ctx, prop];

      ctx.createProof(name, prop);
      ctx.proof.addSubgoal(subgoal);

      return ret(yield [[ctx.proof, 'toStr'], ctx]);
    },
  };

  const proofDirectiveFuncs = {
    *'*'(proof){
      const {subgoal} = proof;
      const {premises, goal} = subgoal;
      const premisesNum = premises.length;

      let prop = null;
      let index = null;

      while(!eol()){
        let propNew = null;
        let specs = null;

        if(!line.startsWith('[')){
          const tk = yield [call, getToken, 0, 0];

          if(tk === null)
            return syntErr();

          if(su.isInt(tk)){
            // Premise

            const i = Number(tk);

            if(!(i >= 1 && i <= premisesNum))
              return [0, `There is no premise with index ${tk}`];

            propNew = premises[i - 1];
          }else{
            // Other rule

            const rule = ctx.getRule(tk);

            if(rule === null)
              return [0, `Undefined rule ${O.sf(tk)}`];

            propNew = rule;
          }
        }

        if(line.startsWith('[')){
          const exprStrs = yield [call, getBrackets, 0];

          if(exprStrs.length === 0)
            return [0, `Empty specification parameters`];

          specs = [];

          for(const str of exprStrs)
            specs.push(yield [call, parser.parse, ctx, str]);
        }

        if(neol() && !line.startsWith(' '))
          return syntErr();

        trimLine();

        if(propNew === null){
          assert(specs !== null);
          assert(specs.length !== 0);

          if(prop === null)
            return [0, `Specification cannot be the first transformation`];

          prop = yield [call, [prop, 'specArr'], ctx, specs];
          continue;
        }

        if(specs !== null)
          propNew = yield [call, [propNew, 'specArr'], ctx, specs];

        if(prop === null){
          prop = propNew;
          continue;
        }

        prop = yield [call, [prop, 'mpDir'], ctx, propNew];
      }

      if(prop === null)
        return [0, `This proof directive requires at least one proposition`];

      prop = yield [call, [prop, 'simplify'], ctx];

      const proofNew = proof.copy();
      const subgoalNew = subgoal.copy();

      subgoalNew.addPremise(prop, index, 1);
      proofNew.setSubgoal(subgoalNew, 1);

      ctx = ctx.copy();
      ctx.proof = proofNew;

      return ret(yield [[ctx.proof, 'toStr'], ctx]);
    },
  };

  const processLine = function*(){
    const directive = yield [call, getToken];
    let data;

    if(directive === null)
      return [0, `Missing directive`];

    if(!ctx.hasProof){
      if(!O.has(directiveFuncs, directive))
        return [0, `Unknown directive ${O.sf(directive)}`];

      data = yield [call, directiveFuncs[directive]];
    }else{
      if(!O.has(proofDirectiveFuncs, directive))
        return [0, `Unknown proof directive ${O.sf(directive)}`];

      const {proof} = ctx;
      assert(proof.hasSubgoal);

      data = yield [call, proofDirectiveFuncs[directive], proof];
    }

    yield [call, assertEol];
    return [1, data];
  };

  yield O.tco(call, processLine);

  // return new LineData(lineIndex, ctx, `Line ${lineIndex + 1}`);

  /*outputEditor.removeLines();

  const getLine = index => {
    return mainEditor.getLine(index);
  };

  const setLine = (index, str) => {
    outputEditor.setLine(index, str);
  };

  const exprRaw = yield [call, parser.parse, ctx, getLine(0)];
  let expr = yield [call, [exprRaw, 'simplify'], ctx];

  const toStrIdents = util.obj2();
  const [symStrObj, strSymObj] = toStrIdents;

  const toStr = function*(a){
    if(util.isStr(a)) return a;

    if(util.isSym(a)){
      assert(O.has(symStrObj, a));
      return symStrObj[a];
    }

    if(a === null) return 'null';

    if(O.isArr(a))
      return su.addBrackets((yield [O.mapr, a, toStr]).join(', '));

    if(a instanceof Expr)
      return O.tco([a, 'toStr'], ctx, toStrIdents);

    assert.fail();
  };

  const set = function*(n, a){
    setLine(n, yield [toStr, a]);
  };

  yield [set, 0, expr];

  const spec = yield [call, parser.parse, ctx, getLine(1)];
  expr = yield [call, [expr, 'spec'], ctx, spec];

  yield [set, 1, expr];

  const ant = yield [call, parser.parse, ctx, getLine(2)];
  expr = yield [call, [expr, 'mpDir'], ctx, ant];

  yield [set, 2, expr];

  return;*/

  /*const specsLine = getLine(1).trim();

  if(specsLine.length !== 0){
    const specStrs = specsLine.split(',');
    let exprNew = expr;

    for(const str of specStrs){
      const spec = yield [call, parser.parse, ctx, str];
      exprNew = yield [call, [exprNew, 'spec'], ctx, spec];
    }

    yield [set, 5, exprNew];
    yield [set, 6, exprNew.arg.type];
  }*/

  /*const types = result[1];
  const identsArr = O.keys(types);
  const identsNum = identsArr.length;

  const idents2 = util.obj2();
  const symStrObj = idents2[0];
  const strSymObj = idents2[1];

  setLine(1, yield [[expr, 'toStr'], ctx, idents2]);

  for(let i = 0; i !== identsNum; i++){
    const sym = identsArr[i];
    assert(O.has(symStrObj, sym));

    const name = symStrObj[sym];
    const type = O.rec([types[sym], 'toStr'], ctx, idents2);

    setLine(2 + i, `${name} :: ${type}`);
  }*/
};

const updateDisplay = () => {
  const {updatedLine} = mainEditor;
  const linesDataNum = linesData.length;

  const hasErr = linesDataNum !== 0 ?
    O.last(linesData).err : 0;

  try{
    update: {
      if(updatedLine === null) break update;
      if(hasErr && updatedLine >= linesDataNum) break update;

      onUpdatedLine(updatedLine);
    }
  }finally{
    mainEditor.updatedLine = null;
    onNav();
    render();
  }
};

const onKeyDown = evt => {
  const {ctrlKey, shiftKey, altKey, code} = evt;
  const flags = (ctrlKey << 2) | (shiftKey << 1) | altKey;

  flagCases: {
    noFlags: if(flags === 0){
      if(/^Arrow|^(?:Backspace|Home|End|Delete|Tab)$/.test(code)){
        O.pd(evt);
        mainEditor.processKey(code);
        break flagCases;
      }

      break flagCases;
    }

    ctrl: if(flags === 4){
      if(code === 'KeyS'){
        O.pd(evt);
        save();
        break flagCases;
      }

      if(code === 'ArrowUp'){
        mainEditor.scrollUp();
        break flagCases;
      }

      if(code === 'ArrowDown'){
        mainEditor.scrollDown();
        break flagCases;
      }

      break flagCases;
    }

    ctrlShift: if(flags === 6){
      if(code === 'KeyD'){
        O.pd(evt);
        mainEditor.processKey('Duplicate');
        break flagCases;
      }

      if(code === 'ArrowUp'){
        O.pd(evt);
        mainEditor.processKey('MoveUp');
        break flagCases;
      }

      if(code === 'ArrowDown'){
        O.pd(evt);
        mainEditor.processKey('MoveDown');
        break flagCases;
      }

      break flagCases;
    }
  }

  updateDisplay();
};

const onKeyPress = evt => {
  const {ctrlKey, altKey, key} = evt;
  if(ctrlKey || altKey) return;

  mainEditor.processKey(key);
  updateDisplay();
};

const save = () => {
  localStorage[project] = JSON.stringify({
    str: mainEditor.lines.join('\n'),
    cx: mainEditor.cx,
    cy: mainEditor.cy,
    cxPrev: mainEditor.cxPrev,
    scrollY: mainEditor.scrollY,
  });
};

const load = () => {
  const {
    str,
    cx,
    cy,
    cxPrev,
    scrollY,
  } = JSON.parse(localStorage[project]);

  mainEditor.cx = cx;
  mainEditor.cy = cy;
  mainEditor.cxPrev = cxPrev;
  mainEditor.scrollY = scrollY;
  mainEditor.setText(str);
};

const onResize = evt => {
  iw = O.iw;
  ih = O.ih;

  w = iw / ws | 0;
  h = ih / hs | 0;

  g.resize(iw, ih);
  updateDisplay();
};

const render = () => {
  g.clearCanvas('white');

  const iwh = iw / 2;
  const ihh = ih / 2;

  const wh = w >> 1;
  const hh = h >> 1;

  const ofs2 = ofs * 2;
  const width = (iw - ofs2) / ws >> 1;
  const height = (ih - ofs2) / hs | 0;

  g.beginPath();
  g.moveTo(iwh, 0);
  g.lineTo(iwh, ih);
  g.stroke();

  g.translate(ofs, ofs);
  g.scale(ws, hs);
  mainEditor.render(g, width, height);
  g.resetTransform();

  g.translate(iwh + ofs, ofs);
  g.scale(ws, hs);
  outputEditor.render(g, width, height);
  g.resetTransform();
};

main();