'use strict';

const assert = require('assert');

const {min, max} = Math;

class State{
  static emptyCol = null;

  baseTile = null;

  constructor(col, player=0){
    this.col = col;
    this.player = player;

    this.tiles = new Set();
  }

  addTile(tile){
    this.tiles.add(tile);
  }

  removeTile(tile){
    this.tiles.delete(tile);
  }

  setBaseTile(tile){
    assert(this.baseTile === null);
    this.baseTile = tile;
  }

  retainTiles(){
    const {tiles, baseTile} = this;

    assert(baseTile !== null);
    const {grid, x, y} = baseTile;
    const tilesNew = new Set([baseTile]);

    grid.iterAdj(x, y, (x, y, d) => {
      if(d.state !== this) return 0;

      tilesNew.add(d);
      return 1;
    });

    for(const tile of tiles)
      if(!tilesNew.has(tile))
        tile.unprivatize();

    this.baseTile = null;
  }

  randMove(){
    const {massTh} = Tile;
    const {tiles} = this;
    const tile = O.randElem([...tiles]);
    const {grid, x, y, mass} = tile;

    this.setBaseTile(tile);

    if(mass === 0 || (mass !== massTh && O.rand(2))){
      tile.incMass();
      return;
    }

    const adjs = [];

    grid.adj(x, y, (x, y, d) => {
      if(d === null) return;
      if(d.state === this && d.mass === massTh) return;

      adjs.push(d);
    });

    if(adjs.length === 0) return;

    const d1 = O.randElem(adjs);

    const massMax = min(mass,
      d1.state === this ?
        massTh - d1.mass :
        mass);

    tile.moveMass(d1, O.rand(1, massMax));
  }

  render(g){
    for(const d of this.tiles){
      const {x, y} = d;

      g.save();
      g.translate(x, y);
      d.renderLines(g, 0);
      g.restore();
    }
  }
}

module.exports = State;

const Tile = require('./tile');