'use strict';

const assert = require('assert');

class TileBase{
  constructor(grid, x, y){
    this.grid = grid;
    this.x = x;
    this.y = y;
  }

  render(g){ O.virtual('render'); }
}

module.exports = TileBase;