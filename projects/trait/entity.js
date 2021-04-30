'use strict';

const assert = require('assert');
const WorldElement = require('./world-elem');

class Entity extends WorldElement{
  tile = null;
  traits = new Set();

  addTrait(trait){
    assert(!this.traits.has(trait));

    this.traits.add(trait);

    if(this.tile !== null)
      this.tile.addTrait(trait);
    
    trait.setEnt(this);
  }

  removeTrait(trait){
    assert(this.traits.has(trait));

    this.traits.delete(trait);

    if(this.tile !== null)
      this.tile.removeTrait(trait);

    trait.setEnt(null);
  }
}

module.exports = Entity;