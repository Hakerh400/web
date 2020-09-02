'use strict';

const Tile = require('./tile');

class Grid extends O.Grid{
  get(x, y){
    if(!this.has(x, y)) return null;

    const row = this.d[y];

    if(row[x] !== null) return row[x];
    return row[x] = new Tile();
  }
}

module.exports = Grid;