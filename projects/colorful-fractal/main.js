'use strict';

const assert = require('assert');

const {
  min, max, abs, floor, ceil, round,
  sin, cos, atan2,
} = Math;

const {pi, pih, pi2} = O;

const s = 2;

const {g} = O.ceCanvas();

const cols = [
  [255, 0, 255],
  [255, 0, 0],
  [255, 255, 0],
  [0, 255, 0],
  [0, 255, 255],
  [0, 0, 255],
];

const colsNum = cols.length;
const colsNum1 = colsNum + 1;

const main = () => {
  const w = O.iw;
  const h = O.ih;
  const wh = w / 2;
  const hh = h / 2;
  const ws = w * s;
  const hs = h * s;

  const setDefaultCol = col => {
    col.fill(0);
    return col;
  };

  const num2col = (col, n) => {
    if(isNaN(n))
      return setDefaultCol(col);

    n = abs(n);

    if(n === 0 || 1 / n === 0)
      return setDefaultCol(col);

    while(n < 1) n *= colsNum1;
    while(n >= colsNum1) n /= colsNum1;

    const c = cols[n - 1 | 0];
    const k1 = 1 - n % 1;
    const k2 = abs(k1 * 2 - 1)
    const k3 = k2 ** 3;

    if(k1 < .5){
      const k = k2 ** 20;

      for(let i = 0; i !== 3; i++)
        col[i] = (c[i] * (1 - k3) + 255 * k3) * (1 - k);
    }else{
      for(let i = 0; i !== 3; i++)
        col[i] = c[i] * (1 - k3);
    }

    return col;
  };

  const on = (n, a, b) => {
    if(a > b){
      const t = a;
      a = b;
      b = t;
    }

    const d = b - a;
    const d2 = d * 2;
    const k1 = (n / d2 % 1 + 1) % 1;
    const k2 = sin(k1 * pi2);
    const k = (k2 + 1) / 2;

    return a + k * d;
  };

  const d = new O.ImageData(g);

  const grid = new O.Grid(ws, hs, (xx, yy) => {
    const x = xx / s - wh;
    const y = yy / s - hh;

    const f = on(x, x, y) + on(y, on(x, 100, 200), y);

    const col = newCol();
    return num2col(col, f);
  });

  const col = new Uint32Array(3);

  for(let xx = 1; xx !== w; xx++){
    for(let yy = 0; yy !== h; yy++){
      col.fill(0);

      const xs = xx * s;
      const ys = yy * s;
      const x1 = max(xs - s + 1, 0);
      const y1 = max(ys - s + 1, 0);
      const x2 = min(xs + s - 1, ws - 1);
      const y2 = min(ys + s - 1, hs - 1);
      const n = (x2 - x1 + 1) * (y2 - y1 + 1);

      for(let x = x1; x <= x2; x++){
        for(let y = y1; y <= y2; y++){
          const c = grid.get(x, y);

          for(let i = 0; i !== 3; i++)
            col[i] += c[i];
        }
      }

      for(let i = 0; i !== 3; i++)
        col[i] = round(col[i] / n);

      d.set(xx, yy, col);
    }
  }

  d.put();
};

const newCol = () => {
  return new Uint8ClampedArray(3);
};

main();