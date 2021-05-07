'use strict';

const assert = require('assert');

class Tile{
  handlers = {
    entEnter: O.obj(),
  };

  ents = new Set();
  traits = new Map();
  entsNum = 0;

  constructor(world, coords){
    this.world = world;
    this.coords = coords;
  }

  render(g){
    for(const ent of this.ents)
      ent.render(g);
  }

  addEnt(ent){
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
      if(O.has(entEnter, trait))
        for(const handler of entEnter[trait])
          world.addEvt(handler, getEvt());

      this.addTrait(trait);
    }

    this.entsNum++;
    
    ent.tile = this;
  }

  removeEnt(ent){
    assert(this.ents.has(ent));

    this.ents.delete(ent);
    this.entsNum--;

    ent.tile = null;
  }

  addTrait(trait){
    const num = this.traits.get(trait) | 0;

    this.traits.set(num + 1);
    this.world.addTraitToTile(this, trait);
  }

  removeTrait(trait){
    const num = this.traits.get(trait) | 0;
    assert(num !== 0);

    if(num === 1) this.traits.delete(trait);
    else this.traits.set(num - 1);

    this.world.removeTraitFromTile(this, trait);
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