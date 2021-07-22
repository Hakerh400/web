'use strict';

const assert = require('assert');

const {pi, pih, pi2} = O;

const {
  abs, sign,
  min, max,
  floor, ceil, round,
  sin, cos, atan2, acos,
} = Math;

const {g} = O.ceCanvas();
const {canvas} = g

let w = O.iw;
let h = O.ih;
let wh = w / 2;
let hh = h / 2;

let cx = wh;
let cy = hh;

const main = () => {
  aels();
  onResize();

  render();
};

const aels = () => {
  O.ael('mousemove', onMouseMove);
  O.ael('resize', onResize);
};

const onMouseMove = evt => {
  cx = evt.clientX;
  cy = evt.clientY;
};

const onResize = () => {
  w = O.iw;
  h = O.ih;
  wh = w / 2;
  hh = h / 2;

  canvas.width = w;
  canvas.height = h;

  g.textBaseline = 'top';
  g.textAlign = 'left';
  g.font = '32px arial';
};

const render = () => {
  g.fillStyle = 'white';
  g.fillRect(0, 0, w, h);

  const t = O.now / 10e3;

  const dir1 = t % pi2;
  const dir2 = atan2(cy - hh, cx - wh);

  const s = min(w, h);
  const rad = s * .4;

  const ax1 = wh;
  const ay1 = hh;
  const ax2 = wh + cos(dir1) * rad;
  const ay2 = hh + sin(dir1) * rad;

  const bx1 = wh;
  const by1 = hh;
  const bx2 = wh + cos(dir2) * rad;
  const by2 = hh + sin(dir2) * rad;

  const ax = ax2 - ax1;
  const ay = ay2 - ay1;
  const bx = bx2 - bx1;
  const by = by2 - by1;

  const len1 = O.hypot(ax, ay);
  const len2 = O.hypot(bx, by);
  const prod = ax * bx + ay * by;
  const cs = prod / (len1 * len2);

  const acute = cs > 0;

  g.fillStyle = 'black';
  g.fillText(acute ? 'Acute' : 'Obtuse', 10, 10);

  const sgn = sign(ax * by - ay * bx);
  const dir = sgn !== 0 ? acos(cs) * sgn :
    ax === bx && ay === by ? 0 : pi;

  g.fillStyle = 'black';
  g.fillText(round(abs(dir / pi * 180)), 10, 42);

  g.beginPath();
  g.moveTo(ax2, ay2);
  g.lineTo(ax1, ay1);
  g.lineTo(bx2, by2);
  g.stroke();

  g.save();
  O.drawArc(g, ax2, ay2, bx2, by2, sgn);
  g.clip();

  g.beginPath();
  g.arc(wh, hh, s * .1, 0, pi2);
  g.stroke();
  g.restore();

  O.raf(render);
};

main();