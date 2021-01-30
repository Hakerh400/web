'use strict';

const {sin, cos} = Math;

const {g, w, h, wh, hh} = O.ceCanvas();

const ITERATIONS = 6;

const xOffset = (w - h) / 2;

let k = null;

const main = () => {
  render();
};

const func = arg => {
  g.fillStyle = '#4f8';
  g.beginPath();
  g.rotate(k * O.pi2)
  const s = .5 + k / 2;
  const sh = s / 2;
  g.rect(-sh, -sh, s, s);
  g.fill();
  g.stroke();
};

const render = () => {
  k = (sin(O.now / 5e3) + 1) / 2;

  g.fillStyle = '#fff';
  g.fillRect(0, 0, w, h);

  for(let i = 0; i !== ITERATIONS; i++){
    const n = 2 ** i;
    const d = h / n;
    const s = hh / n;

    for(let y = 0; y !== n; y++){
      for(let x = 0; x !== n; x++){
        g.translate(xOffset + d * (x + .5), d * (y + .5));
        g.scale(s, s);
        g.lineWidth = 1 / s;
        func();
        g.resetTransform();
      }
    }
  }

  O.raf(render);
};

main();