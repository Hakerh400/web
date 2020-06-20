'use strict';

const {pi2} = O;

const {g, w, h, wh, hh, w1, h1} = O.ceCanvas();

const radius = 30;
const yMin = radius;
const yMax = h1 - radius;

const ref = hh;

const fanMin = 0;
const fanMax = 2;

const gAcc = 1;

const cols = {
  bg: '#fff',
  ball: '#0f0',
};

const main = () => {
  render();
};

let y = 0;
let v = 0;
let fan = 0;

const update = () => {
  y += v;

  if(y < yMin){
    y = yMin;
    v = 0;
  }else if(y > yMax){
    y = yMax;
    v = 0;
  }

  v += -gAcc + fan;
};

let yPrev = 0;

const regulate = y => {
  const v = y - yPrev;
  yPrev = y;

  const e = ref - y;
  fan = O.bound(e * .1 - v, fanMin, fanMax);
};

const render = () => {
  const yPrev = y;
  
  update();
  regulate(yPrev);

  g.fillStyle = cols.bg;
  g.fillRect(0, 0, w, h);

  g.fillStyle = cols.ball;
  g.beginPath();
  g.arc(wh, h1 - y, radius, 0, pi2)
  g.fill();
  g.stroke();

  O.raf(render);
};

main();