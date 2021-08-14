'use strict';

const assert = require('assert');
const Tile = require('../../tile');

class Square extends Tile.NumberSquare{
  initVals(){
    return new Set(O.ca(2, i => i));
  }
}

class Line extends Tile.SimpleLine{}

module.exports = {
  Square,
  Line,
};