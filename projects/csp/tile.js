'use strict';

class Tile{
  constructor(grid, x, y){
    this.grid = grid;
    this.x = x;
    this.y = y;
  }

  render(g){ O.virtual('render'); }
}

module.exports = Tile;