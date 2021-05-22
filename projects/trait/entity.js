'use strict';

const assert = require('assert');
const CtorMap = require('./ctor-map');
const inspect = require('./inspect');
const info = require('./info');

const {
  BasicInfo,
  DetailedInfo,
} = info;

class Entity extends inspect.Inspectable{
  traits = new CtorMap();
  globData = new Map();
  locData = new WeakMap();

  constructor(tile){
    super();
    
    this.tile = tile;
  }

  get world(){ return this.tile.world; }
  get valid(){ return this.tile !== null; }

  hasTrait(traitCtor){
    return this.traits.hasKey(traitCtor);
  }

  getGlobData(traitCtor){
    const {globData} = this;

    if(!globData.has(traitCtor))
      return null;

    return globData.get(traitCtor);
  }

  setGlobData(traitCtor, data){
    this.globData.set(traitCtor, data);
    this.notify();
  }

  getLocData(trait){
    const {locData} = this;

    if(!locData.has(traitCtor))
      return null;

    return locData.get(traitCtor);
  }

  setLocData(traitCtor, data){
    this.locData.set(traitCtor, data);
    this.notify();
  }

  render(g){
    for(const trait of this.traits.vals)
      trait.render(g);
  }

  notify(){
    this.tile.notify();
  }

  remove(){
    this.tile.removeEnt(this);

    for(const trait of this.traits.vals)
      trait.onRemove();

    this.tile = null;
  }

  *inspect(){
    return new DetailedInfo('ent :: Entity', [
      new DetailedInfo('traits :: Set Trait', yield [O.mapr, this.traits.vals, function*(trait){
        return O.tco([trait, 'inspect']);
      }]),
    ]);
  }
}

class NavigationTarget extends Entity{
  constructor(tile, src){
    super(tile);

    this.traits.addTrait(new Trait.Meta(this));
    this.traits.addTrait(new Trait.NavigationTarget(this, src));
  }
}

class Player extends Entity{
  constructor(tile){
    super(tile);

    this.traits.addTrait(new Trait.Player(this));
    this.traits.addTrait(new Trait.Solid(this));
  }
}

class Wall extends Entity{
  constructor(tile){
    super(tile);

    this.traits.addTrait(new Trait.Wall(this));
    this.traits.addTrait(new Trait.Solid(this));
  }
}

class Box extends Entity{
  constructor(tile, heavy=0){
    super(tile);

    this.traits.addTrait(new Trait.Box(this));
    this.traits.addTrait(new Trait.Solid(this));
    this.traits.addTrait(new Trait.Pushable(this));

    if(heavy)
      this.traits.addTrait(new Trait.Heavy(this));
  }
}

module.exports = Object.assign(Entity, {
  NavigationTarget,
  Player,
  Wall,
  Box,
});

const Trait = require('./trait');