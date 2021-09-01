'use strict';

const assert = require('assert');

const get = n => {
  return O.ca(n, i => {
    return O.Color.from(O.hsv((i + .5) / n)).toString();
  });
};

module.exports = {
  get,
};