'use strict';

class Grid extends O.Map2D{
  get(x, y){
    if(!super.has(x, y))
      return 0;

    return super.get(x, y);
  }
}

module.exports = Grid;