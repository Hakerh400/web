'use strict';

const assert = require('assert');
const parser = require('./parser');
const Expr = require('./expr');
const Context = require('./context');
const Editor = require('./editor');
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

const spaces = {};

const ctx = new Context(idents, ops, binders, spaces);

for(const key of O.keys(idents))
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
}

const mainEditor = new Editor();
const outputEditor = new Editor();

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

const onUpdatedLine = function*(lineIndex){
  if(lineIndex >= 3) return;

  // mainEditor.removeLines(3);
  return;
  outputEditor.removeLines();

  const getLine = index => {
    return mainEditor.getLine(index);
  };

  const setLine = (index, str) => {
    outputEditor.setLine(index, str);
  };

  const call = function*(fn, ...args){
    const result = yield [fn, ...args];

    if(result[0] === 0){
      const err = result[1];
      const msg = typeof err === 'string' ?
        err : err.msg//su.tab(err.pos, `^ ${err.msg}`);

      setLine(6, msg);

      return O.breakRec();
    }

    return result[1];
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

  return;

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
    if(updatedLine !== null)
      O.rec(onUpdatedLine, updatedLine);
  }finally{
    mainEditor.updatedLine = null;
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
    lines: mainEditor.lines,
    cx: mainEditor.cx,
    cy: mainEditor.cy,
    cxPrev: mainEditor.cxPrev,
    scrollY: mainEditor.scrollY,
  });
};

const load = () => {
  const {
    lines,
    cx,
    cy,
    cxPrev,
    scrollY,
  } = JSON.parse(localStorage[project]);

  mainEditor.lines = lines;
  mainEditor.cx = cx;
  mainEditor.cy = cy;
  mainEditor.cxPrev = cxPrev;
  mainEditor.scrollY = scrollY;
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