'use strict';

const Tile = require('./tile');

const offsetX = Math.sqrt(3) / 4 + .05;
const offsetY = .35;

class HexagonalTile extends Tile{
  constructor(grid, x, y){
    super(grid);

    this.x = x;
    this.y = y;

    this.pool = grid.pool;
  }

  get adjsNum(){ return 6; }

  border(g){
    g.moveTo(0, -.6);
    g.lineTo(offsetX, -offsetY);
    g.lineTo(offsetX, offsetY);
    g.lineTo(0, .6);
    g.lineTo(-offsetX, offsetY);
    g.lineTo(-offsetX, -offsetY);
    g.closePath();
  }

  gen(dir){
    let {x, y} = this;
    const odd = y & 1;

    switch(dir){
      case 0: y--; if(odd) x++; break;
      case 1: x++; break;
      case 2: y++; if(odd) x++; break;
      case 3: y++; if(!odd) x--; break;
      case 4: x--; break;
      case 5: y--; if(!odd) x--; break;
    }

    return this.grid.gen(x, y);
  }
}

module.exports = HexagonalTile;