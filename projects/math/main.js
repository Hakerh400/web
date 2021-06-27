'use strict';

const {min, max} = Math;

const {g} = O.ceCanvas(1);

const ws = 12;
const hs = 25;
const offset = 15;

const cols = {
  bg: 'white',
  text: 'black',
};

const lines = [];

let cx = 0;
let cy = 0;
let cxPrev = 0;

let w, h;

const main = () => {
  initCanvas();
  aels();

  onResize();
  render();
};

const initCanvas = () => {
  g.translate(offset, offset);
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

  flags0: if(flags === 0){
    if(/^Arrow|^(?:Backspace|Home|End|Delete)$/.test(code)){
      processKey(code);
      break flags0;
    }
  }

  render();
};

const onKeyPress = evt => {
  const {key} = evt;

  processKey(key);

  if(key.length === 1){
    const openParens = '([{';
    const openParenType = openParens.indexOf(key);

    if(openParenType !== -1){
      processKey(')]}'[openParenType]);
      processKey('ArrowLeft');
    }
  }

  render();
};

const processKey = key => {
  while(lines.length <= cy)
    lines.push('');

  const line = lines[cy];
  const lineLen = line.length;
  const linesNum = lines.length;
  const linesNum1 = linesNum - 1;

  const p1 = line.slice(0, cx);
  const p2 = line.slice(cx);

  if(key === 'Enter'){
    lines[cy] = p1;
    lines.splice(++cy, 0, p2);
    setCx(0);
    return;
  }

  if(key === 'Backspace'){
    if(cx === 0){
      if(cy === 0){
        setCx(0);
        return;
      }

      lines.splice(cy, 1);
      setCx(lines[--cy].length);
      lines[cy] += line;
      return;
    }

    decCx();
    lines[cy] = p1.slice(0, -1) + p2;
    return;
  }

  if(key === 'Delete'){
    if(cx === lineLen){
      if(cy === linesNum1){
        setCx();
        return;
      }

      lines[cy] += lines.splice(cy + 1, 1)[0];
      return;
    }

    lines[cy] = p1 + p2.slice(1);
    return;
  }

  if(key === 'Home'){
    setCx(0);
    return;
  }

  if(key === 'End'){
    setCx(lineLen);
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

  lines[cy] = p1 + key + p2
  incCx();
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