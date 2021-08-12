'use strict';

const assert = require('assert');

class Grid{
  tiles = new Set();
  unsolvedNum = 0;

  err = null;
  errTiles = new Set();

  constructor(csp=null){
    this.csp = csp;
  }

  addTile(tile){
    this.tiles.add(tile);

    if(!tile.isSolved)
      this.unsolvedNum++;
  }

  getTile(tile){
    if(tile === null) return null;

    const {relsTemp} = this.csp;
    if(relsTemp === null) return tile;
    
    relsTemp.add(tile);
    return tile;
  }

  render(g){ O.virtual('render'); }

  addErrTile(tile){
    const {errTiles} = this;

    assert(!errTiles.has(tile));
    errTiles.add(tile);
  }

  removeErrTile(tile){
    const {errTiles} = this;

    assert(errTiles.has(tile));
    errTiles.delete(tile);
  }

  shuffle(){
    const tiles = this.tiles = O.shuffleSet(this.tiles);

    for(const tile of tiles)
      tile.shuffle();
  }

  updateUnsolvedNum(){
    let unsolvedNum = 0;

    for(const tile of this.tiles)
      if(!tile.isSolved)
        unsolvedNum++;

    this.unsolvedNum = unsolvedNum;
  }
}

module.exports = Grid;