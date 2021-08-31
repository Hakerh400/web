'use strict';

const assert = require('assert');
const Tile = require('./tile');
const State = require('./state');

const tileSize = 60;
const fontSize = tileSize * .5;

const cols = {
  bg: 'darkgray',
  emptyState: 'darkgray',
};

const {g} = O.ceCanvas(1);

let iw, ih;
let iwh, ihh;

let w = 5;
let h = 5;

let grid;

const states = new Set();

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

const render = () => {
  g.resetTransform();
  g.clearCanvas(cols.bg);

  g.translate(iwh, ihh);
  g.scale(tileSize);
  g.translate(-w / 2, -h / 2);

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

  for(const state of states){
    g.fillStyle = 'white';
    state.render(g);
  }
};

const createState = col => {
  const state = new State(col);
  states.add(state);
  return state;
};

main();