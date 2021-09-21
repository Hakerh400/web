'use strict';

const assert = require('assert');

const {
  min, max, abs, floor, ceil, round,
  sin, cos, atan2,
} = Math;

const {pi, pih, pi2} = O;

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

  const d = new O.ImageData(g);
  const col = new Uint8ClampedArray(3);

  const setDefaultCol = col => {
    col.fill(0);
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
    const k = 1 - abs(n % 1 * 2 - 1) ** 3;

    for(let i = 0; i !== 3; i++)
      col[i] = c[i] * k;
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

  for(let xx = 1; xx !== w; xx++){
    for(let yy = 0; yy !== h; yy++){
      const x = xx - wh;
      const y = yy - hh;

      const f = on(x, x, y) + on(y, on(x, 100, 200), y)

      num2col(col, f);
      d.set(xx, yy, col);
    }
  }

  d.put();
};

main();