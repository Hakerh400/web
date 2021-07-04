'use strict';

const assert = require('assert');
const parser = require('./parser');
const Expr = require('./expr');
const su = require('./str-util');

const {min, max} = Math;
const {project} = O;
const {Context} = parser;
const {Ident, Call, Lambda} = Expr;

const {g} = O.ceCanvas(1);

const ws = 12;
const hs = 25;
const canvasOffset = 15;

const cols = {
  bg: 'white',
  text: 'black',
};

const idents = {};

const ops = {
  '⟹': [25, [1, 0]],
  '≡': [20, [0, 1]],

  '⟶': [25, [1, 0]],
  '⟷': [24, [0, 1]],
  '∧': [35, [0, 1]],
  '∨': [30, [0, 1]],
  '¬': [40, [0]],
  '=': [50, [0, 1]],
  '≠': [50, [0, 1]],
  ' ': [1e3, [0, 1]],
};

const binders = {
  'λ': [0, [0]],
  '∀': [0, [0]],
  '∃': [0, [0]],
  '∃!': [0, [0]],
};

const longOpNames = {
  '⟹': 1,
  '⟶': 1,
  '⟷': 1,
};

for(const obj of [ops, binders]){
  for(const key of O.keys(obj)){
    const info = obj[key];
    const [prec, precs] = info;

    const sum = precs.reduce((a, b) => a + b, 0);
    const div = sum * 2;

    for(let i = 0; i !== precs.length; i++)
      precs[i] = prec + precs[i] / div;
  }
}

const specialChars = [
  ['\\lam', 'λ'],
  ['\\for', '∀'],
  ['\\exi', '∃'],
  ['\\uniq', '∃!'],
  ['\\tau', 'τ'],
  ['<->', su.addSpaces('⟷')],
  ['->', su.addSpaces('⟶')],
  ['=>', su.addSpaces('⟹')],
  ['/\\', '∧'],
  ['\\/', '∨'],
  ['\\not', '¬'],
  ['\\neq', '≠'],
  ['\\eqv', '≡'],
];

const ctx = new Context(idents, ops, binders, longOpNames);

let lines = [];
let cx = 0;
let cy = 0;
let cxPrev = 0;
let updatedLine = null;
let scrollY = 0;

let w, h;

const main = () => {
  O.dbgAssert = 1;

  if(O.has(localStorage, project))
    load();

  initCanvas();
  aels();

  onResize();
};

const expr2str = function*(expr, prec=0){
  const toStr = function*(expr){
    if(expr.isIdent){
      const {name} = expr;
      const name1 = ctx.name2str(name);

      if(ctx.hasOpOrBinder(name)) return [null, su.addParens(name1)];
      return [null, name1];
    }

    if(expr.isLam){
      const names = [];
      let e = expr;

      while(e.isLam){
        names.push(e.name);
        e = e.expr;
      }

      return [ctx.getPrec('λ'), `λ${names.join(' ')}. ${yield [expr2str, e]}`];
    }

    if(expr.isCall){
      const {target, arg} = expr;

      let op = null;
      let args = [];
      let e = expr;

      while(e.isCall){
        args.push(e.arg);
        e = e.target;
        if(e.isIdent) op = e.name;
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
            return [p, `${ctx.name2str(op)} ${yield [expr2str, args[0], ps[0]]}`];
          }

          if(arity === 2)
            return [p, `${yield [expr2str, args[0], ps[0]]} ${ctx.name2str(op)} ${yield [expr2str, args[1], ps[1]]}`];

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

            const {name} = arg;
            const str = yield [expr2str, arg.expr];

            if(str.startsWith(op))
              return [p, str.replace(op, `${op}${name} `)];

            return [p, `${op}${name}. ${str}`];
          }

          assert.fail();
        }
      }

      const ps = ctx.getPrecs(' ');
      return [ctx.getPrec(' '), `${yield [expr2str, target, ps[0]]} ${yield [expr2str, arg, ps[1]]}`];
    }

    assert.fail();
  };

  const [precNew, str] = yield [toStr, expr];

  if(precNew !== null && precNew < prec) return su.addParens(str);
  return str;
};

const initCanvas = () => {
  g.translate(canvasOffset, canvasOffset);
  g.scale(ws, hs);

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

const onUpdatedLine = lineIndex => {
  return;
  if(lineIndex !== 0) return;

  const str = getLine(0);
  const result = parser.parse(ctx, str);

  if(result[0] === 0){
    const err = result[1];
    setLine(1, su.tab(err.pos, `^ ${err.msg}`));
    return;
  }

  const expr = result[1];
  setLine(1, O.rec(expr2str, expr));
};

const updateDisplay = () => {
  try{
    if(updatedLine !== null)
      onUpdatedLine(updatedLine);
  }finally{
    updatedLine = null;
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
        processKey(code);
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
        if(scrollY !== 0) scrollY--;
        break flagCases;
      }

      if(code === 'ArrowDown'){
        scrollY++;
        break flagCases;
      }

      break flagCases;
    }

    ctrlShift: if(flags === 6){
      if(code === 'KeyD'){
        O.pd(evt);
        processKey('Duplicate');
        break flagCases;
      }

      if(code === 'ArrowUp'){
        O.pd(evt);
        processKey('MoveUp');
        break flagCases;
      }

      if(code === 'ArrowDown'){
        O.pd(evt);
        processKey('MoveDown');
        break flagCases;
      }

      break flagCases;
    }
  }

  updateDisplay();
};

const onKeyPress = evt => {
  const {key} = evt;

  processKey(key);
  updateDisplay();
};

const processKey = key => {
  const line = getLine(cy);
  const lineLen = line.length;

  const tSize = su.getTabSize(line);
  const tStr = su.getTabStr(line);

  const p1 = line.slice(0, cx);
  const p2 = line.slice(cx);

  if(key === 'Enter'){
    setLine(cy, p1);

    if(cx !== 0){
      const char = p1.slice(-1);
      const pt = su.getOpenParenType(char);

      if(pt !== null && p2.startsWith(su.closedParenChars[pt])){
        insertLines(++cy, tStr + su.tabStr, tStr + p2);
        setCx(tSize + su.tabSize);
        return;
      }
    }

    insertLine(++cy, tStr + p2);
    setCx(tSize);
    return;
  }

  if(key === 'Backspace'){
    if(cx === 0){
      if(cy === 0){
        // setCx();
        return;
      }

      removeLine(cy);
      setCx(getLineLen(--cy));
      appendLine(cy, line);
      return;
    }

    const c1 = line[cx - 1];
    const c2 = cx !== lineLen ? line[cx] : null;

    const pt = su.getOpenParenType(c1);
    const isOpenParen = pt !== null && p2.startsWith(su.closedParenChars[pt]);
    const isStrDelim = su.isStrDelim(c1) && c1 === c2;

    const p2New = isOpenParen || isStrDelim ? p2.slice(1) : p2;

    decCx();
    setLine(cy, p1.slice(0, -1) + p2New);
    return;
  }

  if(key === 'Delete'){
    if(cx === lineLen){
      appendLine(cy, removeLine(cy + 1));
      return;
    }

    setLine(cy, p1 + p2.slice(1));
    return;
  }

  if(key === 'Home'){
    setCx(cx !== tSize ? tSize : 0);
    return;
  }

  if(key === 'End'){
    setCx(lineLen);
    return;
  }

  if(key === 'Tab'){
    setLine(cy, p1 + su.tabStr + p2);
    setCx(cx + su.tabSize);
    return;
  }

  if(key === 'Duplicate'){
    insertLine(++cy, line);
    setCx();
    return;
  }

  if(key.startsWith('Move')){
    const dir = key.slice(4) === 'Up' ? 0 : 2;

    if(dir === 0){
      if(cy === 0){
        // setCx();
        return;
      }

      swapLines(cy, --cy);
      // setCx();
      return;
    }

    swapLines(cy, ++cy);
    // setCx();
    return;
  }

  if(key.startsWith('Arrow')){
    const dir = ['Up', 'Right', 'Down', 'Left'].indexOf(key.slice(5));
    if(dir === -1) return;

    if(dir & 1){
      if(dir === 3){
        if(cx === 0){
          if(cy === 0){
            setCx(0);
            return;
          }

          setCx(getLineLen(--cy));
          return;
        }

        decCx();
        return;
      }

      if(cx === lineLen){
        cy++;
        setCx(0);
        return;
      }

      incCx();
      return;
    }

    if(dir === 0){
      if(cy === 0) return;

      cx = min(getLineLen(--cy), cxPrev);
      return;
    }

    cx = min(getLineLen(++cy), cxPrev);
    return;
  }

  if(key.length !== 1){
    // log(key);
    return;
  }

  const char = key;
  let str = char;

  setStr: {
    if(su.isStrDelim(char)){
      str = char + char;
      break setStr;
    }

    const openParenType = su.getOpenParenType(char);

    if(openParenType !== null){
      const nextChar = cx !== lineLen ? p2[0] : null;

      if(nextChar === null || su.isClosedParen(nextChar) || nextChar === ' ')
        str = char + su.closedParenChars[openParenType];

      break setStr;
    }

    if(su.isClosedParen(char)){
      if(p2.startsWith(char)) str = '';
      break setStr;
    }

    const p1New = p1 + char;

    for(const [code, su] of specialChars){
      if(!p1New.endsWith(code)) continue;

      const codeLen = code.length;
      setLine(cy, p1.slice(0, 1 - codeLen) + su + p2);
      setCx(cx - codeLen + su.length + 1);
      return;
    }
  }

  setLine(cy, p1 + str + p2);
  incCx();
};

const appendLine = (index, str) => {
  setLine(index, getLine(index) + str);
};

const swapLines = (index1, index2) => {
  const line1 = getLine(index1);
  const line2 = getLine(index2);

  setLine(index1, line2);
  setLine(index2, line1);
};

const getLineLen = index => {
  return getLine(index).length;
};

const getLine = index => {
  if(index >= lines.length)
    return '';

  return lines[index];
};

const setLine = (index, str) => {
  // if(readOnly) return;
  assert(typeof str === 'string');

  if(lines.length <= index && str.length === 0)
    return;

  expandLines(index);

  if(str === lines[index]) return;

  lines[index] = str;
  updateLine(index);
};

const insertLine = (index, line) => {
  insertLines(index, line);
};

const removeLine = index => {
  return removeLines(index)[0];
};

const insertLines = (index, ...xs) => {
  // if(readOnly) return;
  expandLines(index);
  updateLine(index);
  lines.splice(index, 0, ...xs);
};

const removeLines = (index, num=1) => {
  // if(readOnly) return;
  expandLines(index);
  updateLine(index);
  return lines.splice(index, num);
};

const expandLines = index => {
  while(lines.length <= index)
    lines.push('');
};

const updateLine = index => {
  if(updatedLine === null || index < updatedLine)
    updatedLine = index;
};

const save = () => {
  localStorage[project] = JSON.stringify({
    lines,
    cx,
    cy,
    cxPrev,
    scrollY,
  });
};

const load = () => {
  ({
    lines,
    cx,
    cy,
    cxPrev,
    scrollY,
  } = JSON.parse(localStorage[project]));

  updatedLine = 0;
};

const setCx = (cxNew=cx) => {
  cxPrev = cx = cxNew;
};

const incCx = () => {
  setCx(cx + 1);
};

const decCx = () => {
  setCx(cx - 1);
};

const onResize = evt => {
  w = O.iw;
  h = O.ih;

  g.resize(w, h);
  updateDisplay();
};

const render = () => {
  g.clearCanvas(cols.bg);

  g.fillStyle = cols.text;

  for(let y = scrollY; y < lines.length; y++){
    const line = lines[y];

    for(let x = 0; x !== line.length; x++)
      g.fillText(line[x], x + .5, y - scrollY + .5);
  }

  drawCursor();
};

const drawCursor = () => {
  const y = cy - scrollY;

  g.beginPath();
  g.moveTo(cx, y);
  g.lineTo(cx, y + 1);
  g.stroke();
};

main();