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

  addTransition(transition){
    this.transitions.add(transition);
  }

  removeTransition(transition){
    this.transitions.delete(transition);
  }
}

module.exports = Grid;