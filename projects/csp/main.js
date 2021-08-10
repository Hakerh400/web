'use strict';

const CSPSudoku = require('./csp-sudoku');
const GridSudoku = require('./grid-sudoku');
const TileSudoku = require('./tile-sudoku');

await O.addStyle('style.css');

const tileSize = 50;
const fontSize = tileSize * .6;

const w = 4;
const h = 4;

let grid;
let csp;

const {g} = O.ceCanvas(1);

let iw, ih;
let iwh, ihh;

const main = () => {
  const a = O.sanl(O.ftext(`
    |   2|
    |  3 |
    | 42 |
    |1   |
  `));

  grid = new GridSudoku(w, h);
  csp = new CSPSudoku(grid);

  grid.csp = csp;

  grid.iter((x, y, d, h, v) => {
    if(d !== null){
      const n = a[y][x + 1] | 0;
      if(n === 0) return;

      d.val = n;
    }

    if(h !== null && O.rand(3) !== 0) h.val = O.rand(2);
    if(v !== null && O.rand(3) !== 0) v.val = O.rand(2);
  });

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
  g.clearRect(0, 0, w, h);

  g.translate(iwh, ihh);
  g.scale(tileSize);
  g.translate(-w / 2, -h / 2);

  grid.render(g);

  g.resetTransform();
};

main();