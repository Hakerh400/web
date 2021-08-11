'use strict';

const CSPSudoku = require('./csp-sudoku');
const GridSudoku = require('./grid-sudoku');
const TileSudoku = require('./tile-sudoku');
const flags = require('./flags');

const seed = O.urlParam('seed', 0) | 0;
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

await O.addStyle('style.css');

const size = 7;
const w = size;
const h = size;

const tileSize = 50;
const fontSize = tileSize * .6;

let grid;
let csp;

const {g} = O.ceCanvas(1);

let iw, ih;
let iwh, ihh;

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
    return;

    if(d !== null){
      const n = a[y][x + 1] | 0;

      if(n !== 0)
        d.val = n;
    }

    // grid.getHLine(0, 1).val = 1;
    // grid.getHLine(2, 1).val = 1;
    // grid.getHLine(4, 3).val = 1;

    // grid.getVLine(2, 0).val = 1;
  });

  csp.tick();

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