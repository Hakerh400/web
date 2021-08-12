'use strict';

const CSPSudoku = require('./csp-sudoku');
const GridSudoku = require('./grid-sudoku');
const TileSudoku = require('./tile-sudoku');
const flags = require('./flags');

const {abs, floor, ceil} = Math;

await O.addStyle('style.css');

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

const n = 2;
const size = n ** 2;
const w = size;
const h = size;

const tileSize = 50;
const fontSize = tileSize * .6;

let grid;
let csp;

const {g} = O.ceCanvas(1);

let iw, ih;
let iwh, ihh;

let cx = 0;
let cy = 0;

const main = () => {
  const a = O.sanl(O.ftext(`
    |     |
    |     |
    |     |
    |     |
    |     |
  `));

  grid = new GridSudoku(w, h);
  csp = new CSPSudoku(grid);

  grid.csp = csp;

  grid.iter((x, y, d, h, v) => {
    /*if(d !== null){
      const n = a[y][x + 1] | 0;

      if(n !== 0)
        d.val = n;
    }*/

    /*if(h !== null)
      h.val = y % n === 0 ? 1 : 0;

    if(v !== null)
      v.val = x % n === 0 ? 1 : 0;*/
  });

  // csp.tick();

  aels();
  onResize();
};

const aels = () => {
  O.ael('keydown', onKeyDown);
  O.ael('mousemove', onMouseMove);
  O.ael('mousedown', onMouseDown);
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

const onMouseMove = evt => {
  updateCur(evt);
};

const onMouseDown = evt => {
  updateCur(evt);
};

const updateCur = evt => {
  cx = (evt.clientX - iwh) / tileSize + w / 2;
  cy = (evt.clientY - ihh) / tileSize + h / 2;
};

const getSquare = () => {
  return grid.getSquare(floor(cx), floor(cy));
};

const getLine = () => {
  const mx = cx + .5;
  const my = cy + .5;
  const ax = abs((mx % 1 + 1) % 1 - .5);
  const ay = abs((my % 1 + 1) % 1 - .5);

  if(ax < ay)
    return grid.getVLine(floor(mx), floor(cy));

  return grid.getHLine(floor(cx), floor(my));
};

const onResize = evt => {
  iw = O.iw;
  ih = O.ih;
  iwh = iw / 2;
  ihh = ih / 2;

  g.resize(iw, ih);
  g.font(fontSize);

  g.lineCap = 'square';

  render();
};

const render = () => {
  g.clearRect(0, 0, iw, ih);

  g.translate(iwh, ihh);
  g.scale(tileSize);
  g.translate(-w / 2, -h / 2);

  grid.render(g);

  g.resetTransform();
};

main();