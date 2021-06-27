'use strict';

const {min, max} = Math;
const {project} = O;

const {g} = O.ceCanvas(1);

const ws = 12;
const hs = 25;
const canvasOffset = 15;
const tabSize = 2;

const cols = {
  bg: 'white',
  text: 'black',
};

const specialChars = [
  ['lam', 'λ'],
  ['all', '∀'],
  ['exi', '∃'],
];

const openParenChars = '([{';
const closedParenChars = ')]}';
const strLiteralDelimChars = '\'"`';

let lines = [];
let cx = 0;
let cy = 0;
let cxPrev = 0;

let w, h;

const main = () => {
  if(O.has(localStorage, project))
    load();

  initCanvas();
  aels();

  onResize();
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
        break noFlags;
      }

      break flagCases;
    }

    ctrl: if(flags === 4){
      if(code === 'KeyS'){
        O.pd(evt);
        save();
        break ctrl;
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

    const cp = getCorrespondingClosedParen(line[cx - 1]);
    const p2New = cp && p2.startsWith(cp) ? p2.slice(1) : p2;

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

  let str = isStrLiteralDelim(key) ? key + key :
    isClosedParen(key) && p2.startsWith(key) ? '' :
    key + getCorrespondingClosedParen(key);

  if(str === key){
    const p1New = p1 + key;

    for(const [code, char] of specialChars){
      if(!p1New.endsWith(`\\${code}`)) continue;

      const codeLen = code.length;
      lines[cy] = p1.slice(0, -codeLen) + char + p2;
      setCx(cx - codeLen + 1);
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

const isStrLiteralDelim = char => {
  return strLiteralDelimChars.includes(char);
};

const getTabSize = line => {
  const lineLen = line.length;

  for(let i = 0; i !== lineLen; i++)
    if(line[i] !== ' ')
      return i;

  return lineLen;
};

const getTabStr = line => {
  return tabFromSize(getTabSize(line));
};

const tabFromSize = size => {
  return ' '.repeat(size);
};

const getCorrespondingClosedParen = char => {
  const openParenType = getOpenParenType(char);
  const closedParen = openParenType !== null ?
    closedParenChars[openParenType] : ''

  return closedParen;
};

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

const tabStr = tabFromSize(tabSize);

main();