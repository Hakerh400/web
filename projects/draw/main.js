'use strict';

const TILE_SIZE = O.urlParam('s', 40) | 0;
const BG_COL = O.urlParam('bg', 'white');

const {g} = O.ceCanvas(1);

const N = null;

const grid1 = [
  [
    [1, 2, 2, N, N],
    [2, N, 2, N, N],
    [2, N, 1, N, N],
    [2, N, 4, N, N],
  ], [
    [N, 4, 3, N, N],
    [N, N, N, N, N],
    [N, N, 1, N, N],
    [N, N, N, N, N],
  ], [
    [N, 0, 1, N, N],
    [N, N, 3, N, N],
    [N, N, 2, N, N],
    [N, N, 4, N, N],
  ], [
    [N, 1, 3, N, N],
    [N, N, 2, N, N],
    [N, N, 3, N, N],
    [N, N, 3, N, N],
]];

const grid2 = [
  [
    [1, 2, 2, 0, N],
    [2, N, 2, 1, 0],
    [2, N, 1, 0, N],
    [2, N, 4, 1, 0],
  ], [
    [N, 4, 3, 1, N],
    [N, N, 4, 1, N],
    [N, N, 1, 1, N],
    [N, N, 2, 1, N],
  ], [
    [N, 0, 1, 0, 1],
    [N, N, 3, 0, 1],
    [N, N, 2, 0, 1],
    [N, N, 4, 0, 1],
  ], [
    [N, 1, 3, 0, N],
    [N, N, 2, 0, 0],
    [N, N, 3, 1, N],
    [N, N, 3, 0, 0],
]];

const grid = grid2;

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
    g.fillStyle = d[3] === N ? 'darkgray' : d[3] ? 'black' : 'white';
    g.fillRect(0, 0, 1, 1);

    if(d[2] !== N){
      g.fillStyle = d[3] === 1 ? 'white' : 'black';
      g.fillText(d[2], .5, .5);
    }

    g.fillStyle = 'black';
    if(d[0] !== N) g.fillText(d[0], .5, -.5);
    if(d[1] !== N) g.fillText(d[1], -.5, .5);

    g.strokeRect(0, 0, 1, 1);

    if(d[4] !== N){
      const offset = .125;
      const offset2 = offset * 2;

      g.strokeStyle = 'white';
      g.globalCompositeOperation = 'difference';

      if(d[4] === 0) g.strokeRect(-1 + offset, offset, 2 - offset2, 1 - offset2);
      else g.strokeRect(offset, -1 + offset, 1 - offset2, 2 - offset2);

      g.globalCompositeOperation = 'source-over';
      g.strokeStyle = 'black';
    }
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