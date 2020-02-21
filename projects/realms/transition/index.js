'use strict';

const Transition = require('./transition');
const Translation = require('./translation');
const Rotation = require('./rotation');
const Scale = require('./scale');
const intps = require('./intps');

module.exports = Object.assign(Transition, {
  Translation,
  Rotation,
  Scale,

  intps,
});