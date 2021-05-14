'use strict';

const assert = require('assert');
const Entity = require('./entity');
const Trait = require('./trait');
const CtorMap = require('./ctor-map');

class Tile{
  traits = new CtorMap();
  entsSet = new Set();

  constructor(world, pos){
    this.world = world;
    this.pos = pos;
  }

  get valid(){ return this.world !== null; }

  render(g){
    for(const ent of this.entsSet)
      ent.render(g);
  }

  createEnt(ctor, ...args){
    const ent = new ctor(this, ...args);
    this.addEnt(ent);
    return ent;
  }

  addEnt(ent){
    assert(ent instanceof Entity);
    assert(ent.tile === this);

    this.traits.addEnt(ent);
    this.entsSet.add(ent);
    this.notify();
  }

  removeEnt(ent){
    assert(ent instanceof Entity);
    assert(ent.tile === this);

    this.traits.removeEnt(ent);
    this.entsSet.delete(ent);
    this.notify();
  }

  adj(dir){
    let [x, y] = this.pos;

    if(dir === 0) y--;
    else if(dir === 1) x++;
    else if(dir === 2) y++;
    else if(dir === 3) x--;
    else assert.fail();

    return this.world.getTile([x, y]);
  }

  iterAdj(func){
    for(let dir = 0; dir !== 4; dir++){
      const adj = this.adj(dir);
      if(adj === null) continue;

      func(adj, dir);
    }
  }

  notify(){
    const {world} = this;

    world.markTileAsNotified(this);

    this.iterAdj(adj => {
      world.markTileAsNotified(adj);
    });
  }
}

module.exports = Tile;