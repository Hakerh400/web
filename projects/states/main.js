'use strict';

const assert = require('assert');
const Tile = require('./tile');
const State = require('./state');

const {floor} = Math;

const tileSize = 60;
const fontSize = tileSize * .5;

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

const main = () => {
  State.emptyCol = cols.emptyState;

  const state1 = createState('#f00');
  const state2 = createState('#0f0');

  grid = new O.Grid(w, h, (x, y, grid) => {
    const d = new Tile(grid, x, y);
    return d;
  });

  grid.get(0, 0).set(state1, 5);
  grid.get(0, 1).set(state1, 2);
  grid.get(3, 0).set(state2, 7);

  curStateIndex = 0;
  curState = states[0];

  aels();
  onResize();
};

const aels = () => {
  O.ael('mousedown', onMouseDown);
  O.ael('mouseup', onMouseUp);
  O.ael('contextmenu', onContextMenu);
  O.ael('resize', onResize);
};

const onMouseDown = evt => {
  const {button} = evt;

  updateCur(evt);

  if(button === 0){
    curTile = getCurTile();
    curTile1 = null;
    return;
  }

  if(button === 2){
    curTile = null;
    curTile1 = null;
    return;
  }
};

const onMouseUp = evt => {
  const {button} = evt;

  updateCur(evt);

  if(button === 0){
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

      curTile.addAction(curState, 1);
      curTile = null;
      curTile1 = null;
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
  g.font(fontSize);

  render();
};

const updateCur = evt => {
  cx = floor((evt.clientX - iwh) / tileSize + wh);
  cy = floor((evt.clientY - ihh) / tileSize + hh);
};

const getCurTile = () => {
  const d = grid.get(cx, cy);

  if(d === null || d.state !== curState)
    return null;

  return d;
};

const nextState = () => {
  const statesNum = states.length;

  if(curStateIndex === statesNum - 1){
    curStateIndex = 0;
    execActions();
  }else{
    curStateIndex++;
  }

  curState = states[curStateIndex];
  render();
};

const execActions = () => {
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

  if(curState !== null){
    g.fillStyle = cols.curState;
    curState.render(g);
  }
};

const createState = col => {
  const state = new State(col);
  states.push(state);
  return state;
};

main();