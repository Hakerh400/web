'use strict';

const assert = require('assert');

const {abs, min, max, sin, cos, atan2} = Math;

const {g} = O.ceCanvas();

const iterations = 10;
const offset = 100;

const offset2 = offset * 2;

let w = O.iw;
let h = O.ih;

const main = () => {
  aels();
  O.raf(render);
};

const aels = () => {
  O.ael('resize', onResize);
};

const onResize = evt => {
  const {canvas} = g;

  w = O.iw;
  h = O.ih;

  canvas.width = w;
  canvas.height = h;
};

const render = () => {
  const t = O.now / 10e3;
  const k = abs(t % 2 - 1);
  const pat = [.5, -k];

  drawFractal(pat);

  O.raf(render);
};

const drawFractal = pat => {
  const wh = w / 2;
  const hh = h / 2;
  
  const w1 = w - offset2;
  const h1 = h - offset2;

  const ps = iterate(pat);
  const psNum = ps.length;

  assert(psNum !== 0);

  let xMin = O.N;
  let yMin = O.N;
  let xMax = -O.N;
  let yMax = -O.N;

  for(let i = 0; i !== psNum; i += 2){
    const x = ps[i];
    const y = ps[i + 1];

    xMin = min(xMin, x);
    yMin = min(yMin, y);
    xMax = max(xMax, x);
    yMax = max(yMax, y);
  }

  if(xMin === xMax){
    xMin -= .5;
    xMax += .5;
  }

  if(yMin === yMax){
    yMin -= .5;
    yMax += .5;
  }

  const width = xMax - xMin;
  const height = yMax - yMin;
  const s = min(w1 / width, h1 / height);

  g.fillStyle = 'white';
  g.fillRect(0, 0, w, h);

  g.lineWidth = 1 / s;

  g.translate(wh, hh);
  g.scale(s, s);
  g.translate(-xMin - width / 2, -yMin - height / 2);

  g.beginPath();

  for(let i = 0; i !== psNum; i += 2){
    const x = ps[i];
    const y = ps[i + 1];

    g.lineTo(x, y);
  }

  g.stroke();

  g.resetTransform();
  g.lineWidth = 1;
};

const iterate = pat => {
  const patSize = pat.length;
  let ps = [0, 0, 1, 0];

  for(let iter = 0; iter !== iterations; iter++){
    const psNum = ps.length;
    const psNum2 = ps.length - 2;

    const psNew = [];

    for(let i = 0; i !== psNum2; i += 2){
      const x1 = ps[i];
      const y1 = ps[i + 1];
      const x2 = ps[i + 2];
      const y2 = ps[i + 3];

      const len = O.dist(x1, y1, x2, y2);
      const angle = atan2(y2 - y1, x2 - x1);
      const rcos = cos(angle);
      const rsin = sin(angle);

      psNew.push(x1, y1);

      for(let j = 0; j !== patSize; j += 2){
        const xx = pat[j] * len;
        const yy = pat[j + 1] * len;

        const x = xx * rcos - yy * rsin;
        const y = yy * rcos + xx * rsin;

        psNew.push(x1 + x, y1 + y);
      }
    }

    psNew.push(ps[psNum - 2], ps[psNum - 1]);

    ps = psNew;
  }

  return ps;
};

main();