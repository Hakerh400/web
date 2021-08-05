'use strict';

const assert = require('assert');

class Grid{
  tiles = new Set();

  constructor(csp=null){
    this.csp = csp;
  }

  addTile(tile){
    this.tiles.add(tile);
  }
}

module.exports = Grid;