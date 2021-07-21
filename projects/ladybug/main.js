'use strict';

const assert = require('assert');

const {pi, pih, pi2} = O;

const {
  abs,
  min, max,
  floor, ceil, round,
  sin, cos, atan2,
} = Math;

const rad = 30;
const diam = rad * 2;

const {g} = O.ceCanvas();

let w, h;
let wh, hh;

let trajectory;
let trajAdjs;

const main = () => {
  onResize();

  trajectory = createTrajectory();

  trajAdjs = trajectory.map(([x, y], i) => {
    const trajLen = trajectory.length;

    const isIn = i => {
      return i >= 0 && i < trajLen;
    };

    const calc = dir => {
      const n = O.bisect(n => {
        const j = dir === 0 ? i - n : i + n;

        if(j === i) return 0;
        if(!isIn(j)) return 1;

        const [x1, y1] = trajectory[j];
        return O.dist(x, y, x1, y1) > diam;
      });

      const j = dir === 0 ? i - n : i + n;

      if(!isIn(j)) return null;
      return j;
    };

    const prev = calc(0);
    const next = calc(1);

    return [prev, next];
  });

  aels();
  render();
};

let z = 0;
const render = () => {
  g.fillStyle = 'white';
  g.fillRect(0, 0, w, h);

  g.beginPath();
  for(const [x, y] of trajectory)
    g.lineTo(x, y);
  g.stroke();

  let i = z;
  z=(z+10)%trajectory.length;
  while(i !== null){
    const [x, y] = trajectory[i];

    g.beginPath();
    g.arc(x, y, rad, 0, pi2);
    g.stroke();

    i = trajAdjs[i][1];
  }

  O.raf(render);
};

const createTrajectory = () => {
  const ps = [];

  for(let x = -diam; x < w + diam; x += .05){
    const y = hh - sin(x / w * pi2 * 3) * hh / 2;

    ps.push([x, y]);
  }

  return ps;
};

const aels = () => {
  O.ael('resize', onResize);
};

const onResize = evt => {
  w = O.iw;
  h = O.ih;
  wh = w / 2;
  hh = h / 2;
};

main();