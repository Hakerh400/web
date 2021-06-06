'use strict';

const assert = require('assert');
const CtorsMap = require('./ctors-map');
const Inspectable = require('./inspectable');
const info = require('./info');
const Serializable = require('./serializable');

const {
  BasicInfo,
  DetailedInfo,
} = info;

class Entity extends Inspectable{
  static get baseCtor(){ return Entity; }

  init(){
    super.init();

    this.globData = new Map();
    this.locData = new Map();
    this.traits = new CtorsMap();
  }

  new(tile){
    super.new();
    
    this.tile = tile;
  }

  get valid(){
    return (
      this.tile !== null &&
      this.grid !== null &&
      this.room !== null &&
      this.world !== null
    );
  }

  get pos(){ return this.tile.pos; }
  get grid(){ return this.tile.grid; }
  get room(){ return this.tile.room; }
  get world(){ return this.tile.world; }

  get layer(){
    let layer = O.N;

    for(const trait of this.traits.vals){
      const traitLayer = trait.layer;
      if(traitLayer === null) continue;

      if(traitLayer < layer)
        layer = traitLayer;
    }

    return layer;
  }

  createTrait(traitCtor, ...args){
    this.addTrait(new traitCtor(this, ...args));
  }

  addTrait(trait){
    super.addTrait(trait);
    this.tile.addTrait(trait);
  }

  removeTrait(trait){
    super.removeTrait(trait);
    this.tile.removeTrait(trait);
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

  setLocData(trait, data){
    this.locData.set(trait, data);
    this.notify();

    trait.locDataEnts.add(this);
  }

  render(g){
    const traits = [...this.traits.vals].sort((t1, t2) => {
      const layer1 = t1.layer;
      const layer2 = t2.layer;

      if(layer1 !== layer2){
        if(layer1 === null) return 1;
        if(layer2 === null) return -1;
        return layer1 - layer2;
      }

      return t1.pri - t2.pri;
    });

    for(const trait of traits)
      trait.render(g);
  }

  notify(delay){ this.tile.notify(delay); }

  remove(){
    this.tile.removeEnt(this);

    for(const trait of this.traits.vals)
      trait.onRemove();

    this.tile = null;
  }

  *ser(ser){
    const {globData, locData} = this;

    ser.writeInt(globData.size);
    
    for(const [ctor, data] of globData){
      yield [[ctor, 'serCtor'], ser];
      yield [[ctor, 'serEntGlobData'], ser, data, this];
    }

    ser.writeInt(locData.size);
    
    for(const [trait, data] of locData){
      yield [[trait, 'serm'], ser];
      yield [[trait, 'serEntLocData'], ser, data, this];
    }

    yield [[ser, 'writeCtorsMap'], this.traits];
  }

  static *deser(ser){
    const ent = Entity.new();

    const globDataSize = ser.readInt();
    const globData = ent.globData = new Map();

    for(let i = 0; i !== globDataSize; i++){
      const ctor = yield [[Trait, 'deserCtor'], ser];
      const data = yield [[ctor, 'deserEntGlobData'], ser];

      assert(!globData.has(ctor));
      globData.set(ctor, data);
    }

    const locDataSize = ser.readInt();
    const locData = ent.locData = new Map();

    for(let i = 0; i !== locDataSize; i++){
      const trait = yield [[Trait, 'deserm'], ser];
      const data = yield [[trait, 'deserEntLocData'], ser];

      assert(!locData.has(trait));
      locData.set(trait, data);
    }

    const traits = ent.traits = yield [[ser, 'readCtorsMap'], Trait];

    for(const trait of traits.vals)
      trait.ent = ent;

    return ent;
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
  new(tile, src, direct=0, strong=0){
    super.new(tile);

    this.createTrait(Trait.Meta);
    this.createTrait(Trait.NavigationTarget, src, direct, strong);
  }
}

class Player extends Entity{
  new(tile){
    super.new(tile);

    this.createTrait(Trait.Player);
    this.createTrait(Trait.Solid);
  }
}

class Wall extends Entity{
  new(tile){
    super.new(tile);

    this.createTrait(Trait.Wall);
    this.createTrait(Trait.Solid);
  }
}

class Box extends Entity{
  new(tile, heavy=0){
    super.new(tile);

    this.createTrait(Trait.Box);
    this.createTrait(Trait.Solid);
    this.createTrait(Trait.Pushable);

    if(heavy)
      this.createTrait(Trait.Heavy);
  }
}

class Diamond extends Entity{
  new(tile){
    super.new(tile);

    this.createTrait(Trait.Diamond);
    this.createTrait(Trait.Item);
  }
}

class Ground extends Entity{
  new(tile, opts=null){
    super.new(tile);

    this.createTrait(Trait.Ground);

    if(opts !== null){
      if(O.has(opts, 'wire') && opts.wire)
        this.createTrait(Trait.Wire);
    }
  }
}

class Concrete extends Ground{
  new(tile, opts){
    super.new(tile, opts);

    this.createTrait(Trait.Concrete);
  }
}

class WoodenGround extends Ground{
  new(tile, opts){
    super.new(tile, opts);

    this.createTrait(Trait.WoodenGround);
  }
}

class Button extends Entity{
  new(tile, label=null, action=null){
    super.new(tile);

    this.createTrait(Trait.Button, action);

    if(label !== null)
      this.createTrait(Trait.Text, label);
  }
}

class Lock extends Entity{
  new(tile){
    super.new(tile);

    this.createTrait(Trait.Lock);
    this.createTrait(Trait.Solid);
  }
}

class Swap extends Entity{
  new(tile){
    super.new(tile);

    this.createTrait(Trait.Swap);
    this.createTrait(Trait.Solid);
  }
}

class DigitalDoor extends Entity{
  new(tile, open=0){
    super.new(tile);

    this.createTrait(Trait.DigitalDoor, open);

    if(!open)
      this.createTrait(Trait.Solid);
  }
}

class OneWay extends Entity{
  new(tile, dir){
    super.new(tile);

    this.createTrait(Trait.OneWay, dir);
  }
}

class LogicGate extends Entity{
  new(tile){
    super.new(tile);

    this.createTrait(Trait.LogicGate);
  }
}

class Inverter extends LogicGate{
  new(tile, dir){
    super.new(tile);

    this.createTrait(Trait.Inverter, dir);
  }
}

class Disjunction extends LogicGate{
  new(tile, dir){
    super.new(tile);

    this.createTrait(Trait.Disjunction, dir);
  }
}

class Conjunction extends LogicGate{
  new(tile, dir){
    super.new(tile);

    this.createTrait(Trait.Conjunction, dir);
  }
}

class Water extends Entity{
  new(tile, dir){
    super.new(tile);

    this.createTrait(Trait.Water);
    this.createTrait(Trait.Liquid);
  }
}

module.exports = Object.assign(Entity, {
  NavigationTarget,
  Player,
  Wall,
  Box,
  Diamond,
  Ground,
  Concrete,
  WoodenGround,
  Button,
  Lock,
  Swap,
  DigitalDoor,
  OneWay,
  LogicGate,
  Inverter,
  Disjunction,
  Conjunction,
  Water,
});

const Trait = require('./trait');