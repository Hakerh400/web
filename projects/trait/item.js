'use strict';

const assert = require('assert');
const CtorsMap = require('./ctors-map');
const Inspectable = require('./inspectable');
const Serializable = require('./serializable');
const info = require('./info');
const layers = require('./layers');
const ctorsPri = require('./ctors-pri');

const {
  BasicInfo,
  DetailedInfo,
} = info;

const {min, max} = Math;
const {pi, pih, pi2} = O;

class Item extends Inspectable{
  static get baseCtor(){ return Item; }

  new(trait){
    super.new();

    this.trait = trait;
    this.deleted = 0;
  }

  get valid(){
    return (
      !this.deleted &&
      this.trait !== null &&
      this.ent !== null &&
      this.tile !== null &&
      this.grid !== null &&
      this.room !== null &&
      this.world !== null
    );
  }

  get ent(){ return this.trait.ent; }
  get pos(){ return this.trait.pos; }
  get tile(){ return this.trait.tile; }
  get grid(){ return this.trait.grid; }
  get room(){ return this.trait.room; }
  get world(){ return this.trait.world; }

  apply(tile, pos){ O.virtual('apply'); }

  delete(){
    const {trait} = this;

    if(trait !== null){
      if(trait.valid){
        trait.item = null;
      }else{
        trait.itemRaw = null;
        this.trait = null;
      }
    }

    this.deleted = 1;
  }

  render(g){}

  *ser(ser){
    assert(this.valid);

    yield [[this, 'serCtor'], ser];
    yield [[this, 'serData'], ser];
  }

  static *deser(ser){
    const ctor = yield [[this, 'deserCtor'], ser];
    const item = ctor.new();

    yield [[item, 'deserData'], ser];

    return item;
  }

  *serData(ser){}
  *deserData(ser){}

  *inspectData(){
    return [];
  }

  *inspect(){
    return new DetailedInfo(`item :: ${this.ctor.name}`, yield [[this, 'inspectData']]);
  }
}

class Hammer extends Item{
  render(g){
    g.fillStyle = 'rgb(179,125,84)';
    g.beginPath();
    g.moveTo(.6, .3);
    g.lineTo(.7, .4);
    g.lineTo(.2, .9);
    g.lineTo(.1, .8);
    g.closePath();
    g.fill();
    g.stroke();

    g.fillStyle = 'rgb(202,204,198)';
    g.beginPath();
    g.moveTo(.6, .3);
    g.lineTo(.675, .215);
    g.lineTo(.55, .09);
    g.lineTo(.7, .09);
    g.lineTo(.95, .34);
    g.lineTo(.875, .415);
    g.lineTo(.785, .325);
    g.lineTo(.71, .4);
    g.closePath();
    g.fill();
    g.stroke();
  }

  apply(tile, pos){
    const {world} = this;

    if(!tile) return;

    const solid = tile.getEnt(Trait.Solid);
    if(!solid) return;

    world.reqRemoveEnt(solid);
    world.reqDeleteItem(this);
  }
}

class Key extends Item{
  render(g){
    g.concaveMode = 1;
    g.fillStyle = 'rgb(240,179,112)';

    const drawExternalLine = () => {
      g.moveTo(.45, .45);
      g.lineTo(.95, .45);
      g.lineTo(.95, .55);
      g.lineTo(.85, .55);
      g.lineTo(.85, .7);
      g.lineTo(.75, .7);
      g.lineTo(.75, .55);
      g.lineTo(.65, .55);
      g.lineTo(.65, .7);
      g.lineTo(.55, .7);
      g.lineTo(.55, .55);
      g.lineTo(.45, .55);
      O.drawArc(g, .45, .55, .45, .45, 7);
    };

    const drawInternalLine = () => {
      g.arc(.28, .5, .1, pi2, 0, 1);
    };

    g.beginPath();
    drawExternalLine();
    drawInternalLine();
    g.fill();

    g.beginPath();
    drawExternalLine();
    g.stroke();

    g.beginPath();
    drawInternalLine();
    g.stroke();

    g.concaveMode = 0;
  }

  apply(tile, pos){
    if(!tile) return;

    const {world} = this;

    const door = tile.getEnt(Trait.LockedDoor);
    if(!door) return;

    world.reqRemoveEnt(door);
    world.reqDeleteItem(this);
  }
}

const ctorsArr = [
  Hammer,
  Key,
];

const ctorsObj = ctorsPri(ctorsArr);

module.exports = Object.assign(Item, {
  ctorsArr,
  ...ctorsObj,
});

const Grid = require('./grid');
const Entity = require('./entity');
const Trait = require('./trait');
const Action = require('./action');