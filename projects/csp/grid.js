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

  getTile(tile){
    if(tile === null) return null;

    const {relsTemp} = this.csp;
    if(relsTemp === null) return tile;
    
    relsTemp.add(tile);
    return tile;
  }

  render(g){ O.virtual('render'); }
}

module.exports = Grid;