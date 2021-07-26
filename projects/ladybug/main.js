'use strict';

const assert = require('assert');
const modal = require('../modal');
const Trajectory = require('./trajectory');
const Ball = require('./ball');
const Projectile = require('./projectile');
const Explosion = require('./explosion');
const ladybugPatternData = require('./ladybug-pattern.json');

if(1){
  // O.enhanceRNG();
  // O.randSeed(206759635);
  // O.randSeed(304804426);
  // O.randSeed(951814851);
  // O.randSeed(log(O.rand(1e9)));
}

const {project} = O;
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

const speedNormal = 1;
const speedSlow = .25;

const fwdSpeed = 7;
const bckSpeed = 75;
const endSpeed = 100;
const projSpeed = 20;
const explDur = .25;

const explsize = 2;
const initBallIndex = 1.5e3;
const fontFamily = 'arial';
const fontSize = 32;
const textOffset = 10;
const scoreboardSize = 10;

const ballCols = [
  [30, 131, 242],
  [90, 244, 38],
  [228, 247, 4],
  [255, 48, 33],
  [230, 104, 240],
  [53, 249, 239],
].map(a => O.Color.from(a).toString());

assert(ballCols.length === ballTypes);

await O.addStyle('style.css');

const bgImg = await new Promise((res, rej) => {
  const img = new Image();

  img.onload = () => res(img);
  img.onerror = rej;

  img.src = O.localPath('bg.png');
});

const bgCanvas = O.ce(O.body, 'canvas');
const bg = bgCanvas.getContext('2d');
bgCanvas.classList.add('bg');

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
const expls = new Set();

let speed = speedNormal;
let slow = 0;

const speedChanges = [O.now];

let points = 0;
let playerBall = null;
let gameOver = 0;

const scoreTable = [];

let newScoreboard = null;
let newScoreIndex = null;
let newScoreEntry = null;

const main = () => {
  initModalDiv();

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

const initModalDiv = () => {
  const {div} = modal;

  const table = O.ce(div, 'table');
  table.classList.add('scoreboard');
  table.cellSpacing = 0;

  const mkCell = (parent, str='', isHeader=0) => {
    const tag = isHeader ? 'th' : 'td';
    const cell = O.ce(parent, tag);
    cell.innerText = str;

    if(!isHeader)
      O.last(scoreTable).push(cell);

    return cell;
  };

  const mkCells = (parent, strs, isHeader=0) => {
    if(!isHeader)
      scoreTable.push([]);

    for(let i = 0; i !== strs.length; i++){
      const str = strs[i];
      const cell = mkCell(parent, str, isHeader);

      if(i === 1)
        cell.classList.add('name-cell');
    }
  };

  const thead = O.ce(table, 'thead');

  const tr = O.ce(thead, 'tr');
  mkCells(tr, ['#', 'Name', 'Points'], 1);

  // tr.children[1].classList.add('name-col');

  const tbody = O.ce(table, 'tbody');

  for(let i = 0; i !== scoreboardSize; i++){
    const tr = O.ce(tbody, 'tr');
    mkCells(tr, [i + 1, '', 0]);
  }
};

const createTrajectory = () => {
  const d = .01;

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

  /*const d = .01;
  const ps = [];

  let x = -diam;
  let y = -diam;
  let dx = O.randf(1, 2);
  let dy = O.randf(1, 2);

  const s = 1 / 200;
  const s1 = s / 100;

  for(let i = 0; i !== 2e6; i++){
    ps.push([x, y]);

    const dLen = O.hypot(dx, dy);
    dx /= dLen;
    dy /= dLen;

    x += dx * d;
    y += dy * d;

    if(x < w * .25) dx += s1;
    if(x > w * .75) dx -= s1;

    if(y < h * .25) dy += s1;
    if(y > h * .75) dy -= s1;

    dx += O.randf(-1, 1) * s;
    dy += O.randf(-1, 1) * s;
  }

  return new Trajectory(ps, rad);*/
};

const aels = () => {
  O.ael('keydown', onKeyDown);
  O.ael('mousemove', onMouseMove);
  O.ael('mousedown', onMouseDown);
  O.ael('contextmenu', onContextMenu);
  O.ael('resize', onResize);
};

const onKeyDown = evt => {
  const {ctrlKey, shiftKey, altKey, code} = evt;
  const flags = (ctrlKey << 2) | (shiftKey << 1) | altKey;

  if(flags === 0){
    if(gameOver){
      if(code === 'Escape' || code === 'Enter' || code === 'NumpadEnter'){
        modal.close();
        gameOver = 0;

        if(newScoreboard !== null){
          const name = newScoreEntry.innerText.trim().slice(0, 100);

          newScoreEntry.contentEditable = 'false';
          newScoreboard[newScoreIndex][0] = name;
          saveScoreboard(newScoreboard);

          newScoreboard = null;
          newScoreIndex = null;
          newScoreEntry = null;
        }

        restart();
      }

      return;
    }

    if(code === 'KeyR'){
      restart();
      return;
    }

    if(code === 'KeyS'){
      if(slow) speed = speedNormal;
      else speed = speedSlow;
      slow ^= 1;
      // speedChanges.push(O.now);
      return;
    }

    if(code === 'KeyL'){
      log(speedChanges.join('\n'));
      return;
    }

    return;
  }
};

const onMouseMove = evt => {
  if(gameOver) return;

  updateCur(evt);

  // if(evt.button === 0){
  //   projs.add(newProj());
  //   return;
  // }
};

const onMouseDown = evt => {
  if(gameOver) return;

  updateCur(evt);

  if(evt.button === 0){
    projs.add(newProj());
    return;
  }
};

const onContextMenu = evt => {
  O.pd(evt);
};

const onResize = evt => {
  iw = O.iw;
  ih = O.ih;
  iwh = iw / 2;
  ihh = ih / 2;
  scale = min(iw / w, ih / h);

  canvas.width = iw;
  canvas.height = ih;

  bgCanvas.width = iw;
  bgCanvas.height = ih;

  g.lineCap = 'round';
  g.lineJoin = 'bevel';

  g.textBaseline = 'top';
  g.textAlign = 'left';
  g.font = `${fontSize}px ${fontFamily}`;

  bg.lineCap = 'round';
  bg.lineJoin = 'bevel';

  bg.save();
  bg.translate(iwh, ihh);
  bg.scale(scale, scale);
  bg.translate(-wh, -hh);

  bg.clearRect(0, 0, w, h);
  bg.drawImage(bgImg, 0, 0);

  bg.beginPath();
  bg.rect(0, 0, w, h);
  bg.clip();

  bg.beginPath();

  for(const [x, y] of traj.ps)
    bg.lineTo(x, y);

  bg.lineWidth = diam * 1.3;
  bg.strokeStyle = 'black';
  bg.stroke();

  bg.lineWidth = diam * 1.25;
  bg.strokeStyle = '#eb9';
  bg.stroke();

  bg.restore();
};

const updateCur = evt => {
  cx = (evt.clientX - iwh) / scale + wh;
  cy = (evt.clientY - ihh) / scale + hh;
};

const frame = () => {
  const t = O.now / 1e3;

  const explode = bs => {
    for(const ball of bs){
      const {x, y, type} = ball;

      expls.add(new Explosion(type, x, y, t));
      points++;
    }
  };

  explsLoop: for(const expl of expls){
    if(t - expl.t > explDur / speed){
      expls.delete(expl);
      continue;
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
      if(!ball.isIn) continue;

      const bx = ball.x;
      const by = ball.y;

      if(O.dist(x, y, bx, by) > diam)
        continue;

      const {traj, index} = ball;
      const {ps} = traj;
      const index1 = min(index + 1, ps.length - 1);
      const [bx1, by1] = ps[index1];

      const x1 = bx1 - bx;
      const y1 = by1 - by;
      const x2 = bx - x;
      const y2 = by - y;

      const len1 = O.hypot(x1, y1);
      const len2 = O.hypot(x2, y2);
      const prod = x1 * x2 + y1 * y2;
      const cs = prod / (len1 * len2);
      const acute = cs > 0;

      const {iprev, inext} = ball;
      if(iprev === null || inext === null) continue;

      const j = acute ? i : i + 1;
      const indexNew = index + (acute ? iprev : inext) >> 1;
      const indexNew1 = indexNew !== null ? indexNew : 0;

      projs.delete(proj);
      balls.splice(j, 0, new Ball(traj, indexNew, type, 1));

      continue projsLoop;
    }

    proj.move(speed);
  }

  processBalls: {
    if(balls.length === 0){
      if(gameOver) break processBalls;
      balls.push(newBall(initBallIndex));
    }else{
      let ball = balls[0];

      ball.index += round((!gameOver ? fwdSpeed : endSpeed) * speed);

      for(let i = 0; i < balls.length; i++){
        const ball = balls[i];

        if(!ball.isIn){
          balls.length = i;
          endGame();
          break;
        }

        if(i !== 0 && ball.index < balls[i - 1].inext){
          ball.index = balls[i - 1].inext;
          break;
        }

        const {index, type} = ball;

        if(!gameOver && ball.marked){
          const bs = new Set([ball]);
          let n1 = 0;
          let n2 = 0;

          for(let j = i - 1; j !== -1; j--){
            const b = balls[j];

            if(!b.collides(balls[j + 1])) break;
            if(b.type !== type) break;

            bs.add(b);
            n1++;
          }

          for(let j = i + 1; j !== balls.length; j++){
            const b = balls[j];

            if(!b.collides(balls[j - 1])) break;
            if(b.type !== type) break;

            bs.add(b);
            n2++;
          }

          const n = bs.size;

          if(n >= 3 && (!ball.markedRight || n2 !== 0)){
            explode(bs);
            balls.splice(i - n1, n);
            i -= n1// + 1;

            continue;
          }

          ball.marked = 0;
          ball.markedRight = 0;
        }

        if(i === balls.length - 1)
          break;

        const next = balls[i + 1];

        if(!next.isIn){
          balls.length = i + 1;
          continue;
        }

        if(ball.collides(next)){
          next.index = ball.inext;
          continue;
        }

        if(next.type !== type)
          continue;

        let n = 1;

        for(let j = i + 2; j !== balls.length; j++){
          const b = balls[j];
          if(!b.collides(balls[j - 1])) break;
          n++;
        }

        next.index = round(max(ball.inext, next.index - bckSpeed * speed));
        ball.marked = 1;
        ball.markedRight = 1;

        for(let j = 1; j !== n; j++)
          balls[i + j + 1].index = balls[i + j].inext;
      }


      if(gameOver)
        break processBalls;

      while(ball.iprev !== null){
        ball = newBall(ball.iprev);
        balls.unshift(ball);
      }
    }
  }

  render(t);
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

const render = t => {
  const {ps, adjs} = traj;

  const scaleCtx = s => {
    g.scale(s, s);
  };

  const drawCirc = (x, y, rad) => {
    g.arc(x, y, rad, 0, pi2);
  };

  g.save();

  g.fillStyle = 'darkgray';
  g.fillRect(0, 0, iw, ih);

  g.translate(iwh, ihh);
  scaleCtx(scale);
  g.translate(-wh, -hh);

  g.clearRect(0, 0, w, h);

  g.beginPath();
  g.rect(0, 0, w, h);
  g.clip();

  g.lineWidth = 1 / scale;

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

  // g.globalCompositeOperation = 'xor';

  for(const expl of expls){
    const {x, y, type} = expl;

    const k2 = (t - expl.t) / (explDur / speed);
    const k1 = 1 - k2;

    const alpha = k1;
    const r = rad * (k1 + explsize * k2);

    g.globalAlpha = alpha;
    g.fillStyle = ballCols[type];
    g.beginPath();
    drawCirc(x, y, r);
    g.fill();
    g.stroke();
  }

  // g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 1;

  for(const proj of projs){
    const {x, y, type} = proj;

    g.fillStyle = ballCols[type];
    g.beginPath();
    drawCirc(x, y, rad);
    g.fill();
    g.stroke();
  }

  g.fillStyle = 'black';
  g.fillText(`Points: ${points}`, textOffset, textOffset);

  g.restore();
};

const endGame = () => {
  if(gameOver) return;

  gameOver = 1;
  modal.open();

  const scoreboard = loadScoreboard();

  const index = O.bisect(i => {
    if(i >= scoreboardSize) return 1;
    return points > scoreboard[i][1];
  });

  const updateScoreTable = () => {
    for(let i = 0; i !== scoreboardSize; i++){
      const [name, points] = scoreboard[i];
      const row = scoreTable[i];

      row[1].innerText = name;
      row[2].innerText = points;
    }
  };

  if(index === scoreboardSize)
    return updateScoreTable();

  scoreboard.splice(index, 0, ['', points]);
  scoreboard.length = scoreboardSize;

  const row = scoreTable[index];
  const cell = row[1];

  cell.contentEditable = 'true';
  cell.focus();

  newScoreboard = scoreboard;
  newScoreIndex = index;
  newScoreEntry = cell;

  updateScoreTable();
};

const restart = () => {
  balls.length = 0;
  projs.clear();
  expls.clear();

  points = 0;
  newPlayerBall();
};

const initScoreboard = () => {
  return O.ca(scoreboardSize, () => ['', 0]);
};

const loadScoreboard = () => {
  if(!O.has(localStorage, project)){
    const scoreboard = initScoreboard();
    saveScoreboard(scoreboard);

    return scoreboard;
  }

  return JSON.parse(localStorage[project]);
};

const saveScoreboard = scoreboard => {
  localStorage[project] = JSON.stringify(scoreboard);
};

main();