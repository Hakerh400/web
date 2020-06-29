'use strict';

const Grid = require('./grid');
const Tile = require('./tile');
const Transition = require('./transition');

const {min, max, abs, floor, sin, cos} = Math;
const {pi, pih, pi2} = O;

const pi3 = pi / 3;
const pi6 = pi / 6;
const pi11 = pi * 1.1;

const TRANSITION_DURATION = 200;

const gemsNum = 6;

const cols = formatCols({
  bg:   [169, 169, 169],
  tile: [255, 255, 255],

  gems: [
    [30, 131, 242],
    [90, 244, 38],
    [228, 247, 4],
    [255, 48, 33],
    [230, 104, 240],
    [53, 249, 239],
  ],
});

const gemCols = cols.gems;

const tileSize = O.urlParam('s', 60) | 0;

const {g} = O.ceCanvas(1);

const grid = createGrid();

let cx = -1;
let cy = -1;

function main(){
  aels();
  render();
};

function aels(){
  let clicked = 0;
  let dragged = 0;
  let mx, my;

  O.ael('mousedown', evt => {
    updateCursor(evt);
    clicked = 1;
    mx = cx;
    my = cy;
  });

  O.ael('mousemove', evt => {
    updateCursor(evt);

    drag: if(clicked && !dragged && !(cx === mx && cy === my)){
      dragged = 1;

      const d = grid.get(mx, my);
      if(d === null) break drag;
      if(d.transitions.length !== 0) break drag;

      const dx = cx - mx;
      const dy = cy - my;

      const dir = abs(dx) > abs(dy) ?
        cx > mx ? 1 : 3 :
        cy > my ? 2 : 0;

      const d1 = grid.nav({x: mx, y: my}, dir);
      if(d1 === null) break drag;
      if(d1.gem === null) break drag;

      const t1 = O.now;
      const t2 = t1 + TRANSITION_DURATION;

      if(d1.gem === null || d1.transitions.length !== 0){
        const t3 = t2 + TRANSITION_DURATION;

        d.createTransition(d, d1, t1, t2);
        d.createTransition(d1, d, t2, t3);

        break drag;
      }

      const gem = d.gem;
      d.gem = d1.gem;
      d1.gem = gem;

      d.createTransition(d1, d, t1, t2);
      d1.createTransition(d, d1, t1, t2);
    }
  });

  O.ael('mouseup', evt => {
    updateCursor(evt);
    clicked = 0;
    dragged = 0;
  });

  O.ael('resize', evt => {
    g.resize(O.iw, O.ih);
  });

  O.ael('blur', evt => {
    g.resize(O.iw, O.ih);
    clicked = 0;
    dragged = 0;
  });
};

function createGrid(){
  const w = 9;
  const h = 9;

  const grid = new Grid(w, h, (x, y, d) => {
    d.gem = O.rand(gemsNum);
  });

  return grid;
};

function render(){
  const {w, h} = grid;
  const t = O.now;

  g.clearCanvas(cols.bg);

  g.resetTransform();
  g.translate((g.w - w * tileSize) / 2, (g.h - h * tileSize) / 2);
  g.scale(tileSize);

  grid.iter((x, y, d) => {
    g.save();
    g.translate(x + .5, y + .5);

    g.fillStyle = cols.tile;
    g.fillRect(-.5, -.5, 1, 1);

    if(d.transitions.length === 0)
      drawGem(d);

    g.strokeRect(-.5, -.5, 1, 1);

    g.restore();
  });

  for(const transition of grid.transitions){
    const {tile: d, from, to, start, duration} = transition;

    const k = min((t - start) / duration, 1);
    const k1 = 1 - k;

    const x = from.x * k1 + to.x * k;
    const y = from.y * k1 + to.y * k;

    g.save();
    g.translate(x + .5, y + .5);

    drawGem(d);

    g.restore();

    if(k === 1)
      transition.remove();
  }

  O.raf(render);
};

const drawGem = d => {
  const {gem} = d;

  g.fillStyle = cols.gems[gem];

  switch(gem){
    case 0: {
      g.beginPath();
      g.moveTo(.5 - .5, .14 - .5);
      g.lineTo(.7 - .5, .38 - .5);
      g.lineTo(.5 - .5, .86 - .5);
      g.lineTo(.3 - .5, .38 - .5);
      g.closePath();
      g.stroke();
      g.fill();

      g.beginPath();
      g.moveTo(.5 - .5, .14 - .5);
      g.lineTo(.38 - .5, .44 - .5);
      g.lineTo(.5 - .5, .86 - .5);
      g.moveTo(.5 - .5, .14 - .5);
      g.lineTo(.62 - .5, .44 - .5);
      g.lineTo(.5 - .5, .86 - .5);
      g.moveTo(.3 - .5, .38 - .5);
      g.lineTo(.38 - .5, .44 - .5);
      g.lineTo(.62 - .5, .44 - .5);
      g.lineTo(.7 - .5, .38 - .5);
      g.stroke();
    } break;

    case 1: {
      g.beginPath();
      O.drawPolygon(g, 0, 0, .375, 6, pih);
      g.fill();
      g.stroke();
      g.beginPath();
      O.drawPolygon(g, 0, 0, .375, 3, pih);
      g.stroke();
    } break;

    case 2: {
      g.beginPath();
      g.moveTo(.5 - .5, .15 - .5);
      g.lineTo(.2 - .5, .7 - .5);
      g.lineTo(.6 - .5, .8 - .5);
      g.lineTo(.8 - .5, .6 - .5);
      g.closePath();
      g.fill();
      g.stroke();
      g.beginPath();
      g.moveTo(.5 - .5, .15 - .5);
      g.lineTo(.6 - .5, .8 - .5);
      g.stroke();
    } break;

    case 3: {
      g.beginPath();
      for(let i = 0; i !== 6; i++){
        const angle = pih + i / 6 * pi2;
        g.lineTo(cos(angle) * .375, sin(angle) * .375);
      }
      g.closePath();
      g.fill();
      g.stroke();
      for(let i = 0; i !== 6; i += 2){
        const angle = pih + i / 6 * pi2;
        g.moveTo(cos(angle) * .375, sin(angle) * .375);
        g.lineTo(0, 0);
      }
      g.stroke();
    } break;

    case 4: {
      g.beginPath();
      g.arc(0, 0, .3, 0, pi2);
      g.fill();
      g.stroke();
    } break;

    case 5: {
      g.beginPath();
      O.drawPolygon(g, 0, 0, .375, 5, pi11);
      g.closePath();
      g.fill();
      g.stroke();
    } break;

    default: {
      O.assert.fail(gem);
    } break;
  }
};

const updateCursor = evt => {
  const {w, h} = grid;

  cx = floor((evt.clientX - (g.w - w * tileSize) / 2) / tileSize);
  cy = floor((evt.clientY - (g.h - h * tileSize) / 2) / tileSize);
};

function formatCols(cols){
  const colsObj = O.obj();

  for(const colName in cols){
    const col = cols[colName];

    colsObj[colName] = col.length === 3 && !Array.isArray(col[0]) ? `#${
      cols[colName].
        map(a => O.hex(a, 1).toLowerCase()).
        join('')
      }` : formatCols(col);
  }

  return colsObj;
};

main();