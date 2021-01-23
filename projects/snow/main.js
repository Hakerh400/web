'use strict';

const {min, max, abs, tanh} = Math;

const SPEED = 1;

const PROB_HOR = .1;
const PROB_VAL = .5;
const PROB_EDGE = .9;

const VAL_INIT = 1;
const VAL_EDGE = 0;
const VAL_MULT_LR = 0;
const VAL_MULT_DLR = .35;
const VAL_MULT_DW = .45;

// const {g, w, h, wh, hh} = O.ceCanvas();

O.body.classList.add('has-canvas');
const canvas = O.ce(O.body, 'canvas');
const w = canvas.width = 640;
const h = canvas.height = O.ih;
const wh = w / 2;
const hh = h / 2;
const g = canvas.getContext('2d');
g.fillStyle = 'black';
g.fillRect(0, 0, w, h);

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

  if(O.dist(x, y, wh, h - s) < s)
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

  if(d[0] === SNOW){
    aux[0] = aux[1] = aux[2] = d[1] * 255;
    imgd.set(x, y, aux);
    return;
  }

  imgd.set(x, y, cols[d[0]]);
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
    (
      getVal(x - 1, y) +
      getVal(x + 1, y)
    ) * VAL_MULT_LR +
    (
      getVal(x - 1, y + 1) +
      getVal(x + 1, y + 1)
    ) * VAL_MULT_DLR +
    (
      getVal(x, y + 1)
    ) * VAL_MULT_DW
  );
}

function calcDir(x, y){
  const lf = get(x - 1, y);
  const rg = get(x + 1, y);
  const lfne = lf !== EMPTY;
  const rgne = rg !== EMPTY;

  if(lfne) return 1;
  if(rgne) return -1;

  // const vLeft = calcValNew(x - 1, y);
  // const vRight = calcValNew(x + 1, y);

  // if(vLeft > vRight) return -1;
  // if(vRight > vLeft) return 1;

  return O.rand() ? 1 : -1;
}

function setSnow(x, y){
  O.assert(get(x, y) === EMPTY);

  set(x, y, [SNOW, calcValNew(x, y)]);
}

function render(){
  iterLoop: for(let i = 0; i !== SPEED; i++){
    xLoop: for(let xx = 0; xx !== w; xx++){
      let x = xx;
      let y = 0;

      if(get(x, y) !== EMPTY)
        continue xLoop;

      snowflake: while(1){
        // if(y === h - 2) continue xLoop;

        const lf = get(x - 1, y);
        const rg = get(x + 1, y);
        const lfne = lf !== EMPTY;
        const rgne = rg !== EMPTY;
        const lrne = lfne && rgne;

        horizontal: if(O.randp(PROB_HOR)){
          if(lrne) break horizontal;

          x += calcDir(x, y);
          continue snowflake;
        }

        const dw = get(x, y + 1);
        const dl = get(x - 1, y + 1);
        const dr = get(x + 1, y + 1);
        const dwne = dw !== EMPTY;
        const dlne = dl !== EMPTY;
        const drne = dr !== EMPTY;

        if(!dwne){
          // tryEdge: {
          //   const d1 = grid.get(x - 1, y + 2);
          //   const d2 = grid.get(x + 1, y + 2);

          //   const a1 = d1 !== EMPTY;
          //   const a2 = d2 !== EMPTY;
          // }

          y++;
          continue snowflake;
        }


        if(dlne && drne){
          setSnow(x, y);
          continue xLoop;
        }

        if(O.randp(calcValNew(x, y) * PROB_VAL)){
          setSnow(x, y);

          // if(O.randp(PROB_EDGE)){
          //   const dir = calcDir(x, y);
          //   setSnow(x + dir, y);
          // }

          continue xLoop;
        }

        const dir = calcDir(x, y);
        
        let x1 = x;
        let y1 = y + 1;

        hindFreeHor: while(1){
          if(get(x1, y) !== EMPTY){
            x1 -= dir;

            const x2 = O.rand(min(x, x1), max(x, x1));
            setSnow(x2, y);

            continue xLoop;
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
  }

  imgd.put();

  O.raf(render);
}

main();