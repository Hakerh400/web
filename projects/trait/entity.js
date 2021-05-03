'use strict';

const assert = require('assert');

class Entity{
  traits = new Set();

  constructor(tile){
    this.tile = tile;
  }

  get world(){ return this.tile.world; }

  addTrait(trait){
    assert(!this.traits.has(trait));

    this.traits.add(trait);
    this.tile.addTrait(trait);
    
    trait.setEnt(this);
  }

  removeTrait(trait){
    assert(this.traits.has(trait));

    this.traits.delete(trait);
    this.tile.removeTrait(trait);

    trait.setEnt(null);
  }
}

module.exports = Entity;