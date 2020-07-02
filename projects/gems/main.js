'use strict';

const Grid = require('./grid');
const Tile = require('./tile');
const Transition = require('./transition');

const {min, max, abs, floor, sin, cos} = Math;
const {pi, pih, pi2} = O;

const pi3 = pi / 3;
const pi6 = pi / 6;
const pi11 = pi * 1.1;

const FPS = 60;
const TIME_STEP = 1e3 / FPS;
const TRANSITION_DURATION = 200;

const tileSize = O.urlParam('s', 60) | 0;

const gemsNum = 6;
const bgsNum = 3;

const cols = formatCols({
  bg:   [169, 169, 169],

  tileBgs: [
    [64, 64, 64],
    [128, 128, 128],
    [255, 255, 255],
  ],

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

const trTypes = O.enum([
  'MOVE_TRY',
  'MOVE_ILLEGAL',
  'MOVE_FAIL',
  'NEW',
  'FALL',
  'DESTROY_GEM',
]);

const {g} = O.ceCanvas(1);

const grid = createGrid();

let time1 = 0;
let time2 = TIME_STEP;

let cx = -1;
let cy = -1;

let updateGrid = 1;

function main(){
  aels();
  render();
};

function createGrid(){
  const w = 9;
  const h = 9;

  const grid = new Grid(w, h, (x, y, d) => {
    d.gem = null;
  });

  return grid;
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

      if(d1.gem === null || d1.transitions.length !== 0){
        d.createTransition(trTypes.MOVE_ILLEGAL, d.x, d.y, d1.x, d1.y, 1, 1, time1, TRANSITION_DURATION);
        d.createTransition(trTypes.MOVE_ILLEGAL, d1.x, d1.y, d.x, d.y, 1, 1, time1 + TRANSITION_DURATION, TRANSITION_DURATION);

        break drag;
      }

      const {gem} = d;
      d.gem = d1.gem;
      d1.gem = gem;

      const tr1 = new Transition(d, trTypes.MOVE_TRY, d1.x, d1.y, d.x, d.y, 1, 1, time1, TRANSITION_DURATION);
      const tr2 = new Transition(d1, trTypes.MOVE_TRY, d.x, d.y, d1.x, d1.y, 1, 1, time1, TRANSITION_DURATION);

      tr1.other = tr2;
      tr2.other = tr1;
      tr1.success = tr2.success = null;

      d.addTransition(tr1);
      d1.addTransition(tr2);
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

function render(){
  const {w, h} = grid;

  g.clearCanvas(cols.bg);

  g.resetTransform();
  g.translate((g.w - w * tileSize) / 2, (g.h - h * tileSize) / 2);
  g.scale(tileSize);

  // Draw grid
  grid.iter((x, y, d) => {
    const {bgPrev, bg, gem, transitions} = d;

    g.save();
    g.translate(x + .5, y + .5);

    drawBg: {
      if(transitions.length !== 0){
        const tr = transitions[0];

        if(tr.type === trTypes.DESTROY_GEM){
          g.fillStyle = cols.tileBgs[bgPrev];
          g.fillRect(-.5, -.5, 1, 1);
          g.globalAlpha = min((time1 - tr.start) / tr.duration, 1);
          g.fillStyle = cols.tileBgs[bg];
          g.fillRect(-.5, -.5, 1, 1);
          g.globalAlpha = 1;

          break drawBg;
        }
      }

      g.fillStyle = cols.tileBgs[bg];
      g.fillRect(-.5, -.5, 1, 1);
    }

    if(gem !== null && transitions.length === 0)
      drawGem(d);

    g.strokeRect(-.5, -.5, 1, 1);

    g.restore();
  });

  // Draw transitions
  for(const transition of grid.transitions){
    const {tile: d, x1, y1, x2, y2, s1, s2, start, duration} = transition;

    const k = min((time1 - start) / duration, 1);
    const k1 = 1 - k;

    const x = x1 * k1 + x2 * k;
    const y = y1 * k1 + y2 * k;

    g.save();
    g.translate(x + .5, y + .5);

    if(s1 !== 1 || s2 !== 1)
      g.scale(s1 * k1 + s2 * k);

    drawGem(d);

    g.restore();

    if(k !== 1) continue;

    // Transition finished

    transition.remove();
    updateGrid = 1;

    switch(transition.type){
      case trTypes.MOVE_TRY: {
        const {other} = transition;
        const match = grid.match(d);

        if(match === null){
          if(other.success === null){
            transition.success = 0;
            break;
          }

          if(other.success === 0){
            const d2 = grid.get(x1, y1);

            const {gem} = d;
            d.gem = d2.gem;
            d2.gem = gem;

            d.createTransition(trTypes.MOVE_FAIL, x1, y1, x2, y2, 1, 1, time1, TRANSITION_DURATION);
            d2.createTransition(trTypes.MOVE_FAIL, x2, y2, x1, y1, 1, 1, time1, TRANSITION_DURATION);
          }

          break;
        }

        for(const d of match)
          destroyGem(d);

        transition.success = 1;
      } break;

      case trTypes.DESTROY_GEM: {
        d.gem = null;
      } break;
    }
  }

  // Update grid
  if(updateGrid){
    updateGrid = 0;

    // Create new gems and fill empty tiles
    grid.iter((x, y, d) => {
      if(d.transitions.length !== 0) return;
      if(d.gem !== null) return;

      let dPrev = d;

      for(let y1 = y - 1; y1 !== -1; y1--){
        const d1 = grid.get(x, y1);

        if(d1.transitions.length !== 0) break;
        if(d1.gem === null) break;

        dPrev.createTransition(trTypes.FALL, x, y1, x, y1 + 1, 1, 1, time1, TRANSITION_DURATION);
        dPrev.gem = d1.gem;

        dPrev = d1;
      }

      const dLast = dPrev;

      if(dLast.y === 0){
        dLast.gem = O.rand(gemsNum);
        dLast.createTransition(trTypes.NEW, x, -1, x, 0, 1, 1, time1, TRANSITION_DURATION);
        return;
      }

      dLast.gem = null;
    });

    // Destroy matched gems
    grid.iter((x, y, d) => {
      if(d.transitions.length !== 0) return;
      if(d.gem === null) return;

      const match = grid.match(d);
      if(match === null) return;

      for(const d of match)
        destroyGem(d);
    });
  }

  time1 += TIME_STEP;
  time2 += TIME_STEP;

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

const destroyGem = d => {
  const {x, y} = d;

  d.createTransition(trTypes.DESTROY_GEM, x, y, x, y, 1, 0, time1, TRANSITION_DURATION);

  d.bgPrev = d.bg;
  if(d.bg !== bgsNum - 1) d.bg++;
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