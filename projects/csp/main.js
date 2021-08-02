'use strict';

const Tile = require('./tile');
const CSP = require('./csp');

const tileSize = 40;
const fontSize = tileSize * .6;

const w = 5;
const h = 1;

let grid;
let csp;

const {g} = O.ceCanvas(1);

let iw, ih;
let iwh, ihh;

const main = () => {
  const unsolved = new Map();

  grid = new O.Grid(w, h, (x, y) => {
    const d = new Tile(grid, x, y);
    const vals = new Set(O.ca(5, i => i + 1));

    unsolved.set(d, vals);
    
    return d;
  });

  csp = new CSP(grid, unsolved);

  aels();
  onResize();
};

const aels = () => {
  O.ael('keydown', onKeyDown);
  O.ael('resize', onResize);
};

const onKeyDown = evt => {
  const {ctrlKey, shiftKey, altKey, code} = evt;
  const flags = (ctrlKey << 2) | (shiftKey << 1) | altKey;

  if(flags === 0){
    if(code === 'Enter'){
      csp.tick();
      return;
    }

    return;
  }
};

const onResize = evt => {
  iw = O.iw;
  ih = O.ih;
  iwh = iw / 2;
  ihh = ih / 2;

  g.resize(iw, ih);
  g.font(fontSize);

  render();
};

const render = () => {
  g.clearCanvas('darkgray');

  g.translate(iwh, ihh);
  g.scale(tileSize);
  g.translate(-w / 2, -h / 2);

  const {gs} = g;

  grid.iter((x, y, d) => {
    g.save();
    g.translate(x, y);
    d.render(g);
    g.restore();
  });

  g.beginPath();

  for(let i = 0; i <= w; i++){
    g.moveTo(i, 0);
    g.lineTo(i, h + gs);
  }

  for(let i = 0; i <= h; i++){
    g.moveTo(0, i);
    g.lineTo(w + gs, i);
  }

  g.stroke();

  g.resetTransform();
};

main();