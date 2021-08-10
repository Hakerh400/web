'use strict';

const assert = require('assert');

class Grid{
  tiles = new Set();
  unsolvedNum = 0;

  constructor(csp=null){
    this.csp = csp;
  }

  addTile(tile){
    this.tiles.add(tile);

    if(!tile.isSolved)
      this.unsolvedNum++;
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