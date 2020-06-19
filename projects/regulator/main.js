'use strict';

const {pi2} = O;

const {g, w, h, wh, hh, w1, h1} = O.ceCanvas();

const radius = 30;
const yMin = radius;
const yMax = h1 - radius;

const fanMin = 0;
const fanMax = 2;

const gAcc = -.01;

const kp = .00008;
const ti = .001;
const td = .005;

const cols = {
  bg: '#fff',
  ball: '#0f0',
};

let ref = hh;
let y = 0;
let v = 0;
let fan = 0;

let ePrev = 0;
let ee = 0;

const main = () => {
  render();
};

const update = () => {
  y += v;

  if(y < yMin){
    y = yMin;
    v = 0;
  }else if(y > yMax){
    y = yMax;
    v = 0;
  }

  v += gAcc + fan;
};

const pid = y => {
  const e = ref - y;
  const de = e - ePrev;

  ee += e;
  fan = kp * (e + ee * ti + de * td);

  if(fan < fanMin){
    fan = fanMin;
    ee -= e;
  }else if(fan > fanMax){
    fan = fanMax;
    ee -= e;
  }
};

const render = () => {
  const yPrev = y;
  update();
  pid(yPrev);

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