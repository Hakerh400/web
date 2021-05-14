'use strict';

const assert = require('assert');
const Trait = require('./trait');
const CtorMap = require('./ctor-map');

class Entity{
  traits = new CtorMap();

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

  remove(){
    for(const trait of this.traits.vals)
      trait.remove();

    this.tile = null;
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