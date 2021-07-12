'use strict';

const assert = require('assert');
const parser = require('./parser');
const Expr = require('./expr');
const Context = require('./context');
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
  // ' ': [`('a ⟹ 'b) ⟹ 'a ⟹ 'b`, [80, [0, 1]]],
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
    const ctx = i === 0 ? new Context() : linesData[i - 1].ctx;
    const data = O.rec(processLine, i, ctx);

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

  const err = function*(msg){
    return O.tco(processResult, [0, msg]);
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

  if(eol())
    return new LineData(lineIndex, ctx);

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
      return [0, `Extra tokens found at the end: ${O.sf(line)}`];

    return [1];
  };

  const assertFree = function*(name){
    if(ctx.hasName(name))
      return [0, `Identifier ${name2str(name)} has already been defined`];

    return [1];
  };

  const advance = function*(str){
    line = line.slice(str.length);
    line = line.trimLeft();

    return [1, str];
  };

  const getToken = function*(parens=0){
    let match = line.match(/^[^\s\(\)\[\]\,\.]+/);

    if(match !== null)
      return O.tco(advance, match[0]);

    if(!parens) return [1, null];

    match = line.match(/^\(\s*([^\s\(\)\[\]\,\.]+)\s*\)/);
    if(match === null) return [1, null];

    yield [call, advance, match[0]];

    return [1, match[1]];
  };

  const getIdent = function*(parens){
    const name = yield [call, getToken, parens];

    if(name === null)
      return [0, `Missing identifier`];

    return [1, name];
  };

  //////////////////////////////////////////////////

  const getSomeParens = function*(c1, c2){
    const end = line.indexOf(c2);

    if(!line.startsWith(c1) || end === -1)
      return [0, `Invalid parenthesis near ${O.sf(line)}`];
    
    const str = line.slice(1, end);
    line = line.slice(end + 1).trimLeft();

    return [1, str.split(',').map(a => a.trim())];
  };

  const getParens = function*(){
    return O.tco(getSomeParens, '(', ')');
  };

  const getBrackets = function*(){
    return O.tco(getSomeParens, '[', ']');
  };

  const getBraces = function*(){
    return O.tco(getSomeParens, '{', '}');
  };

  //////////////////////////////////////////////////

  const getInt = function*(min=null, max=null){
    if(min !== null) min = BigInt(min);
    if(max !== null) max = BigInt(max);

    if(min !== null && max !== null)
      assert(min <= max);

    const tk = yield [call, getToken];

    if(tk === null)
      return [0, `Missing number`];

    if(!/^(?:0|\-?[1-9][0-9]*)$/.test(tk))
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
      return [0, `Unknown ident sort ${O.sf(sort)}`];

    const info = yield [call, parseIdentSortFuncs[sort]];
    yield [call, pop];

    return [1, info];
  };

  const parseIdentSortFuncs = {
    *prefix(){
      const arity = yield [call, getArity];
      return [1, ['operator', [arity, [0]]]];
    },

    *infixl(){
      const arity = yield [call, getArity];
      return [1, ['operator', [arity, [0, .5]]]];
    },

    *infixr(){
      const arity = yield [call, getArity];
      return [1, ['operator', [arity, [.5, 0]]]];
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

  const keywordFuncs = {
    *spacing(){
      const name = yield [call, getIdent, 1];
      const before = yield [call, getSmallNat];
      const after = yield [call, getSmallNat];
      const inParens = yield [call, getSmallNat, 1];

      yield [call, assertEol];

      if(ctx.hasSpacingInfo(name))
        return [0, `Spacing has already been defined for ${name2str(name)}`];

      ctx = ctx.copy();
      ctx.spacing = util.copyObj(ctx.spacing);

      ctx.setSpacingInfo(name, [before, after, inParens]);

      const str = `spacing ${name2str(name)} ${before} ${after} ${inParens}`;

      return [1, new LineData(lineIndex, ctx, str)]
    },

    *type(){
      const name = yield [call, getIdent, 1];
      const arity = yield [call, getArity];

      let identInfo = ['identifier', [arity, [0, []]]];

      if(neol()){
        const info = yield [call, getIdentInfo];
        const [identSort, details] = info;

        if(identSort !== 'operator')
          return [0, `Type identifier ${
            name2str(name)} cannot be defined as \`${
            identSort}\``];

        identInfo = [identSort, [arity, details]];
        yield [call, assertEol];
      }

      const [identSort, details] = identInfo;
      yield [call, assertFree, name];

      ctx = ctx.copy();

      assert(O.has(insertIdentSortFuncs, identSort));
      yield [call, insertIdentSortFuncs[identSort], name, details]

      return [1, new LineData(lineIndex, ctx), `type ${name2str(name)} ${arity}`];

      // ctx = ctx.copy();
      // ctx.spacing = util.copyObj(ctx.spacing);

      // ctx.setSpacingInfo(name, [before, after, inParens]);
    },
  };

  const processLine = function*(){
    const keyword = yield [call, getToken];

    if(keyword === null)
      return [0, `Missing keyword`];

    if(!O.has(keywordFuncs, keyword))
      return [0, `Unknown keyword ${O.sf(keyword)}`];

    return O.tco(keywordFuncs[keyword]);
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

  try{
    update: {
      if(updatedLine === null) break update;
      if(updatedLine !== 0 && updatedLine >= linesData.length) break update;

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