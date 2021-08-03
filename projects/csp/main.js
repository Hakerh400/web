'use strict';

const Tile = require('./tile');
const CSP = require('./csp');

const tileSize = 50;
const fontSize = tileSize * .6;

const w = 9;
const h = 9;

let grid;
let csp;

const {g} = O.ceCanvas(1);

let iw, ih;
let iwh, ihh;

const main = () => {
  const tiles = [];

  const a = O.sanl(O.ftext(`
    |  3   169|
    |12    7  |
    | 4   5   |
    | 5  2 9  |
    |     3 7 |
    |2  594   |
    |8   36   |
    |  4   5  |
    |6      8 |
  `));

  grid = new O.Grid(w, h);

  grid.iter((x, y) => {
    const n = a[y][x + 1] | 0;
    const vals = new Set(n !== 0 ? [n] : O.ca(w, i => i + 1));
    const d = new Tile(grid, x, y, vals);

    grid.set(x, y, d);
    tiles.push(d);
  });

  csp = new CSP(grid, tiles);
  grid.csp = csp;

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
      const result = csp.tick();

      if(result === 0){
        log('No solutions');
      }else if(result === 1){
        // log('Solved');
      }else if(result === 2){
        log('Multiple solutions');
      }

      render();
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