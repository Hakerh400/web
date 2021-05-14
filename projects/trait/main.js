'use strict';

const assert = require('assert');
const World = require('./world');
const Tile = require('./tile');
const Entity = require('./entity');
const Trait = require('./trait');

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

let iw, ih;

const main = () => {
  global.world = world;

  for(let y = 0; y !== 3; y++){
    for(let x = 0; x !== 3; x++)
      world.reqCreateEntAtPos([x, y], Entity.Player);

    for(let i = 0; i !== y; i++)
      world.reqCreateEntAtPos([3 + i, y], Entity.Box);

    world.reqCreateEntAtPos([5, y], Entity.Wall);
  }

  world.tick();

  O.ael('resize', onResize);
  O.ael('keydown', onKeydown);

  onResize();
  render();
};

const onResize = evt => {
  ({iw, ih} = O);

  g.resize(iw, ih);
  g.font(24);
};

const onKeydown = evt => {
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
    world.evts.nav = dir;
    world.tick();
    world.evts.nav = null;
  }
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
    g.translate(x, y);
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

  O.raf(render);
};

main();