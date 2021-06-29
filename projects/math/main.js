'use strict';

const assert = require('assert');

const Expr = require('./expr');

const {min, max} = Math;
const {project} = O;
const {Ident, Call, Lambda} = Expr;

const {g} = O.ceCanvas(1);

const ws = 12;
const hs = 25;
const canvasOffset = 15;
const tabSize = 2;

const cols = {
  bg: 'white',
  text: 'black',
};

const ops = {
  '⟶': [25, [1, 0]],
  '⟷': [24, [0, 1]],
  '∧': [35, [0, 1]],
  '∨': [30, [0, 1]],
  '¬': [40, [40]],
  '=': [50, [0, 1]],
  ' ': [100, [0, 1]],
};

const binders = {
  'λ': [0, [0]],
  '∀': [0, [0]],
  '∃': [0, [0]],
  '∃!': [0, [0]],
};

const longOpNames = {
  '⟶': 1,
  '⟷': 1,
};

const specialChars = [
  ['\\lam', 'λ'],
  ['\\for', '∀'],
  ['\\exi', '∃'],
  ['\\uniq', '∃!'],
  ['\\tau', 'τ'],
  ['<->', addSpaces('⟷')],
  ['->', addSpaces('⟶')],
  ['=>', addSpaces('⟹')],
  ['/\\', '∧'],
  ['\\/', '∨'],
  ['\\not', '¬'],
];

const openParenChars = '([{';
const closedParenChars = ')]}';
const strLiteralDelimChars = '"`';

const tabStr = tabFromSize(tabSize);

let lines = [];
let cx = 0;
let cy = 0;
let cxPrev = 0;

let w, h;

const main = () => {
  if(O.has(localStorage, project))
    load();

  const exi = (a, b) => {
    return new Call(new Ident('∃'), new Lambda(a, b));
  };

  const all = (a, b) => {
    return new Call(new Ident('∀'), new Lambda(a, b));
  };

  lines = [
    O.rec(expr2str, new Call(new Call(new Ident('⟶'), new Ident('P')), new Call(new Call(new Ident('='), new Ident('Q')), new Ident('R')))),
    O.rec(expr2str, new Call(new Call(new Ident('='), new Call(new Call(new Ident('⟶'), new Ident('P')), new Ident('Q'))), new Ident('R'))),
    '',
    O.rec(expr2str, new Call(new Call(new Ident('⟶'), new Ident('P')), new Call(new Call(new Ident('⟶'), new Ident('Q')), new Ident('R')))),
    O.rec(expr2str, new Call(new Call(new Ident('⟶'), new Call(new Call(new Ident('⟶'), new Ident('P')), new Ident('Q'))), new Ident('R'))),
    '',
    O.rec(expr2str, new Call(new Call(new Ident('⟷'), new Lambda('x', new Call(new Call(new Ident('⟶'), new Call(new Call(new Ident('⟶'), new Ident('P')), new Ident('Q'))), new Ident('R')))), new Ident('M'))),
    O.rec(expr2str, all('a', all('b', exi('T', new Lambda('t', new Call(new Call(new Ident('⟷'), all('x', new Call(new Call(new Ident('⟶'), new Call(new Call(new Ident('⟶'), new Ident('P')), new Ident('Q'))), new Ident('R')))), new Ident('M'))))))),
  ];

  initCanvas();
  aels();

  onResize();
};

const expr2str = function*(expr, prec=0){
  const toStr = function*(expr){
    if(expr.isIdent){
      const {name} = expr;
      const name1 = name2str(name);

      if(isOpOrBinder(name)) return [null, addParens(name1)];
      return [null, name1];
    }

    if(expr.isLam){
      const names = [];
      let e = expr;

      while(e.isLam){
        names.push(e.name);
        e = e.expr;
      }

      return [getPrec('λ'), `λ${names.join(' ')}. ${yield [expr2str, e]}`];
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
        checkOp: if(isOp(op)){
          const p = getPrec(op);
          assert(p !== null);

          const arity = getArity(op);
          if(args.length !== arity) break checkOp;

          const ps = getPrecs(op);
          assert(ps.length === arity);

          args.reverse();

          if(arity === 1)
            return [p, yield [expr2str, args[0], ps[0]]];

          if(arity === 2)
            return [p, `${yield [expr2str, args[0], ps[0]]} ${name2str(op)} ${yield [expr2str, args[1], ps[1]]}`];

          assert.fail();
        }

        checkBinder: if(isBinder(op)){
          const p = getPrec(op);
          assert(p !== null);

          const arity = getArity(op);
          if(args.length !== arity) break checkBinder;

          const ps = getPrecs(op);
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

      const ps = getPrecs(' ');
      return [getPrec(' '), `${yield [expr2str, target, ps[0]]} ${yield [expr2str, arg, ps[1]]}`];
    }

    assert.fail();
  };

  const [precNew, str] = yield [toStr, expr];

  if(precNew !== null && precNew < prec) return addParens(str);
  return str;
};

const name2str = name => {
  if(O.has(longOpNames, name))
    return addSpaces(name);

  return name;
};

const getArity = op => {
  const info = getOpOrBinderInfo(op);
  if(info) return info[1].length;
  return null;
};

const getOpOrBinderInfo = op => {
  if(isOp(op)) return ops[op];
  if(isBinder(op)) return binders[op];
  return null;
};

const getPrec = op => {
  const info = getOpOrBinderInfo(op);
  if(info) return info[0];
  return null;
};

const getPrecs = op => {
  const info = getOpOrBinderInfo(op);
  if(info) return info[1].map(a => a + info[0]);
  return null;
};

const isOpOrBinder = name => {
  return isOp(name) || isBinder(name);
};

const isOp = name => {
  return O.has(ops, name);
};

const isBinder = name => {
  return O.has(binders, name);
};

const addParens = str => {
  return `(${str})`;
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

  render();
};

const onKeyPress = evt => {
  const {key} = evt;

  processKey(key);
  render();
};

const processKey = key => {
  while(lines.length <= cy)
    lines.push('');

  const line = lines[cy];
  const lineLen = line.length;
  const linesNum = lines.length;
  const linesNum1 = linesNum - 1;

  const tSize = getTabSize(line);
  const tStr = getTabStr(line);

  const p1 = line.slice(0, cx);
  const p2 = line.slice(cx);

  if(key === 'Enter'){
    lines[cy] = p1;

    if(cx !== 0){
      const char = p1.slice(-1);
      const pt = getOpenParenType(char);

      if(pt !== null && p2.startsWith(closedParenChars[pt])){
        lines.splice(++cy, 0, tStr + tabStr, tStr + p2);
        setCx(tSize + tabSize);
        return;
      }
    }

    lines.splice(++cy, 0, tStr + p2);
    setCx(tSize);
    return;
  }

  if(key === 'Backspace'){
    if(cx === 0){
      if(cy === 0){
        // setCx();
        return;
      }

      lines.splice(cy, 1);
      setCx(lines[--cy].length);
      lines[cy] += line;
      return;
    }

    const pt = getOpenParenType(line[cx - 1]);
    const p2New = pt  !== null && p2.startsWith(closedParenChars[pt]) ?
      p2.slice(1) : p2;

    decCx();
    lines[cy] = p1.slice(0, -1) + p2New;
    return;
  }

  if(key === 'Delete'){
    if(cx === lineLen){
      if(cy === linesNum1){
        // setCx();
        return;
      }

      lines[cy] += lines.splice(cy + 1, 1)[0];
      return;
    }

    lines[cy] = p1 + p2.slice(1);
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
    lines[cy] = p1 + tabStr + p2;
    setCx(cx + tabSize);
    return;
  }

  if(key === 'Duplicate'){
    lines.splice(++cy, 0, line);
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

      [lines[cy - 1], lines[cy]] = [line, lines[cy - 1]];
      cy--;
      // setCx();
      return;
    }

    if(cy === linesNum1)
      lines.push('');

    [lines[cy + 1], lines[cy]] = [line, lines[cy + 1]];
    cy++;
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

          setCx(lines[--cy].length);
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

      cx = min(lines[--cy].length, cxPrev);
      return;
    }

    if(cy === linesNum1)
      return;

    cx = min(lines[++cy].length, cxPrev);
    return;
  }

  if(key.length !== 1){
    // log(key);
    return;
  }

  const char = key;
  let str = char;

  setStr: {
    if(isStrLiteralDelim(char)){
      str = char + char;
      break setStr;
    }

    const openParenType = getOpenParenType(char);

    if(openParenType !== null){
      const nextChar = cx !== lineLen ? p2[0] : null;

      if(nextChar === null || isClosedParen(nextChar) || nextChar === ' ')
        str = char + closedParenChars[openParenType];

      break setStr;
    }

    if(isClosedParen(char)){
      if(p2.startsWith(char)) str = '';
      break setStr;
    }

    const p1New = p1 + char;

    for(const [code, ss] of specialChars){
      if(!p1New.endsWith(code)) continue;

      const codeLen = code.length;
      lines[cy] = p1.slice(0, 1 - codeLen) + ss + p2;
      setCx(cx - codeLen + ss.length + 1);
      return;
    }
  }

  lines[cy] = p1 + str + p2;
  incCx();
};

const save = () => {
  localStorage[project] = JSON.stringify({
    lines,
    cx,
    cy,
    cxPrev,
  });
};

const load = () => {
  ({
    lines,
    cx,
    cy,
    cxPrev,
  } = JSON.parse(localStorage[project]));
};

function addSpaces(str, before=1, after=1){
  return tabFromSize(before) + str + tabFromSize(after);
}

const isStrLiteralDelim = char => {
  return strLiteralDelimChars.includes(char);
};

function getTabSize(line){
  const lineLen = line.length;

  for(let i = 0; i !== lineLen; i++)
    if(line[i] !== ' ')
      return i;

  return lineLen;
}

function getTabStr(line){
  return tabFromSize(getTabSize(line));
}

function tabFromSize(size){
  return ' '.repeat(size);
}

const isOpenParen = char => {
  return getOpenParenType(char) !== null;
};

const isClosedParen = char => {
  return getClosedParenType(char) !== null;
};

const getOpenParenType = char => {
  return indexOf(openParenChars, char);
};

const getClosedParenType = char => {
  return indexOf(closedParenChars, char);
};

const indexOf = (arr, elem) => {
  const index = arr.indexOf(elem);
  if(index === -1) return null;
  return index;
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
  render();
};

const render = () => {
  g.clearCanvas(cols.bg);

  g.fillStyle = cols.text;

  for(let y = 0; y !== lines.length; y++){
    const line = lines[y];

    for(let x = 0; x !== line.length; x++)
      g.fillText(line[x], x + .5, y + .5);
  }

  drawCursor();
};

const drawCursor = () => {
  g.beginPath();
  g.moveTo(cx, cy);
  g.lineTo(cx, cy + 1);
  g.stroke();
};

main();