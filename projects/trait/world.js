'use strict';

const assert = require('assert');
const Tile = require('./tile');

class World{
  constructor(w, h){
    this.w = w;
    this.h = h;
    
    this.grid = new O.Grid(w, h, () => new Tile(this));
  }
}

module.exports = World;