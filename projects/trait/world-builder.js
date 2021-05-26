'use strict';

const assert = require('assert');
const World = require('./world');
const Room = require('./room');
const Grid = require('./grid');
const Entity = require('./entity');
const Trait = require('./trait');

const {project} = O;

const getWorld = () => {
  if(!O.has(O.lst, project)){
    const world = initWorld();
    saveWorld(world);
    return world;
  }

  return loadWorld();
};

const initWorld = () => {
  const world = new World();

  initMainRoom(world);

  return world;
};

const initMainRoom = world => {
  const w = 10;
  const h = 12;

  const grid = new Grid.Rectangle(w, h);
  const room = world.createRoom(grid, 2);

  grid.enterBuildMode();

  grid.createEnt(0, 2, Entity.Player);
  grid.createEnt(1, 3, Entity.Box, 0);
  grid.createEnt(3, 3, Entity.Box, 0);
  grid.createEnt(1, 5, Entity.Box, 1);
  grid.createEnt(3, 5, Entity.Box, 1);
  grid.createEnt(5, 4, Entity.Wall);
  grid.createEnt(5, 2, Entity.Diamond);

  for(const tile of grid.tiles)
    tile.createEnt(Entity.Concrete);

  const putStr = (str, x, y, traitCtor, upper=0) => {
    if(upper) str = str.toUpperCase();

    for(const c of str){
      const tile = grid.getp(x, y);
      const trait = O.fst(tile.traits.get(traitCtor));
      const ent = trait.ent;

      ent.addTrait(new Trait.Text(ent, c));
      x++;
    }
  };

  putStr('Levels', 2, 0, Trait.Concrete, 1);

  // for(const tile of grid.tiles){
  //   const {x, y} = tile.pos;
  //   const ent = O.fst(tile.traits.get(Trait.Concrete)).ent;
  //   ent.addTrait(new Trait.Text(ent, `${x}${y}`));
  // }

  // for(const tile of grid.tiles){
  //   if(tile.ents.size !== 1) continue;
  //   if(!O.rand(2)) continue;
  //
  //   tile.createEnt(Entity.Player);
  // }

  grid.exitBuildMode();
};

const saveWorld = world => {
  O.lst[project] = world.serialize().toString('base64');
};

const loadWorld = () => {
  return World.deserialize(O.Buffer.from(O.lst[project], 'base64'));
};

module.exports = {
  getWorld,
  initWorld,
  initMainRoom,
  saveWorld,
  loadWorld,
};