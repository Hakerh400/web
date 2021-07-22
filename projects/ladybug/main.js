'use strict';

const assert = require('assert');
const Trajectory = require('./trajectory');
const Ball = require('./ball');
const Projectile = require('./projectile');
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
const ballTypes = 6;
const ballSpeed = 100;
const projSpeed = 20;

const ballCols = [
  [30, 131, 242],
  [90, 244, 38],
  [228, 247, 4],
  [255, 48, 33],
  [230, 104, 240],
  [53, 249, 239],
].map(a => O.Color.from(a).toString());

assert(ballCols.length === ballTypes);

const {g} = O.ceCanvas();
const {canvas} = g;

let iw, ih;
let iwh, ihh;
let scale;

let cx = wh;
let cy = hh;

let traj;

let playerX;
let playerY;
let ladybugPattern;

const balls = [];
const projs = new Set();

let playerBall = null;

const main = () => {
  traj = createTrajectory();

  playerX = wh + w * .05;
  playerY = hh;

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

  newPlayerBall();

  aels();
  onResize();

  frame();
};

const createTrajectory = () => {
  const d = .05;

  const ps = [];
  let x1, y1;

  const xx = w * .05;

  x1 = w * .925;

  for(let x = -diam; x < x1; x += d){
    const y = h * .2 + sin((x - xx) / w * pi2 * 3.5) * hh / 5;
    y1 = y;

    ps.push([x, y]);
  }

  for(let y = y1; y < h - y1; y += d)
    ps.push([x1, y]);

  for(let x = x1; x > -diam; x -= d){
    const y = h * .8 - sin((x - xx) / w * pi2 * 3.5) * hh / 5;

    ps.push([x, y]);
  }

  return new Trajectory(ps, rad);
};

const aels = () => {
  O.ael('mousemove', onMouseMove);
  O.ael('mousedown', onMouseDown);
  O.ael('resize', onResize);
};

const onMouseMove = evt => {
  updateCur(evt);
};

const onMouseDown = evt => {
  updateCur(evt);

  if(evt.button === 0){
    projs.add(newProj());
    return;
  }
};

const updateCur = evt => {
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
  if(balls.length === 0){
    balls.push(newBall(0));
  }else{
    let ball = balls[0];

    ball.index += ballSpeed;

    for(let i = 0; i !== balls.length; i++){
      const ball = balls[i];

      if(!ball.isIn){
        balls.length = i;
        break;
      }

      if(i === balls.length - 1)
        break;

      const next = balls[i + 1];
      if(!next.collides(ball)) break;

      next.index = ball.inext;
    }

    while(ball.iprev !== null){
      ball = newBall(ball.iprev);
      balls.unshift(ball);
    }
  }

  projsLoop: for(const proj of projs){
    const {x, y, type} = proj;

    if(!inView(x, y)){
      projs.delete(proj);
      continue;
    }

    for(let i = 0; i !== balls.length; i++){
      const ball = balls[i];

      const bx = ball.x;
      const by = ball.y;

      if(O.dist(x, y, bx, by) > diam)
        continue;

      
    }

    proj.move();
  }

  render();
  O.raf(frame);
};

const inView = (x, y) => {
  if(x < 0 || y >= w) return 0;
  if(y < 0 || y >= h) return 0;

  return 1;
};

const newBall = index => {
  const type = randBallType();
  return new Ball(traj, index, type);
};

const newPlayerBall = () => {
  playerBall = randBallType();
};

const newProj = () => {
  const type = playerBall;
  const dir = getPlayerDir();

  const dir1 = dir;
  const x = playerX + cos(dir1) * playerRad;
  const y = playerY + sin(dir1) * playerRad;

  newPlayerBall();

  return new Projectile(type, x, y, dir, projSpeed);
};

const randBallType = () => {
  return O.rand(ballTypes);
};

const getPlayerDir = () => {
  return atan2(cy - playerY, cx - playerX);
};

const render = () => {
  const {ps, adjs} = traj;

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
  g.strokeStyle = '#aaa';
  g.beginPath();
  for(let i = 0;;){
    const [x, y] = ps[i];
    g.lineTo(x, y);

    const j = adjs[i][1];
    if(j === null) break;

    i = ceil((i + j) / 2);
  }
  g.stroke();
  g.lineWidth = 1 / scale;
  g.strokeStyle = 'black';

  for(const ball of balls){
    const {x, y, type} = ball;

    g.fillStyle = ballCols[type];
    g.beginPath();
    drawCirc(x, y, rad);
    g.fill();
    g.stroke();
  }

  const dir = getPlayerDir();

  g.save();
  g.translate(playerX, playerY);
  g.rotate(dir + pih);

  g.fillStyle = ballCols[playerBall];
  g.beginPath();
  drawCirc(0, -playerRad, rad);
  g.fill();
  g.stroke();

  g.lineWidth = 1 / (playerRad * scale);
  scaleCtx(playerRad);

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

  for(const proj of projs){
    const {x, y, type} = proj;

    g.fillStyle = ballCols[type];
    g.beginPath();
    drawCirc(x, y, rad);
    g.fill();
    g.stroke();
  }

  g.resetTransform();
};

main();