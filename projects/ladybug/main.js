'use strict';

const assert = require('assert');
const Ball = require('./ball');
const ladybugPatternData = require('./ladybug-pattern.json');

const {pi, pih, pi2} = O;

const {
  abs,
  min, max,
  floor, ceil, round,
  sin, cos, atan2,
} = Math;

const w = 1920;
const h = 1080;

const wh = w / 2;
const hh = h / 2;

const rad = 30;
const diam = rad * 2;
const playerRad = 100;

const {g} = O.ceCanvas();
const {canvas} = g;

let iw, ih;
let iwh, ihh;
let scale;

let cx = wh;
let cy = hh;

let trajectory;
let trajAdjs;

let playerX;
let playerY;
let ladybugPattern;

const chains = [];

const main = () => {
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

  playerX = wh;
  playerY = h * .8;

  /*const ladybugPatternSize = O.rand(10, 20);
  ladybugPattern = [];

  for(let i = 0; i !== ladybugPatternSize; i++){
    const x = O.randf(-1, -.2);
    const y = O.randf(-.1, 1);
    const r = O.randf(.1, .2);

    const overlaps = ladybugPattern.some(([x1, y1, r1]) => {
      return O.dist(x, y, x1, y1) < (r + r1) * 2;
    });

    if(overlaps) continue;

    ladybugPattern.push([x, y, r]);
  }*/

  ladybugPattern = ladybugPatternData;

  aels();
  onResize();

  frame();
};

const createTrajectory = () => {
  const ps = [];

  for(let x = -diam; x < w + diam; x += .05){
    const y = hh + sin(x / w * pi2 * 3.5) * hh / 5;

    ps.push([x, y]);
  }

  return ps;
};

const aels = () => {
  O.ael('mousemove', onMouseMove);
  O.ael('resize', onResize);
};

const onMouseMove = evt => {
  cx = (evt.clientX - iwh) / scale + wh;
  cy = (evt.clientY - ihh) / scale + hh;
};

const onResize = evt => {
  iw = O.iw;
  ih = O.ih;
  iwh = iw / 2;
  ihh = ih / 2;
  scale = min(iw / w, ih / h);

  canvas.width = iw;
  canvas.height = ih;

  g.lineCap = 'round';
  g.lineJoin = 'bevel';
};

const frame = () => {
  render();
  O.raf(frame);
};

const render = () => {
  const scaleCtx = s => {
    g.scale(s, s);
  };

  const drawCirc = (x, y, rad) => {
    g.arc(x, y, rad, 0, pi2);
  };

  g.fillStyle = 'white';
  g.fillRect(0, 0, iw, ih);

  g.translate(iwh, ihh);
  scaleCtx(scale);
  g.translate(-wh, -hh);

  g.beginPath();
  g.rect(0, 0, w, h);
  g.fill();
  g.stroke();
  g.clip();

  g.lineWidth = diam * 1.25;
  g.strokeStyle = '#08f';
  g.beginPath();
  for(let i = 0;;){
    const [x, y] = trajectory[i];
    g.lineTo(x, y);

    const j = trajAdjs[i][1];
    if(j === null) break;

    i = ceil((i + j) / 2);
  }
  g.stroke();
  g.lineWidth = 1 / scale;
  g.strokeStyle = 'black';

  for(const chain of chains){
    let ball = chain;

    while(ball !== null){
      const {x, y} = vall;

      g.beginPath();
      drawCirc(x, y, rad);
      g.stroke();

      ball = ball.next;
    }
  }

  const dir = atan2(cy - playerY, cx - playerX);

  g.lineWidth = 1 / (playerRad * scale);
  g.save();
  g.translate(playerX, playerY);
  scaleCtx(playerRad);
  g.rotate(dir + pih);

  g.fillStyle = 'white';
  g.beginPath();
  drawCirc(0, 0, 1);
  g.fill();
  g.stroke();
  g.clip();

  g.fillStyle = 'black';
  g.beginPath();
  drawCirc(-.33, -.5, .1);
  g.stroke();
  g.beginPath();
  drawCirc(-.33, -.55, .05);
  g.fill();

  g.beginPath();
  drawCirc(.33, -.5, .1);
  g.stroke();
  g.beginPath();
  drawCirc(.33, -.55, .05);
  g.fill();

  g.fillStyle = 'rgb(226,22,6)';
  g.beginPath();
  g.rect(-1, -.1, 2, 1.5);
  g.fill();
  g.stroke();
  g.clip();

  g.beginPath();
  g.moveTo(0, -.1);
  g.lineTo(0, 2);
  g.stroke();

  g.fillStyle = 'black';
  for(const [x, y, r] of ladybugPattern){
    g.beginPath();
    drawCirc(x, y, r);
    g.fill();

    g.beginPath();
    drawCirc(-x, y, r);
    g.fill();
  }

  g.restore();
  g.lineWidth = 1 / scale;

  g.resetTransform();
};

main();