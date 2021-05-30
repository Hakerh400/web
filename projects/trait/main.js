'use strict';

const assert = require('assert');
const World = require('./world');
const Room = require('./room');
const Grid = require('./grid');
const Position = require('./position');
const Tile = require('./tile');
const Entity = require('./entity');
const Trait = require('./trait');
const CtorsMap = require('./ctors-map');
const serializer = require('./serializer');
const worldBuilder = require('./world-builder');

const {floor} = Math;
const {project} = O;

await O.addStyle('style.css');

const s = 40;

const cols = {
  bg: [169, 169, 169],
};

for(const key of O.keys(cols))
  cols[key] = O.Color.from(cols[key]).toString();

const {g} = O.ceCanvas(1);

const infoContainer = O.ceDiv(O.body, 'info hidden');

const world = worldBuilder.getWorld();

let iw, ih;
let ctrl = 0;

const main = () => {
  aels();
};

const aels = () => {
  O.ael('resize', onResize);
  O.ael('keydown', onKeyDown);
  O.ael('keyup', onKeyUp);
  O.ael('mousedown', onMouseDown);
  O.ael('contextmenu', onContextMenu);
  O.ael('blur', onBlur);
  O.ael('beforeunload', onBeforeUnload);

  onResize();
};

const onResize = evt => {
  ({iw, ih} = O);

  g.resize(iw, ih);
  g.font(24);

  render();
};

const onKeyDown = evt => {
  const {code} = evt;

  ctrl = evt.ctrlKey;

  const {evts} = world;

  let tick = 1;

  switch(code){
    case 'ArrowUp':
      evts.nav = 0;
      break;

    case 'ArrowRight':
      evts.nav = 1;
      break;

    case 'ArrowDown':
      evts.nav = 2;
      break;

    case 'ArrowLeft':
      evts.nav = 3;
      break;

    case 'KeyR':
      evts.restart = 1;
      break;

    case 'Escape':
      evts.exit = 1;
      break;

    default:
      tick = 0;
      break;
  }

  if(tick){
    clearInfo();

    world.tick();

    // worldBuilder.saveWorld(world);

    // const ctorsArr = [];
    // const buf = room.serialize();
    // room = Room.deserialize(buf);

    render();
  }
};

const onKeyUp = evt => {
  ctrl = evt.ctrlKey;
};

const onMouseDown = evt => {
  const isCanvas = evt.target === g.canvas;

  if(!isCanvas){
    if(evt.detail > 1 || ctrl) O.pd(evt);
    return;
  }

  clearInfo();
  
  const isInspect = isCanvas && ctrl;

  const room = world.selectedRoom;
  if(room === null) return;

  const {grid} = room;
  const {w, h} = grid;

  const x = floor((evt.clientX - iw / 2) / s + w / 2);
  const y = floor((evt.clientY - ih / 2) / s + h / 2);

  const tile = grid.get(pos(x, y));
  if(tile === null) return;

  if(isInspect){
    const info = O.rec([tile, 'inspect']);
    setInfo(O.rec([info, 'toDOM']));
    return;
  }

  clearInfo();
  world.evts.lmb = tile;
  world.tick();
  render();
};

const onContextMenu = evt => {
  O.pd(evt);
};

const onBlur = evt => {
  ctrl = 0;
};

const onBeforeUnload = evt => {
  worldBuilder.saveWorld(world);
};

const render = () => {
  const room = world.selectedRoom
  assert(room !== null);

  const {grid} = room;
  const {w, h} = grid;

  g.resetTransform();
  g.fillStyle = cols.bg;
  g.fillRect(0, 0, iw, ih);

  g.translate(iw / 2, ih / 2);
  g.scale(s);
  g.translate(-w / 2, -h / 2);

  const {gs} = g;

  g.fillStyle = '#000';
  g.fillRect(0, 0, w, h);

  for(const tile of grid.tiles){
    const {x, y} = tile.pos;

    g.save();
    g.translate(x, y);
    tile.render(g);
    g.restore();
  }

  g.beginPath();
  for(let i = 0; i <= w; i++){
    g.moveTo(i, 0);
    g.lineTo(i, h + gs);
  }
  for(let i = 0; i <= h; i++){
    g.moveTo(0, i);
    g.lineTo(w + gs, i);
  }
  g.stroke();
};

const pos = (x, y) => {
  return new Position.Rectangle(x, y);
};

const setInfo = info => {
  clearInfo();

  infoContainer.appendChild(info);
  infoContainer.classList.remove('hidden');
};

const clearInfo = () => {
  infoContainer.innerText = '';
  infoContainer.classList.add('hidden');
};

main();