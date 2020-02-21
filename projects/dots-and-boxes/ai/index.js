'use strict';

const AI = require('./ai');
const AIBeginner = require('./beginner');
const AIAdvanced = require('./advanced');
const AIPro = require('./pro');

module.exports = Object.assign(AI, {
  AIBeginner,
  AIAdvanced,
  AIPro,
});