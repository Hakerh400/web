'use strict';

const assert = require('assert');
const Trait = require('./trait');
const TraitMap = require('./trait-map');

class Entity{
  traits = new TraitMap();

  constructor(tile){
    this.tile = tile;
  }

  get world(){ return this.tile.world; }

  render(g){
    for(const trait of this.traits.vals)
      trait.render(g);
  }

  // createTrait(ctor, ...args){
  //   const trait = new ctor(this, ...args);
  //   this.addTrait(trait);
  //   return trait;
  // }
}

class Player extends Entity{
  constructor(tile){
    super(tile);

    this.traits.addTrait(new Trait.Player(this));
    this.world.updateEnt(this);
  }
}

module.exports = Object.assign(Entity, {
  Player,
});