'use strict';

class Transition{
  constructor(tile, from, to, start, end){
    this.grid = tile.grid;
    this.tile = tile;
    this.from = from;
    this.to = to;
    this.start = start;
    this.end = end;

    this.duration = end - start;
  }

  remove(){
    this.tile.removeTransition();
  }
}

module.exports = Transition;