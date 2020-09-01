'use strict';

const Tile = require('./tile');

const {assert} = O;

const {g, w, h} = O.ceCanvas();

const black = new Uint8ClampedArray([0, 0, 0]);
const white = new Uint8ClampedArray([255, 255, 255]);
const red = new Uint8ClampedArray([255, 0, 0]);
const green = new Uint8ClampedArray([0, 255, 0]);

const bgCol = black;

const biomeCols = [
  red,
  green
];

const main = () => {
  const imgd = g.createImageData(w, h);
  const {data} = imgd;

  for(let i = 0; i !== data.length; i += 4)
    data[i + 3] = 255;

  const setCol = (x, y, col) => {
    const i = (y | 0) * (w | 0) + (x | 0) << 2;
    data[i | 0] = col[0] | 0;
    data[(i | 0) + 1] = col[1] | 0;
    data[(i | 0) + 2] = col[2] | 0;
  };

  for(let y = 0; y !== h; y++)
    for(let x = 0; x !== w; x++)
      setCol(x, y, bgCol);

  g.putImageData(imgd, 0, 0);

  const grid = new O.Grid(w, h);

  const getTile = (x, y) => {
    if(!grid.has(x, y)) return null;

    const d = grid.get(x, y);
    if(d !== null) return d;

    const tile = new Tile();
    grid.set(x, y, tile);

    return tile;
  };

  const scheduledSet = new O.Set2D();
  const scheduledArr = [];

  const getBiome = (x, y) => {
    const d = getTile(x, y);

    if(d === null) return null;
    return d.biome;
  };

  const setBiome = (x, y, biome, isScheduled=1) => {
    const d = getTile(x, y);

    assert(d !== null);
    assert(d.biome === null);

    if(isScheduled) unschedule(x, y)

    d.biome = biome;
    setCol(x, y, biomeCols[biome]);

    grid.adj(x, y, (x, y) => schedule(x, y));
  };

  const schedule = (x, y) => {
    if(scheduledSet.has(x, y)) return;

    const d = getTile(x, y);
    if(d === null) return;
    if(d.biome !== null) return;

    scheduledSet.add(x, y);
    scheduledArr.push(x, y);
  };

  const unschedule = (x, y) => {
    assert(scheduledSet.has(x, y));
    scheduledSet.delete(x, y);
  };

  setBiome(w / 2 - 100 | 0, h / 2 | 0, 0, 0);
  setBiome(w / 2 + 100 | 0, h / 2 | 0, 1, 0);

  let paused = 1;

  O.ael('keydown', evt => {
    switch(evt.code){
      case 'Space':
        paused ^= 1;
        break;
    }
  });

  const gridAux = new O.Grid(3, 3, () => new Tile());
  const vecAux = {x: 0, y: 0};

  const auxGet = (x, y) => {
    return gridAux.get(x, y).biome;
  };

  const auxSet = (x, y, biome) => {
    gridAux.get(x, y).biome = biome;
  };

  const render = () => {
    if(!paused){
      for(let i = 0; i !== 100; i++){
        if(scheduledArr.length === 0) break;

        const len = scheduledArr.length;
        const index = O.rand(len) & ~1;
        const x = scheduledArr[index];
        const y = scheduledArr[index + 1];

        if(index !== len - 2){
          scheduledArr[index] = scheduledArr[len - 2];
          scheduledArr[index + 1] = scheduledArr[len - 1];
        }

        scheduledArr.pop();
        scheduledArr.pop();

        const avail = new Map();
        const candidates = [];

        for(let dy = 0; dy !== 3; dy++){
          for(let dx = 0; dx !== 3; dx++){
            const b = getBiome(x + dx - 1, y + dy - 1);

            auxSet(dx, dy, b);

            if(b !== null)
              avail.set(b, avail.has(b) ? avail.get(b) + 1 : 1);
          }
        }

        let totalCand = 0;

        for(const [b, n] of avail){
          auxSet(1, 1, b);

          if(gridAux.find(vecAux, (x, y, d) => d.biome !== b)){
            let k = 0;

            gridAux.iterAdj(vecAux.x, vecAux.y, (x, y, d) => {
              if(d.biome === b) return 0;
              k++;
              return 1;
            });

            if(n + k !== 7) continue;
          }

          totalCand += n;
          candidates.push(b, n);
        }

        if(candidates.length === 0){
          unschedule(x, y);
          continue;
        }

        let candIndex = O.rand(totalCand);
        let biome;

        for(let i = 0; i !== candidates.length; i += 2){
          candIndex -= candidates[i + 1];

          if(candIndex <= 0){
            biome = candidates[i];
            break;
          }
        }

        setBiome(x, y, biome);
      }

      g.putImageData(imgd, 0, 0);
    }

    O.raf(render);
  };

  render();
};

main();