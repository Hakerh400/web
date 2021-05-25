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

  get room(){ return this.tile.room; }
  get valid(){ return this.tile !== null; }

  get layer(){
    let layer = O.N;

    for(const trait of this.traits.vals)
      if(trait.layer < layer)
        layer = trait.layer;

    return layer;
  }

  hasTrait(traitCtor){
    return this.traits.hasKey(traitCtor);
  }

  addTrait(trait){
    this.traits.add(trait);
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
  constructor(tile, src, direct=0, strong=0){
    super(tile);

    this.addTrait(new Trait.Meta(this));
    this.addTrait(new Trait.NavigationTarget(this, src, direct, strong));
  }
}

class Player extends Entity{
  constructor(tile){
    super(tile);

    this.addTrait(new Trait.Player(this));
    this.addTrait(new Trait.Solid(this));
  }
}

class Wall extends Entity{
  constructor(tile){
    super(tile);

    this.addTrait(new Trait.Wall(this));
    this.addTrait(new Trait.Solid(this));
  }
}

class Box extends Entity{
  constructor(tile, heavy=0){
    super(tile);

    this.addTrait(new Trait.Box(this));
    this.addTrait(new Trait.Solid(this));
    this.addTrait(new Trait.Pushable(this));

    if(heavy)
      this.addTrait(new Trait.Heavy(this));
  }
}

class Diamond extends Entity{
  constructor(tile){
    super(tile);

    this.addTrait(new Trait.Diamond(this));
    this.addTrait(new Trait.Item(this));
  }
}

class Concrete extends Entity{
  constructor(tile){
    super(tile);

    this.addTrait(new Trait.Concrete(this));
    this.addTrait(new Trait.Floor(this));
  }
}

module.exports = Object.assign(Entity, {
  NavigationTarget,
  Player,
  Wall,
  Box,
  Diamond,
  Concrete,
});

const Trait = require('./trait');