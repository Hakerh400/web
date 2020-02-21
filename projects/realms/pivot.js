'use strict';

class Pivot{
  #coords = [0, 0];

  constructor(tiles=[]){
    this.tiles = tiles;
  }

  get len(){
    return this.tiles.length;
  }

  clear(){
    this.tiles.length = 0;
  }

  addTile(tile){
    this.tiles.push(tile);
  }

  getCoords(cs){
    const {tiles} = this;
    const len = tiles.length;
    const coords = this.#coords;

    if(len === 0){
      coords[0] = coords[1] = 0;
      return coords;
    }

    let xx = 0, yy = 0;

    for(let i = 0; i !== len; i++){
      const [x, y] = cs(tiles[i]);

      xx += x;
      yy += y;
    }

    coords[0] = xx / len;
    coords[1] = yy / len;

    return coords;
  }
}

module.exports = Pivot;