'use strict';

const assert = require('assert');
const Room = require('./room');
const Grid = require('./grid');
const Position = require('./position');
const Tile = require('./tile');
const Entity = require('./entity');
const Trait = require('./trait');
const CtorsMap = require('./ctors-map');
const inspect = require('./inspect');
const serializer = require('./serializer');

const {floor} = Math;
const {project} = O;

await O.addStyle('style.css');

const w = 10;
const h = 12;
const s = 40;

const cols = {
  bg: [169, 169, 169],
};

for(const key of O.keys(cols))
  cols[key] = O.Color.from(cols[key]).toString();

const {g} = O.ceCanvas(1);

const infoContainer = O.ceDiv(O.body, 'info hidden');

let room = null;

let iw, ih;
let ctrl = 0;

const main = () => {
  if(!O.has(O.lst, project)|1){
    initRoom();
    saveRoom();
  }else{
    loadRoom();
  }

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

const initRoom = () => {
  room = new Room(new Grid.Rectangle(w, h));;

  const p = (x, y) => {
    return new Position.Rectangle(x, y);
  };

  room.reqCreateEntAtPos(p(0, 2), Entity.Player);
  room.reqCreateEntAtPos(p(1, 3), Entity.Box, 0);
  room.reqCreateEntAtPos(p(3, 3), Entity.Box, 0);
  room.reqCreateEntAtPos(p(1, 5), Entity.Box, 1);
  room.reqCreateEntAtPos(p(3, 5), Entity.Box, 1);
  room.reqCreateEntAtPos(p(5, 4), Entity.Wall);
  room.reqCreateEntAtPos(p(5, 2), Entity.Diamond);

  for(let y = 0; y !== h; y++){
    for(let x = 0; x !== w; x++){
      const ent = room.reqCreateEntAtPos(p(x, y), Entity.Concrete);
    }
  }

  room.tick();

  const putStr = (str, x, y, traitCtor, upper=0) => {
    if(upper) str = str.toUpperCase();

    for(const c of str){
      const tile = room.getTile(p(x, y));
      const trait = O.fst(tile.traits.get(traitCtor));
      const ent = trait.ent;

      ent.addTrait(new Trait.Text(ent, c));
      x++;
    }
  };

  putStr('Levels', 2, 0, Trait.Concrete, 1);

  // for(let y = 0; y !== h; y++){
  //   for(let x = 0; x !== w; x++){
  //     const ent = O.fst(room.getTile(p(x, y)).traits.get(Trait.Concrete)).ent;
  //     ent.addTrait(new Trait.Text(ent, `${x}${y}`));
  //   }
  // }
};

const saveRoom = () => {
  O.lst[project] = room.serialize().toString('base64');
};

const loadRoom = () => {
  room = Room.deserialize(O.Buffer.from(O.lst[project], 'base64'));
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
    room.evts.nav = dir;
    room.tick();
    room.evts.nav = null;

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
  if(evt.detail > 1){
    O.pd(evt);
    return;
  }

  if(ctrl){
    clearInfo();

    const x = floor((evt.clientX - iw / 2) / s + w / 2);
    const y = floor((evt.clientY - ih / 2) / s + h / 2);

    const tile = room.getTile(new Position.Rectangle(x, y));
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

const onBeforeUnload = evt => {
  saveRoom();
};

const render = () => {
  const {grid} = room;

  g.resetTransform();
  g.fillStyle = cols.bg;
  g.fillRect(0, 0, iw, ih);

  g.translate(iw / 2, ih / 2);
  g.scale(s);
  g.translate(-w / 2, -h / 2);

  const s1 = 1 / s;

  g.fillStyle = '#000';
  g.fillRect(0, 0, w, h);

  for(const tile of grid.tiles){
    const {x, y} = tile.pos;

    g.save();
    g.translate(x + .5, y + .5);
    tile.render(g);
    g.restore();
  }

  g.beginPath();
  for(let i = 0; i <= w; i++){
    g.moveTo(i, 0);
    g.lineTo(i, h + s1);
  }
  for(let i = 0; i <= h; i++){
    g.moveTo(0, i);
    g.lineTo(w + s1, i);
  }
  g.stroke();
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