'use strict';

const assert = require('assert');
const Tile = require('../../tile');

class Square extends Tile.NumberSquare{
  initVals(){
    const {grid} = this;
    return new Set(O.ca(grid.size, i => i + 1));
  }
}

class Line extends Tile.SimpleLine{}

module.exports = {
  Square,
  Line,
};