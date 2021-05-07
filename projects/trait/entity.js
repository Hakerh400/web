'use strict';

const assert = require('assert');

class Entity{
  traits = new Set();

  constructor(tile){
    this.tile = tile;
    tile.addEnt(this);
  }

  get world(){ return this.tile.world; }

  render(g){
    for(const trait of this.traits)
      trait.render(g);
  }

  addTrait(trait){
    assert(!this.traits.has(trait));

    this.traits.add(trait);
    this.tile.addTrait(trait);

    trait.onAttach(this);
  }

  removeTrait(trait){
    assert(this.traits.has(trait));

    this.traits.delete(trait);
    this.tile.removeTrait(trait);
    
    trait.onDetach(this);
  }

  move(tileNew){
    this.tile.removeEnt(this);
    tileNew.addEnt(this);
  }

  remove(){
    this.tile.removeEnt(this);
  }
}

class Player extends Entity{
  constructor(tile){
    super(tile);

    Trait.create(this, 'player');
  }
}

class Meta extends Entity{
  constructor(tile){
    super(tile);

    Trait.create(this, 'meta');
  }
}

class NavigationTarget extends Meta{
  constructor(tile, src){
    super(tile);

    this.src = src;

    Trait.create(this, 'navTarget');
  }
}

module.exports = Object.assign(Entity, {
  Player,
  NavigationTarget,
});

const Trait = require('./trait');

const {traitsObj} = Trait;