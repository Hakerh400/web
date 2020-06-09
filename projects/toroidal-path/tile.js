'use strict';

class Tile{
  constructor(wall=0, dirs=0, locked=0){
    this.wall = wall;
    this.dirs = dirs;
    this.locked = locked;
  }

  toggleLock(){
    if(this.wall) return;
    this.locked ^= 1;
  }
};

module.exports = Tile;