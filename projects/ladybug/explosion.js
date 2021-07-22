'use strict';

const assert = require('assert');

const {sin, cos} = Math;

class Explosion{
  constructor(type, x, y, t){
    this.type = type;
    this.x = x;
    this.y = y;
    this.t = t;
  }
}

module.exports = Explosion;