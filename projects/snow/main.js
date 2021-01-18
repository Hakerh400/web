'use strict';

const {min, max, abs, tanh} = Math;

const SPEED = 1e3;

const PROB_HOR = .1;
const VAL_INIT = 1;
const VAL_EDGE = 0;
const VAL_MULT_LR = 0;
const VAL_MULT_DLR = .1;
const VAL_MULT_DW = .9;

const {g, w, h, wh, hh} = O.ceCanvas();

const cols = [
  [53,  189, 255],
  [40,  40,  40 ],
  [255, 255, 255],
];

const EMPTY = [0];
const WALL = [1];
const SNOW = 2;

const grid = new O.Grid(w, h, initTile);
const imgd = new O.ImageData(g);

const aux = new Uint8ClampedArray(3);

function main(){
  imgd.iter((x, y) => {
    return cols[get(x, y)[0]];
  });

  O.raf(render);
}

function initTile(x, y){
  const s = 100;
  const sh = s / 2;

  if(abs(x - wh) < sh && h - y < s)
    return WALL;

  return EMPTY;
}

function get(x, y){
  return grid.get(x, y) || WALL;
}

function set(x, y, d){
  const prev = grid.get(x, y);
  if(prev === null) return;

  grid.set(x, y, d);

  if(d[0] !== SNOW){
    imgd.set(x, y, cols[d[0]]);
    return;
  }

  aux[0] = aux[1] = aux[2] = d[1] * 255;
  imgd.set(x, y, aux);
}

function getType(x, y){
  return get(x, y)[0];
}

function getVal(x, y){
  const d = get(x, y);

  if(d === EMPTY) return 0;
  if(d === WALL) return VAL_INIT;

  return d[1];
}

function calcValNew(x, y){
  return tanh(
    (getVal(x - 1, y) + getVal(x + 1, y)) * VAL_MULT_LR +
    (getVal(x - 1, y + 1) + getVal(x + 1, y + 1)) * VAL_MULT_DLR +
    getVal(x, y + 1) * VAL_MULT_DW
  );
}

function setSnow(x, y){
  set(x, y, [SNOW, calcValNew(x, y)]);
}

function render(){
  iterLoop: for(let i = 0; i !== SPEED; i++){
    let x = O.rand(w);
    let y = 0;

    if(get(x, y) !== EMPTY)
      continue iterLoop;

    snowflake: while(1){
      const lf = get(x - 1, y);
      const rg = get(x + 1, y);
      const lfne = lf !== EMPTY;
      const rgne = rg !== EMPTY;
      const lrne = lfne && rgne;

      horizontal: if(O.randf() < PROB_HOR){
        if(lrne) break horizontal;

        const dir = (
          lfne ? 1 :
          rgne ? -1 :
          O.rand() ? 1 : -1
        );

        x += dir;

        continue snowflake;
      }

      // Vertical

      const dw = get(x, y + 1);
      const dwne = dw !== EMPTY;

      if(!dwne){
        y++;
        continue snowflake;
      }

      const dl = get(x - 1, y + 1);
      const dr = get(x + 1, y + 1);

      const dlne = dl !== EMPTY;
      const drne = dr !== EMPTY;

      if((dlne && drne) || O.randf() < calcValNew(x, y)){
        setSnow(x, y);
        continue iterLoop;
      }

      const dir = (
        dlne ? 1 :
        drne ? -1 :
        O.rand() ? 1 : -1
      );
      
      let x1 = x;
      let y1 = y + 1;

      hindFreeHor: while(1){
        if(get(x1, y) !== EMPTY){
          const x2 = O.rand(min(x, x1), max(x, x1));
          setSnow(x2, y);
          continue iterLoop;
        }

        if(get(x1, y1) === EMPTY){
          x = x1;
          y = y1;
          continue snowflake;
        }

        x1 += dir;
      }

      O.assert.fail();
    }

    O.assert.fail();
  }

  imgd.put();

  O.raf(render);
}

main();