'use strict';

const Grid = require('./grid');
const SquareGrid = require('./square-grid');
const HexagonalGrid = require('./hexagonal-grid');

module.exports = Object.assign(Grid, {
  SquareGrid,
  HexagonalGrid,
});