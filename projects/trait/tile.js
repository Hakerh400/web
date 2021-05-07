'use strict';

const assert = require('assert');
const Event = require('./event');

class Tile{
  handlers = {
    entEnter: O.obj(),
  };

  ents = new Set();
  traits = O.obj();
  entsNum = 0;

  constructor(world, coords){
    this.world = world;
    this.coords = coords;
  }

  get valid(){ this.world !== null; }

  render(g){
    for(const ent of this.ents)
      ent.render(g);
  }

  createEnt(ctor, ...args){
    const ent = new ctor(this, ...args);
    this.addEnt(ent);
    return ent;
  }

  addEnt(ent){
    assert(ent.traits.size !== 0);
    assert(!this.ents.has(ent));

    const {world, handlers} = this;
    const {entEnter} = handlers;

    let evt = null;

    const getEvt = () => {
      if(evt === null)
        evt = {ent};

      return evt;
    };

    this.ents.add(ent);

    for(const trait of ent.traits){
      const {name} = trait;

      if(O.has(entEnter, name))
        for(const handler of entEnter[name])
          world.addEvt(new Event(handler, getEvt()));

      this.addTrait(trait);
    }

    this.entsNum++;
    
    ent.tile = this;
  }

  removeEnt(ent){
    assert(this.ents.has(ent));

    this.ents.delete(ent);
    this.entsNum--;

    for(const trait of ent.traits)
      this.removeTrait(trait);

    ent.tile = null;
  }

  addTrait(trait){
    assert(trait instanceof Trait);

    const {name} = trait;
    const {traits} = this;

    if(!O.has(traits, name))
      traits[name] = new Set();

    const set = traits[name];
    assert(!set.has(trait));

    set.add(trait);
    // this.world.addTraitToTile(this, trait);
  }

  removeTrait(trait){
    assert(trait instanceof Trait);

    const {name} = trait;
    const {traits} = this;

    assert(O.has(traits, name))

    const set = traits[name];
    assert(set.has(trait));

    if(set.size === 1){
      delete traits[name];
    }else{
      set.delete(trait);
    }

    // this.world.addTraitToTile(this, trait);
  }

  nav(dir){
    const [x, y] = this.coords;

    const dx = dir === 3 ? -1 : dir === 1 ? 1 : 0;
    const dy = dir === 0 ? -1 : dir === 2 ? 1 : 0;

    return this.world.getTile([x + dx, y + dy]);
  }

  addEntEnterHandler(traitName, handler){
    const handlers = this.handlers.entEnter;

    if(!O.has(handlers, traitName))
      handlers[traitName] = new Set();

    const handlersSet = handlers[traitName];
    assert(!handlersSet.has(handler));

    handlersSet.add(handler);
  }

  removeEntEnterHandler(traitName, handler){
    const handlers = this.handlers.entEnter;

    if(!O.has(handlers, traitName))
      return;

    const handlersSet = handlers[traitName];
    assert(handlersSet.has(handler));
    
    handlersSet.delete(handler);
  }
}

module.exports = Tile;

const Trait = require('./trait');