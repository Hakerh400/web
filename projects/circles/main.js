'use strict';

const {pi2} = O;

const radius = 60;

const {g} = O.ceCanvas();
const {canvas} = g;

let iw, ih, iwh, ihh;
let cx, cy;

const main = () => {
  O.ael('resize', onResize);
  onResize();

  cx = iwh;
  cy = ihh;

  O.ael('mousemove', evt => {
    cx = evt.clientX;
    cy = evt.clientY;
  });

  render();
};

const onResize = evt => {
  ({iw, ih} = O);

  iwh = iw / 2;
  ihh = ih / 2;

  canvas.width = iw;
  canvas.height = ih;

  g.globalCompositeOperation = 'lighten';
  g.lineWidth = 5;
};

const render = () => {
  // g.clearRect(0, 0, iw, ih);

  g.fillStyle = '#f00';
  g.beginPath();
  g.arc(iw * .25, ih * .25, radius, 0, pi2);
  g.fill();
  // g.stroke();

  g.fillStyle = '#0f0';
  g.beginPath();
  g.arc(iw * .75, ih * .25, radius, 0, pi2);
  g.fill();
  // g.stroke();

  g.fillStyle = '#0ff';
  g.beginPath();
  g.arc(iw * .25, ih * .75, radius, 0, pi2);
  g.fill();
  // g.stroke();

  g.fillStyle = '#00f';
  g.beginPath();
  g.arc(iw * .75, ih * .75, radius, 0, pi2);
  g.fill();
  // g.stroke();

  g.fillStyle = '#ff0';
  g.beginPath();
  g.arc(iw * .5, ih * .5, radius, 0, pi2);
  g.fill();
  // g.stroke();

  const dists = [
    [iw * .25, ih * .25],
    [iw * .75, ih * .25],
    [iw * .25, ih * .75],
    [iw * .75, ih * .75],
    [iw * .5, ih * .5],
  ].map(([x, y]) => 1 / (1 + O.dists(cx, cy, x, y) ** 2));

  const distsTotal = dists.reduce((a, b) => a + b, 0);
  const facs = dists.map(a => a / distsTotal);

  const red = (facs[0] + facs[4]) * 255;
  const green = (facs[1] + facs[2] + facs[4]) * 255;
  const blue = (facs[2] + facs[3]) * 255;

  g.fillStyle = new O.Color(red, green, blue);
  g.beginPath();
  g.arc(cx, cy, radius, 0, pi2);
  g.fill();
  // g.stroke();

  O.raf(render);
};

main();