'use strict';

const AI = require('./ai');
const Node = require('./node');

class AIBeginner extends AI{
  play(){
    const {grid, player, depth} = this;

    const lines4 = grid.getLines(4);
    if(lines4.length !== 0) return grid.setLine(...O.randElem(lines4));

    const lines = grid.getLines();
    return grid.setLine(...O.randElem(lines));
  }
}

module.exports = AIBeginner;