'use strict';

const assert = require('assert');
const Request = require('./request');
const Grid = require('./grid');
const Tile = require('./tile');
const Entity = require('./entity');
const Trait = require('./trait');
const CtorsMap = require('./ctors-map');
const Serializable = require('./serializable');

class Room extends Serializable{
  active = 0;

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

  get passive(){ return !this.active; }
  set passive(a){ this.active = !a; }

  getTile(pos){
    return this.grid.get(pos);
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
    
    if(delay) world.notifiedTilesDelayed.add(tile);
    else world.notifiedTiles.add(tile);
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