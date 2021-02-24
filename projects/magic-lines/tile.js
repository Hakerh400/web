'use strict';

class Tile{
  constructor(x, y, item=null, big=null){
    this.x = x;
    this.y = y;
    this.item = item;
    this.big = big;
  }

  get isEmpty(){ return this.item === null; }
}

module.exports = Tile;