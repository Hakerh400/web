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
const flags = require('./flags');
const levels = require('./levels');
const solutions = require('./solutions');

const {floor} = Math;
const {project} = O;

await O.addStyle('style.css');

const ANIM_INTERVAL = 20;

const s = 40;

const cols = {
  bg: [169, 169, 169],
};

for(const key of O.keys(cols))
  cols[key] = O.Color.from(cols[key]).toString();

const {g} = O.ceCanvas(1);

const infoContainer = O.ceDiv(O.body, 'info hidden');

const world = worldBuilder.getWorld();

const moves = flags.Record ? [] : null;
let recording = 0;

let playingInterval = null;
let playing = 0;

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

  if(flags.OpenLastLevel){
    const level = String(O.last(O.sortAsc(O.keys(levels).map(a => a | 0)))).padStart(2, 0);

    for(const text of world.selectedRoom.grid.getTraits(Trait.Text)){
      if(text.str !== level) continue;

      world.evts.lmb = text.tile;
      world.tick();
      render();

      break;
    }
  }
};

const onResize = evt => {
  ({iw, ih} = O);

  g.resize(iw, ih);
  g.font(24);

  render();
};

const onKeyDown = evt => {
  if(playing){
    playing = 0;
    clearInterval(playingInterval);
  }

  const {code} = evt;

  ctrl = evt.ctrlKey;

  const {evts} = world;

  let tick = 1;

  const nav = dir => {
    evts.nav = dir;

    if(recording)
      moves.push(dir);
  };

  switch(code){
    case 'ArrowUp':
      nav(0);
      break;

    case 'ArrowRight':
      nav(1);
      break;

    case 'ArrowDown':
      nav(2);
      break;

    case 'ArrowLeft':
      nav(3);
      break;

    case 'Space':
      evts.pickOrDropItem = 1;

      if(recording)
        moves.push(5);

      break;

    case 'Enter':
      if(recording)
        moves.push(4);

      break;

    case 'KeyR':
      evts.restart = 1;
      break;

    case 'Escape':
      evts.exit = 1;
      break;

    case 'Home': {
      if(!flags.Record) break;

      clearInfo();
      tick = 0;

      if(ctrl){
        const levelRaw = getCurrentLevel();
        if(levelRaw === null) break;

        const level = levelRaw.padStart(2, '0');
        if(!O.has(solutions, level)) break;

        const sol = solutions[level];
        const solLen = sol.length;
        let solIndex = 0;

        playing = 1;

        playingInterval = setInterval(() => {
          if(solIndex === solLen){
            playing = 0;
            clearInterval(playingInterval);
            return;
          }

          const c = sol[solIndex++];

          exec: {
            if(c >= '0' && c <= '9'){
              const n = c | 0;

              if(n <= 3){
                world.evts.nav = n;
                break exec;
              }

              if(n === 4) break exec;

              if(n === 5){
                evts.pickOrDropItem = 1;
                break exec;
              }

              assert.fail();
            }

            assert.fail();
          }

          world.tick();
          render();
        }, ANIM_INTERVAL);

        break;
      }

      if(!recording){
        log('start');
        assert(moves.length === 0);
        recording = 1;
      }else{
        log('end');
        log(moves.join(''));
        moves.length = 0;
        recording = 0;
      }

    } break;

    case 'F5':
      O.pd(evt);
      tick = 0;

      worldBuilder.saveWorld(world);

      O.rel('beforeunload', onBeforeUnload);
      location.reload();

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

  const tile = grid.getp(x, y);
  if(tile === null) return;

  if(isInspect){
    if(flags.LogTileOnClick)
      log(tile);

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
    g.clipRect(0, 0, 1, 1);
    tile.render(g);
    g.unclipRect();

    if(flags.DisplayNotifiedTiles){
      if(world.notifiedTilesInfo.has(tile)){
        g.globalAlpha = .5;
        g.fillStyle = '#f00';
        g.fillRect(0, 0, 1, 1);
        g.globalAlpha = 1;
      }
    }

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

const getCurrentLevel = () => {
  const {roomStack} = world;
  const menu = O.fst(roomStack);
  if(!menu) return null;

  const {grid} = menu;
  const entered = grid.getEnt(Trait.Entered);
  if(!entered) return null;

  const text = entered.getTrait(Trait.Text);
  if(!text) return null;

  return text.str;
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