'use strict';

const assert = require('assert');
const Tile = require('./tile');
const TraitMap = require('./trait-map');

class World{
  activeEnts = new TraitMap(0);

  evts = {
    nav: null,
  };

  constructor(w, h){
    this.w = w;
    this.h = h;

    this.grid = new O.Grid(w, h, (x, y) => {
      return new Tile(this, [x, y]);
    });
  }

  getTile(pos){
    const [x, y] = pos;
    return this.grid.get(x, y);
  }

  updateEnt(ent){
    this.activeEnts.addEnt(ent);
  }

  tick(){
    
  }
}

module.exports = World;