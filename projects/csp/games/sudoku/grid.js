'use strict';

const assert = require('assert');
const GridBase = require('../../grid');
const Tiles = require('./tiles');

class Grid extends GridBase.SLGrid{
  static squareCtor = Tiles.Square;
  static lineCtor = Tiles.Line;

  get size(){ return this.w; }
}

module.exports = Grid;