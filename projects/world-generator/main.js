'use strict';

const Grid = require('./grid');
const Tile = require('./tile');

const {abs, sqrt, sin, cos} = Math;
const {pi, pi2, pih} = O;

const DEBUG = 0;
const DETERMINISTIC = 0;
const RAINBOW = 1;
const AUTOPLAY = O.urlParam('a', 1) | 0;
const SPEED = DEBUG ? 100 : 1e4;

if(DETERMINISTIC){
  O.enhanceRNG();
  O.randSeed(0);
}

const {g, w, h, wh, hh} = O.ceCanvas();

const black = [0, 0, 0];
const white = [255, 255, 255];
const red = [255, 0, 0];
const green = [0, 255, 0];

const bgCol = black;

const biomesNum = 20;
const biomeCols = O.ca(biomesNum, (i, k) => O.hsv(k));

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

  const grid = new Grid(w, h);

  const scheduledMap = new O.Map2D();
  const arrsNum = 20;
  const scheduledArrs = O.ca(arrsNum, () => []);

  const getBiome = (x, y) => {
    const d = grid.get(x, y);

    if(d === null) return null;
    return d.biome;
  };

  const colAux = new Uint8ClampedArray(3);

  const rainbowIndexMax = 1e5;
  const rainbowIndices = O.ca(biomesNum, () => 0);

  const setBiome = (x, y, b) => {
    const d = grid.get(x, y);
    d.biome = b;

    let col;

    if(RAINBOW){
      const k = (b + 3) / (biomesNum - 2);
      col = O.hsv(rainbowIndices[b] / rainbowIndexMax, colAux);
      for(let i = 0; i !== 3; i++)
        col[i] *= k;

      if(++rainbowIndices[b] === rainbowIndexMax)
        rainbowIndices[b] = 0
    }else{
      col = biomeCols[b];
    }

    setCol(x, y, col);

    grid.adj(x, y, (x, y) => schedule(x, y, b));
  };

  const schedule = (x, y, b) => {
    const d = grid.get(x, y);
    if(d === null || d.biome !== null) return;

    if(scheduledMap.has(x, y))
      unschedule(x, y);

    const biomes = O.obj();

    let maxNum = 0;
    let maxBiome = null;

    grid.adj(x, y, (x, y, d) => {
      if(d === null) return;

      const {biome} = d;
      if(biome === null) return;

      if(!(biome in biomes)) biomes[biome] = 0;

      const n = ++biomes[biome];

      if(n > maxNum || (n === maxNum && biome !== maxBiome && O.rand(2))){
        maxNum = n;
        maxBiome = biome;
      }
    });

    const xx = x;
    const yy = y;
    let arr;

    {
      const x = xx / wh - 1;
      const y = yy / hh - 1;
      const n = maxNum / 1.5 - 1;

      const num = n + O.hypot(x, y) % x;

      arr = scheduledArrs[O.bound((num + 1) * arrsNum >> 1, 0, arrsNum - 1)];
    }

    arr.push([x, y]);
    scheduledMap.set(x, y, [arr, arr.length - 1]);
  };

  const unschedule = (x, y) => {
    const [arr, index] = scheduledMap.get(x, y);
    const len1 = arr.length - 1;

    if(index !== len1){
      const coords = arr[len1];
      const [x, y] = coords;

      arr[index] = coords;
      scheduledMap.get(x, y)[1] = index;
    }

    arr.pop();
    scheduledMap.delete(x, y);
  };

  if(DEBUG){
    setBiome(w >> 1, h >> 1, 0);
  }else{
    for(let i = 0; i !== biomeCols.length; i++){
      while(1){
        const x = O.rand(w);
        const y = O.rand(h);
        if(grid.get(x, y).biome !== null) continue;
    
        setBiome(x, y, i);
        break;
      }
    }
  }

  let paused = !AUTOPLAY;

  O.ael('keydown', evt => {
    switch(evt.code){
      case 'Space':
        paused ^= 1;
        break;
    }
  });

  const gridAux = new Grid(3, 3);
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
        const arrs = scheduledArrs.filter(a => a.length !== 0);
        if(arrs.length === 0) break;

        let arrIndex = arrsNum * (1 - O.randf() ** 2) | 0;
        if(arrIndex === arrsNum) arrIndex--;

        let arr = scheduledArrs[arrIndex];

        findNonEmptyArr: if(arr.length === 0){
          for(let i = arrIndex + 1; i !== arrsNum; i++){
            const a = scheduledArrs[i];
            if(a.length !== 0){
              arr = a;
              break findNonEmptyArr;
            }
          }

          for(let i = arrIndex - 1; i !== -1; i--){
            const a = scheduledArrs[i];
            if(a.length !== 0){
              arr = a;
              break findNonEmptyArr;
            }
          }
        }

        const [x, y] = O.randElem(arr);

        unschedule(x, y);

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

        if(candidates.length === 0) continue;

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