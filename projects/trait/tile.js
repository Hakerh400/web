'use strict';

const assert = require('assert');
const TraitMap = require('./trait-map');

class Tile{
  ents = new TraitMap();
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
    this.ents.addEnt(ent);
    this.entsSet.add(ent);
  }

  nav(dir){
    let [x, y] = this.pos;

    if(dir === 0) y--;
    else if(dir === 1) x++;
    else if(dir === 2) y++;
    else if(dir === 3) x--;
    else assert.fail();

    return this.world.getTile([x, y]);
  }
}

module.exports = Tile;