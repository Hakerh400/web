'use strict';

const {pi2} = O;

const radius = 30;

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
  g.clearRect(0, 0, iw, ih);

  g.fillStyle = '#f00';
  g.beginPath();
  g.arc(iw * .25, ih * .25, radius, 0, pi2);
  g.fill();
  g.stroke();

  g.fillStyle = '#0f0';
  g.beginPath();
  g.arc(iw * .75, ih * .25, radius, 0, pi2);
  g.fill();
  g.stroke();

  g.fillStyle = '#0ff';
  g.beginPath();
  g.arc(iw * .25, ih * .75, radius, 0, pi2);
  g.fill();
  g.stroke();

  g.fillStyle = '#00f';
  g.beginPath();
  g.arc(iw * .75, ih * .75, radius, 0, pi2);
  g.fill();
  g.stroke();

  g.fillStyle = '#ff0';
  g.beginPath();
  g.arc(iw * .5, ih * .5, radius, 0, pi2);
  g.fill();
  g.stroke();

  g.fillStyle = '#ff0';
  g.beginPath();
  g.arc(cx, cy, radius, 0, pi2);
  g.fill();
  g.stroke();

  O.raf(render);
};

main();