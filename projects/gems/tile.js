'use strict';

const Transition = require('./transition');

class Tile{
  gem = null;
  transitions = [];

  constructor(grid, x, y){
    this.grid = grid;
    this.x = x;
    this.y = y;
  }

  createTransition(from, to, start, end){
    this.addTransition(new Transition(this, from, to, start, end));
  }

  addTransition(transition){
    const {grid, transitions} = this;

    if(transitions.length === 0)
      grid.addTransition(transition);

    transitions.push(transition);
  }

  removeTransition(){
    const {grid, transitions} = this;

    grid.removeTransition(transitions.shift());

    if(transitions.length !== 0)
      grid.addTransition(transitions[0]);
  }
}

module.exports = Tile;