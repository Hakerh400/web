'use strict';

const assert = require('assert');
const Request = require('./request');
const Grid = require('./grid');
const Tile = require('./tile');
const Entity = require('./entity');
const Trait = require('./trait');
const CtorsMap = require('./ctors-map');
const Serializable = require('./serializable');
const flags = require('./flags');

class Room extends Serializable{
  init(){
    super.init();

    this.activeTraits = new Set();
  }

  new(world, grid){
    super.new();

    this.world = world;
    this.grid = grid;
    grid.room = this;
  }

  get valid(){
    return this.world !== null;
  }

  get traits(){ return this.grid.traits; }

  getTile(pos){
    return this.grid.get(pos);
  }

  remove(){
    assert(this.valid);

    for(const trait of this.traits.vals)
      trait.remove(1);

    this.world = null;
  }

  addActiveTrait(trait){
    const {activeTraits} = this;
    assert(!activeTraits.has(trait));
    activeTraits.add(trait);
  }

  removeActiveTrait(trait){
    const {activeTraits} = this;
    assert(activeTraits.has(trait));
    activeTraits.delete(trait);
  }

  markTileAsNotified(tile, delay=0){
    const {world, grid} = this;
    assert(!grid.buildMode);

    if(flags.DisplayNotifiedTiles)
      world.notifiedTilesInfo.add(tile);
    
    world.notifiedTiles.add(tile);

    if(delay)
      world.notifiedTilesDelayed.add(tile);
  }

  reqCreateEntAtPos(pos, entCtor, ...args){
    const tile = this.getTile(pos);
    this.world.reqCreateEnt(tile, entCtor, ...args);
  }

  *ser(ser){
    yield [[this.grid, 'serm'], ser];
    yield [[ser, 'writeSet'], this.activeTraits, Trait];
  }

  static *deser(ser){
    const room = Room.new();

    const grid = room.grid = yield [[Grid, 'deserm'], ser];
    const activeTraits = room.activeTraits = yield [[ser, 'readSet'], Trait];

    grid.room = room;

    return room;
  }
}

module.exports = Room;