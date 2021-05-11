'use strict';

const assert = require('assert');
const Trait = require('./trait');
const TraitMap = require('./trait-map');

class Entity{
  traits = new TraitMap();

  data = O.obj();

  constructor(tile){
    this.tile = tile;
  }

  get world(){ return this.tile.world; }
  get valid(){ return this.tile !== null; }

  render(g){
    for(const trait of this.traits.vals)
      trait.render(g);
  }
}

class Player extends Entity{
  constructor(tile){
    super(tile);

    this.traits.addTrait(new Trait.Player(this));
  }
}

module.exports = Object.assign(Entity, {
  Player,
});