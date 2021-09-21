'use strict';

const assert = require('assert');

const {
  min, max, abs, floor, ceil, round,
  sin, cos, atan2,
} = Math;

const {pi, pih, pi2} = O;

const w = 1920;
const h = 1080;

const s = O.urlParam('s', 1) | 0;
const percentOffset = 10;

const {g} = O.ceCanvas();
const {canvas} = g;

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

const main = async () => {
  canvas.width = w;
  canvas.height = h;

  g.fillStyle = 'white';
  g.fillRect(0, 0, w, h);

  const wh = w / 2;
  const hh = h / 2;
  const ws = w * s;
  const hs = h * s;

  g.textBaseline = 'top';
  g.textAlign = 'left';
  g.font = '32px arial';

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

  const getCol = (xx, yy) => {
    const x = xx / s - wh;
    const y = yy / s - hh;

    const f = O.dist(x, on(y, 0, 100), 0, 0) * O.dist(y, on(x, 0, 100), 0, 0)

    return num2col(col, f);
  };

  const d = new O.ImageData(g);
  const col = new Uint8Array(3);
  const colAcc = new Uint32Array(3);

  for(let y = 0; y !== h; y++){
    if(s !== 1){
      await O.rafd(() => {
        const ofs = percentOffset;

        g.fillStyle = 'white';
        g.fillRect(0, 0, w, h);

        g.fillStyle = 'black';
        g.fillText(O.percent(y + 1, h), ofs, ofs);
      });
    }

    for(let x = 0; x !== w; x++){
      colAcc.fill(0);

      const xs = x * s;
      const ys = y * s;
      const x1 = max(xs - s + 1, 0);
      const y1 = max(ys - s + 1, 0);
      const x2 = min(xs + s - 1, ws - 1);
      const y2 = min(ys + s - 1, hs - 1);
      const n = (x2 - x1 + 1) * (y2 - y1 + 1);

      for(let yy = y1; yy <= y2; yy++){
        for(let xx = x1; xx <= x2; xx++){
          getCol(xx, yy);

          for(let i = 0; i !== 3; i++)
            colAcc[i] += col[i];
        }
      }

      for(let i = 0; i !== 3; i++)
        colAcc[i] = round(colAcc[i] / n);

      d.set(x, y, colAcc);
    }
  }

  d.put();
};

const newCol = () => {
  return new Uint8ClampedArray(3);
};

main();