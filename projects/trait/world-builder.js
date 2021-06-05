'use strict';

const assert = require('assert');
const World = require('./world');
const Room = require('./room');
const Grid = require('./grid');
const Entity = require('./entity');
const Trait = require('./trait');
const Action = require('./action');
const flags = require('./flags');
const levels = require('./levels');

const {project} = O;

const getWorld = () => {
  if(O.has(O.lst, project)){
    if(flags.Persist)
      return loadWorld();

    delete O.lst[project];
  }

  const world = initWorld();
  saveWorld(world);

  return world;
};

const initWorld = () => {
  const world = new World();

  initMainRoom(world);

  return world;
};

const initMainRoom = world => {
  const w = 10;
  const h = 12;

  const room = world.pushRoom(Grid.Rectangle, [w, h], grid => {
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

    for(const tile of grid.tiles)
      tile.createEnt(Entity.Concrete);

    putStr('Levels', 2, 0, Trait.Concrete, 1);

    for(let y = 0; y !== 10; y++){
      for(let x = 0; x !== 10; x++){
        const tile = grid.getp(x, y + 2);

        unlock: if(flags.UnlockLevels || (x === 0 && y === 0)){
          const lab = String(y * 10 + x + 1).padStart(2, '0');
          if(lab.length !== 2) break unlock;
          if(!O.has(levels, lab)) break unlock;

          tile.createEnt(Entity.Button, lab, new Action.OpenLevel());
          
          continue;
        }

        tile.createEnt(Entity.Lock);
      }
    }
  });
};

const saveWorld = world => {
  if(!flags.Persist) return;

  O.lst[project] = world.serialize().toString('base64');
};

const loadWorld = () => {
  assert(flags.Persist);

  return World.deserialize(O.Buffer.from(O.lst[project], 'base64'));
};

module.exports = {
  getWorld,
  initWorld,
  initMainRoom,
  saveWorld,
  loadWorld,
};