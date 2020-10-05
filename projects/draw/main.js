'use strict';

const TILE_SIZE = O.urlParam('s', 40) | 0;
const BG_COL = O.urlParam('bg', 'white');

const {g} = O.ceCanvas(1);

const N = null;

const drawSolution = 1;

const grid = [
  [3, 1, 2, 2],
  [2, 3, 4, 2],
  [2, 2, 1, 2],
  [4, 2, 3, 1],
];

const solution = [
  [1, 1, 1, 0],
  [0, 1, 1, 1],
  [1, 0, 1, 0],
  [1, 1, 1, 1],
];

const main = () => {
  const h = grid.length;
  if(h === 0) return;

  const w = grid[0].length;
  if(w === 0) return;

  g.fillStyle = BG_COL
  g.fillRect(0, 0, w, h);

  g.translate((O.iw - w * TILE_SIZE) / 2, (O.ih - h * TILE_SIZE) / 2);
  g.scale(TILE_SIZE);

  g.font(TILE_SIZE * .5);

  const drawTile = (x, y, d) => {
    if(!drawSolution){
      g.fillStyle = 'darkgray';
      g.fillRect(0, 0, 1, 1);

      g.fillStyle = 'black';
      g.fillText(d, .5, .5);
    }else{
      const white = solution[y][x];
      g.fillStyle = white ? 'white' : 'black';
      g.fillRect(0, 0, 1, 1);

      if(white){
        g.fillStyle = 'black';
        g.fillText(d, .5, .5);
      }
    }

    g.strokeRect(0, 0, 1, 1);
  };

  grid.forEach((row, y) => {
    row.forEach((d, x) => {
      g.save();
      g.translate(x, y);
      drawTile(x, y, d);
      g.restore();
    });
  });
};

main();