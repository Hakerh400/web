'use strict';

const assert = require('assert');
const CSP = require('./games/sudoku/csp');
const Grid = require('./games/sudoku/grid');
const Tiles = require('./games/sudoku/tiles');
const flags = require('./flags');

const {abs, floor, ceil, round} = Math;

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

// const n = 2;
const size = 4//n ** 2;
const w = size;
const h = size;

const tileSize = 50;
const fontSize = tileSize * .6;

const moves = [];

let grid;
let csp;

const {g} = O.ceCanvas(1);

let iw, ih;
let iwh, ihh;

let cx = 0;
let cy = 0;

const main = async () => {
  grid = new Grid(w, h);
  csp = new CSP(grid);

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

  aels();
  onResize();

  csp.generate();

  const div = O.ceDiv(O.body);
  div.style.margin = '8px';

  const givenTiles = new Map();

  for(const tile of grid.tiles)
    givenTiles.set(tile, tile.val);

  const blankTiles = new Set();
  let i = 0;

  for(const tile of O.shuffle([...grid.tiles].filter(a => 1))){
    const percent = round(
      (i + 1) /
      (grid.tiles.size + 1) * 100);

    div.innerText = `${percent}%`;
    // render();
    await new Promise(res => setTimeout(res, 30));

    i++;

    for(const tile of blankTiles)
      tile.setVal(null);

    for(const [tile, val] of givenTiles)
      tile.setVal(val);

    const {val} = tile;
    tile.val = null;

    if(csp.solve() === 1){
      givenTiles.delete(tile);
      blankTiles.add(tile);
    }
  }

  for(const tile of blankTiles)
    tile.setVal(null);

  for(const [tile, val] of givenTiles)
    tile.setVal(val);

  div.remove();

  render();
};

const aels = () => {
  O.ael('keydown', onKeyDown);
  O.ael('mousemove', onMouseMove);
  O.ael('mousedown', onMouseDown);
  O.ael('contextmenu', onContextMenu);
  O.ael('resize', onResize);
};

const onKeyDown = evt => {
  const {ctrlKey, shiftKey, altKey, code} = evt;
  const flags = (ctrlKey << 2) | (shiftKey << 1) | altKey;

  if(flags === 0){
    if(code === 'Enter'){
      const result = csp.solve(1);

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

    const digitMatch = code.match(/^(?:Digit|Numpad)(\d)$/);

    if(digitMatch !== null){
      if(grid.err !== null) return;

      const n = digitMatch[1] | 0;
      if(n > size) return;

      const d = getSquare();
      if(d === null) return;

      setVal(d, n !== 0 ? n : null);
      return;
    }

    return;
  }

  if(flags === 4){
    if(code === 'KeyZ'){
      if(moves.length === 0)
        return;

      if(grid.err !== null){
        const {errTiles} = grid;

        for(const tile of errTiles)
          tile.err = 0;

        assert(errTiles.size === 0);
        grid.err = null;
      }

      const move = moves.pop();
      const [tile, val] = move;

      tile.setVal(val);
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
  if(grid.err !== null) return;

  const btn = evt.button;
  if(btn === 1) return;

  const line = getLine();
  if(line === null) return;

  setVal(line, btn === 0 ? 1 : 0);
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

const setVal = (tile, valNew) => {
  const {val} = tile;

  moves.push([tile, val]);
  tile.val = null;

  if(valNew !== val){
    tile.val = valNew;

    if(valNew !== null)
      csp.check(tile, 1);
  }

  render();
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