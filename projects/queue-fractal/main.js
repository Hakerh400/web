'use strict';

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const func = (x, y, n) => {
  return x & n & 8 ? x ** y : y ** x;
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const Tile = require('./tile');
const ScheduledCoords = require('./scheduled-coords');

const {assert} = O;

const AUTOPLAY = 1;
const SPEED = 10e3;

// O.enhanceRNG();
// O.randSeed(0);

const {g, w, h, wh, hh} = O.ceCanvas();

const black = new Uint8ClampedArray([0, 0, 0]);
const white = new Uint8ClampedArray([255, 255, 255]);
const red = new Uint8ClampedArray([255, 0, 0]);
const green = new Uint8ClampedArray([0, 255, 0]);

const bgCol = black;

const biomeCols = [
  red,
  green,
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
  const scheduledQueue = new O.PriorityQueue();

  const getBiome = (x, y) => {
    const d = getTile(x, y);

    if(d === null) return null;
    return d.biome;
  };

  const col = new Uint8ClampedArray(3);
  let abc = 0;

  const setBiome = (x, y, biome, isScheduled=1) => {
    const d = getTile(x, y);

    if(isScheduled) unschedule(x, y);

    d.biome = biome;
    // setCol(x, y, biomeCols[biome]);

    const N = 100e3;
    setCol(x, y, O.hsv((abc / N) % 1, col));
    if(++abc === N) abc = 0;

    grid.adj(x, y, (x, y) => schedule(x, y));
  };

  const schedule = (x, y) => {
    // if(scheduledSet.has(x, y)) return;

    const d = getTile(x, y);
    if(d === null) return;
    if(d.biome !== null) return;

    scheduledSet.add(x, y);

    let n = 0;
    let i = 1;

    grid.adjc(x, y, (x, y, d) => {
      if(d !== null && d.biome !== null) n |= i;
      i <<= 1;
    });

    const pri = func(x - wh, y - hh, n);
    scheduledQueue.push(new ScheduledCoords(x, y, pri));
  };

  const unschedule = (x, y) => {
    scheduledSet.delete(x, y);
  };

  setBiome(0, 0, 0, 0);

  let paused = !AUTOPLAY;

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
      for(let i = 0; i !== SPEED; i++){
        if(scheduledQueue.isEmpty) break;

        const elem = scheduledQueue.pop();
        const {x, y} = elem;
        if(getBiome(x, y) !== null) continue;

        const avail = new Set();
        const availCount = new Map();
        const candidates = [];

        for(let dy = -1; dy <= 1; dy++){
          for(let dx = -1; dx <= 1; dx++){
            const b = getBiome(x + dx, y + dy);

            auxSet(dx + 1, dy + 1, b);

            if(b !== null){
              availCount.set(b, availCount.has(b) ? availCount.get(b) + 1 : 1);
              if((dx === 0) !== (dy === 0)) avail.add(b);
            }
          }
        }

        let totalCand = 0;

        for(const b of avail){
          const n = availCount.get(b);

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