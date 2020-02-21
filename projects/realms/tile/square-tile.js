'use strict';

const Tile = require('./tile');

class SquareTile extends Tile{
  constructor(grid, x, y){
    super(grid);

    this.x = x;
    this.y = y;

    this.pool = grid.pool;
  }

  get adjsNum(){ return 4; }

  border(g){
    g.rect(-.5, -.5, 1, 1);
  }

  gen(dir){
    let {x, y} = this;

    switch(dir){
      case 0: y--; break;
      case 1: x++; break;
      case 2: y++; break;
      case 3: x--; break;
    }

    return this.grid.gen(x, y);
  }
}

module.exports = SquareTile;