'use strict';

const assert = require('assert');
const Tile = require('./tile');
const State = require('./state');

const tileSize = 60;
const fontSize = tileSize * .5;

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

let stateIndex = null;

let cx = 0;
let cy = 0;

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

  aels();
  onResize();
};

const aels = () => {
  O.ael('resize', onResize);
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
  cx = (evt.clientX - iwh) / tileSize + wh;
  cy = (evt.clientY - ihh) / tileSize + hh;
};

const render = () => {
  const curState = stateIndex !== null ?
    states[stateIndex] : null;

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