'use strict';

class Transition{
  size1 = 1;
  size2 = 1;
  alpha1 = 1;
  alpha2 = 1;

  constructor(tile, type, x1, y1, x2, y2, start, duration){
    this.grid = tile.grid;
    this.tile = tile;

    this.type = type;

    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;

    this.start = start;
    this.duration = duration;
  }

  remove(){
    this.tile.removeTransition();
  }
}

module.exports = Transition;