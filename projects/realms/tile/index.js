'use strict';

const Tile = require('./tile');
const SquareTile = require('./square-tile');
const HexagonalTile = require('./hexagonal-tile');

module.exports = Object.assign(Tile, {
  SquareTile,
  HexagonalTile,
});