'use strict';

const assert = require('assert');
const TileBase = require('./tile-base');

class Tile extends TileBase{
  constructor(grid, x, y, n=null){
    super(grid, x, y);
    this.n = n;
  }

  render(g){
    const {n} = this;

    g.fillStyle = 'white';
    g.fillRect(0, 0, 1, 1);

    if(n !== null){
      g.fillStyle = 'black';
      g.fillText(n, .5, .5);
    }
  }
}

module.exports = Tile;