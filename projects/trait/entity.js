'use strict';

const assert = require('assert');

class Entity{
  traits = new Set();
  traitNames = O.obj();

  constructor(tile){
    this.tile = tile;
  }

  get valid(){ return this.tile !== null; }
  get world(){ return this.tile.world; }

  render(g){
    for(const trait of this.traits)
      trait.render(g);
  }

  addTrait(trait){
    assert(!this.traits.has(trait));

    this.traits.add(trait);
    this.traitNames[trait.name] = trait;

    // this.tile.addTrait(trait);

    trait.onCreate(this);
  }

  removeTrait(trait){
    assert(this.traits.has(trait));

    this.traits.delete(trait);
    delete this.traitNames[trait.name];
    
    // this.tile.removeTrait(trait);
    
    trait.onRemove(this);
  }

  hasTrait(trait){
    assert(typeof trait === 'string');
    return O.has(this.traitNames, trait);
  }

  move(tileNew){
    const from = this.tile;
    const to = tileNew;

    from.removeEnt(this);
    to.addEnt(this);

    for(const trait of this.traits)
      trait.onMove(from, to);
  }

  remove(){
    this.tile.removeEnt(this);

    for(const trait of this.traits)
      trait.remove();
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

class Player extends Entity{
  constructor(tile){
    super(tile);

    Trait.create(this, 'player');
    Trait.create(this, 'solid');
  }
}

class Wall extends Entity{
  constructor(tile){
    super(tile);

    Trait.create(this, 'wall');
    Trait.create(this, 'solid');
  }
}

module.exports = Object.assign(Entity, {
  Meta,
  NavigationTarget,
  Player,
  Wall,
});

const Trait = require('./trait');

const {traitsObj} = Trait;