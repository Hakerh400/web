'use strict';

const Tile = require('./tile');
const Transition = require('./transition');

class Grid extends O.Grid{
  transitions = new Set();

  constructor(x, y, func=null){
    super(x, y, (x, y) => null);

    this.iter((x, y) => {
      this.set(x, y, new Tile(this, x, y));
    });

    if(func !== null){
      this.iter((x, y, d) => {
        func(x, y, d);
      });
    }
  }

  match(tile){
    const {w, h} = this;
    const {x, y, gem} = tile;

    const match = new Set();
    const matchHor = new Set();

    for(let x1 = x - 1; x1 !== -1; x1--){
      const d1 = this.get(x1, y);
      if(d1.transitions.length !== 0 || d1.gem !== gem) break;
      matchHor.add(d1);
    }

    for(let x1 = x + 1; x1 !== w; x1++){
      const d1 = this.get(x1, y);
      if(d1.transitions.length !== 0 || d1.gem !== gem) break;
      matchHor.add(d1);
    }

    if(matchHor.size >= 2)
      for(const d of matchHor)
        match.add(d);

    const matchVert = new Set();

    for(let y1 = y - 1; y1 !== -1; y1--){
      const d1 = this.get(x, y1);
      if(d1.transitions.length !== 0 || d1.gem !== gem) break;
      matchVert.add(d1);
    }

    for(let y1 = y + 1; y1 !== h; y1++){
      const d1 = this.get(x, y1);
      if(d1.transitions.length !== 0 || d1.gem !== gem) break;
      matchVert.add(d1);
    }

    if(matchVert.size >= 2)
      for(const d of matchVert)
        match.add(d);

    if(match.size === 0) return null;

    match.add(tile);
    return match;
  }

  addTransition(transition){
    this.transitions.add(transition);
  }

  removeTransition(transition){
    this.transitions.delete(transition);
  }
}

module.exports = Grid;