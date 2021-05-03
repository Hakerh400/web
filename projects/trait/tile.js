'use strict';

const assert = require('assert');

class Tile{
  ents = new Set();
  traits = new Map();
  entsNum = 0;

  constructor(world){
    this.world = world;
  }

  addEnt(ent){
    assert(!this.ents.has(ent));

    this.ents.add(ent);

    for(const trait of ent.traits)
      this.addTrait(trait);

    this.entsNum++;
    
    ent.tile = this;
  }

  removeEnt(ent){
    assert(this.ents.has(ent));

    this.ents.delete(ent);
    this.entsNum--;

    ent.tile = null;
  }

  addTrait(trait){
    const num = this.traits.get(trait) | 0;

    this.traits.set(num + 1);
    this.world.addTraitToTile(this, trait);
  }

  removeTrait(trait){
    const num = this.traits.get(trait) | 0;
    assert(num !== 0);

    if(num === 1) this.traits.delete(trait);
    else this.traits.set(num - 1);

    this.world.removeTraitFromTile(this, trait);
  }
}

module.exports = Tile;