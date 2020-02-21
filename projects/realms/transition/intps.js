'use strict';

const intps = {
  LINEAR: k => k,
  DISCRETE: k => 0,
  INSTANT: k => 1,
};

module.exports = intps;