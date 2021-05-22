'use strict';

const assert = require('assert');
const World = require('./world');
const Tile = require('./tile');
const Entity = require('./entity');
const Trait = require('./trait');
const CtorMap = require('./ctor-map');
const inspect = require('./inspect');

const {floor} = Math;

await O.addStyle('style.css');

const w = 9;
const h = 9;
const s = 40;

const cols = {
  bg: [169, 169, 169],
};

for(const key of O.keys(cols))
  cols[key] = O.Color.from(cols[key]).toString();

const {g} = O.ceCanvas(1);

const world = new World(w, h);
const {grid} = world;

const infoContainer = O.ceDiv(O.body, 'info');

let iw, ih;
let ctrl = 0;

const main = () => {
  global.world = world;

  world.reqCreateEntAtPos([0, 0], Entity.Player);

  for(let y = 0; y !== 3; y++){
    for(let i = 0; i !== y; i++)
      world.reqCreateEntAtPos([3 + i, y], Entity.Box, i === 0 && y === 1);

    world.reqCreateEntAtPos([5, y], Entity.Wall);
  }

  world.tick();

  O.ael('resize', onResize);
  O.ael('keydown', onKeyDown);
  O.ael('keyup', onKeyUp);
  O.ael('mousedown', onMouseDown);
  O.ael('contextmenu', onContextMenu);
  O.ael('blur', onBlur);

  onResize();
};

const onResize = evt => {
  ({iw, ih} = O);

  g.resize(iw, ih);
  g.font(24);

  render();
};

const onKeyDown = evt => {
  ctrl = evt.ctrlKey;

  const {code} = evt;
  let dir = null;

  switch(code){
    case 'ArrowUp':
      dir = 0;
      break;

    case 'ArrowRight':
      dir = 1;
      break;

    case 'ArrowDown':
      dir = 2;
      break;

    case 'ArrowLeft':
      dir = 3;
      break;
  }

  if(dir !== null){
    clearInfo();
    world.evts.nav = dir;
    world.tick();
    world.evts.nav = null;
    render();
  }
};

const onKeyUp = evt => {
  ctrl = evt.ctrlKey;
};

const onMouseDown = evt => {
  if(evt.detail > 1){
    O.pd(evt);
    return;
  }

  if(ctrl){
    clearInfo();

    const x = floor((evt.clientX - iw / 2) / s + w / 2);
    const y = floor((evt.clientY - ih / 2) / s + h / 2);

    const tile = world.getTile([x, y]);
    if(tile === null) return;

    const info = O.rec([tile, 'inspect']);

    setInfo(O.rec([info, 'toDOM']));

    return;
  }
};

const onContextMenu = evt => {
  O.pd(evt);
};

const onBlur = evt => {
  ctrl = 0;
};

const render = () => {
  g.resetTransform();
  g.fillStyle = cols.bg;
  g.fillRect(0, 0, iw, ih);

  g.translate(iw / 2, ih / 2);
  g.scale(s);
  g.translate(-w / 2, -h / 2);

  grid.iter((x, y, d) => {
    g.save();
    g.translate(x + .5, y + .5);
    d.render(g);
    g.restore();
  });

  g.beginPath();
  for(let i = 0; i <= w; i++){
    g.moveTo(i, 0);
    g.lineTo(i, h);
  }
  for(let i = 0; i <= h; i++){
    g.moveTo(0, i);
    g.lineTo(w, i);
  }
  g.stroke();
};

const setInfo = info => {
  clearInfo();
  infoContainer.appendChild(info);
};

const clearInfo = () => {
  infoContainer.innerText = '';
};

main();