'use strict';

const assert = require('assert');
const colors = require('../colors');
const Tile = require('./tile');
const State = require('./state');

const {floor} = Math;
const {pi, pih, pi2} = O;

const seed = O.urlParam('seed', O.rand(1e9)) | 0;
window.seed = seed;
O.enhanceRNG();
O.randSeed(seed);
O.ael('keydown', evt => {
  if(evt.code === 'ArrowRight')
    location.href = location.href.replace(/&seed=.*|$/, `&seed=${seed + 1}`);

  if(evt.code === 'ArrowLeft'){
    if(seed === 0) return;
    location.href = location.href.replace(/&seed=.*|$/, `&seed=${seed - 1}`);
  }
});

const tileSize = 60;
const tileFontSize = tileSize * .5;
const errFontSize = tileSize * .25;

// Tile mass threshold
const massTh = 10;

// State queue
const stqDiam = .5;
const stqOffsetY = .5;
const stqSpacing = .3;
const stqRad = stqDiam / 2;
const stqW = stqDiam + stqSpacing;

const cols = {
  bg: '#a9a9a9',
  emptyState: '#c0c0c0',
  curState: '#ffffff',
  err: '#000000',
};

const {g} = O.ceCanvas(1);

let iw, ih;
let iwh, ihh;

let w = 5;
let h = 5;

let wh = w / 2;
let hh = h / 2;

let grid;

const states = [];

let curStateIndex = null;
let curState = null;

let cx = 0;
let cy = 0;

let curTile = null;
let curTile1 = null;
let curTileDir = null;

let errMsg = null;

const main = () => {
  State.emptyCol = cols.emptyState;
  Tile.massTh = massTh;

  const state1 = createState('#f00', 1);
  const state2 = createState('#0f0');

  grid = new O.Grid(w, h, (x, y, grid) => {
    const d = new Tile(grid, x, y);
    return d;
  });

  for(let y = 0; y !== 3; y++){
    for(let x = 0; x !== 3; x++){
      grid.get(x, y).set(state1, 0);
    }
  }

  grid.get(3, 0).set(state2, 5);
  grid.get(4, 0).set(state2, 5);
  grid.get(3, 1).set(state2, 5);
  grid.get(4, 1).set(state2, 5);

  curStateIndex = 0;
  curState = states[0];

  aels();
  onResize();
};

const aels = () => {
  O.ael('keydown', onKeyDown);
  O.ael('mousedown', onMouseDown);
  O.ael('mouseup', onMouseUp);
  O.ael('contextmenu', onContextMenu);
  O.ael('resize', onResize);
};

const onKeyDown = evt => {
  const {ctrlKey, shiftKey, altKey, code} = evt;
  const flags = (ctrlKey << 2) | (shiftKey << 1) | altKey;

  if(flags === 0){
    const isEnter = code === 'Enter';
    const digitMatch = code.match(/^(?:Digit|Numpad)(\d)$/);

    if(isEnter || digitMatch !== null){
      if(curTile1 === null) return;

      const mass = curTile.mass;
      const mass1 = curTile1.mass;
      const n = isEnter ? mass : digitMatch[1] | 0;

      if(n === 0)
        return setErr(`Cannot move mass 0`);

      if(n > mass)
        return setErr(`Not enough mass`);

      if(curTile1.state === curState && mass1 + n > massTh)
        return setErr(`Mass exceeds the threshold`);

      curState.setBaseTile(curTile);
      curTile.moveMass(curTile1, n)
      nextState();

      return;
    }

    return;
  }
}

const onMouseDown = evt => {
  const {button} = evt;

  updateCur(evt);

  if(button === 0){
    if(curState === null) return;

    curTile = getCurTile(1);
    curTile1 = null;
    clearErr();

    return;
  }

  if(button === 2){
    if(curState === null) return;

    curTile = null;
    curTile1 = null;
    clearErr();

    return;
  }
};

const onMouseUp = evt => {
  const {button} = evt;

  updateCur(evt);

  if(button === 0){
    if(curState === null) return;
    if(curTile === null) return;
    if(curTile1 !== null) return;

    curTile1 = getCurTile();

    if(curTile1 === null){
      curTile1 = null;
      curTileDir = null;
      return;
    }

    if(curTile1 === curTile){
      const {mass} = curTile;

      if(mass === massTh){
        curTile = null;
        curTile1 = null;
        setErr(`Cannot increase the tile mass beyond the mass threshold`);
        return;
      }

      curState.setBaseTile(curTile);
      curTile.incMass();
      nextState();

      return;
    }

    curTileDir = curTile.adj2dir(curTile1);

    if(curTileDir === null){
      curTile1 = null;
      curTileDir = null;
      return;
    }

    render();

    return;
  }
};

const onContextMenu = evt => {
  O.pd(evt);
};

const onResize = evt => {
  iw = O.iw;
  ih = O.ih;
  iwh = iw / 2;
  ihh = ih / 2;

  g.resize(iw, ih);
  g.lineCap = 'square';
  g.font(tileFontSize);

  render();
};

const updateCur = evt => {
  cx = floor((evt.clientX - iwh) / tileSize + wh);
  cy = floor((evt.clientY - ihh) / tileSize + hh);
};

const getCurTile = (fromCurState=0) => {
  const d = grid.get(cx, cy);
  if(d === null) return null;

  if(fromCurState && d.state !== curState)
    return null;

  return d;
};

const nextState = () => {
  const statesNum = states.length;

  while(1){
    if(curStateIndex === statesNum - 1){
      curStateIndex = 0;
      execActions();
    }else{
      curStateIndex++;
    }

    curState = states[curStateIndex];
    curTile = null;
    curTile1 = null;

    if(curState.player) break;

    curState.randMove();
  }

  render();
};

const execActions = () => {
  for(const state of states)
    state.retainTiles();

  grid.iter((x, y, d) => {
    d.execActions();
  });
};

const render = () => {
  g.resetTransform();
  g.clearCanvas(cols.bg);

  g.translate(iwh, ihh);
  g.scale(tileSize);
  g.translate(-wh, -hh);

  grid.iter((x, y, d) => {
    g.save();
    g.translate(x, y);
    d.render(g);
    g.restore();
  });

  g.fillStyle = 'black';

  grid.iter((x, y, d) => {
    g.save();
    g.translate(x, y);
    d.renderLines(g);
    g.restore();
  });

  if(curState !== null){
    g.fillStyle = cols.curState;
    curState.render(g);
  }

  if(curTile !== null && curTile1 !== null){
    g.fillStyle = 'black';

    g.save();
    g.translate(curTile.x, curTile.y);

    const {gs} = g;

    if((curTileDir & 1) === 0){
      if(curTileDir === 0){
        g.fillRect(.5 - gs, -.2, gs * 2, .4);

        g.beginPath();
        g.moveTo(.5, -.2);
        g.lineTo(.6, -.1);
        g.lineTo(.4, -.1);
        g.closePath();
        g.fill();
        g.stroke();
      }else{
        g.fillRect(.5 - gs, .8, gs * 2, .4);

        g.beginPath();
        g.moveTo(.5, 1.2);
        g.lineTo(.6, 1.1);
        g.lineTo(.4, 1.1);
        g.closePath();
        g.fill();
        g.stroke();
      }
    }else{
      if(curTileDir === 1){
        g.fillRect(.8, .5 - gs, .4, gs * 2);

        g.beginPath();
        g.moveTo(1.2, .5);
        g.lineTo(1.1, .6);
        g.lineTo(1.1, .4);
        g.closePath();
        g.fill();
        g.stroke();
      }else{
        g.fillRect(-.2, .5 - gs, .4, gs * 2);

        g.beginPath();
        g.moveTo(-.2, .5);
        g.lineTo(-.1, .6);
        g.lineTo(-.1, .4);
        g.closePath();
        g.fill();
        g.stroke();
      }
    }

    g.restore();
  }

  drawStateQueue: {
    const statesNum = states.length;
    const wTot = statesNum * stqW - stqSpacing;
    const xStart = wh - wTot / 2 + stqRad;
    const y = h + stqOffsetY + stqRad;

    g.lineWidth = 3;

    for(let i = 0; i !== statesNum; i++){
      const state = states[i];
      const {col} = state;

      if(state === curState)
        g.strokeStyle = cols.curState;

      g.fillStyle = col;
      O.drawCirc(g, xStart + i * stqW, y, stqRad);

      if(state === curState)
        g.strokeStyle = 'black';
    }

    g.lineWidth = 1;
  }

  if(errMsg !== null){
    g.font(errFontSize);
    g.fillStyle = cols.err;
    g.fillText(errMsg, wh, -.5);
    g.font(tileFontSize);
  }
};

const createState = (...args) => {
  const state = new State(...args);
  states.push(state);
  return state;
};

const setErr = (msg, ren=1) => {
  errMsg = msg;
  if(ren) render();
};

const clearErr = ren => {
  setErr(null, ren);
};

main();