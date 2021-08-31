'use strict';

const assert = require('assert');

class State{
  static emptyCol = null;

  constructor(col){
    this.col = col;
    this.tiles = new Set();
  }

  addTile(tile){
    this.tiles.add(tile);
  }

  removeTile(tile){
    this.tiles.delete(tile);
  }

  render(g){
    for(const d of this.tiles){
      const {x, y} = d;

      g.save();
      g.translate(x, y);
      d.renderLines(g);
      g.restore();
    }
  }
}

module.exports = State;