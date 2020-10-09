'use strict';

const Ray = require('./ray');
const Vector = require('./vector');

class Camera extends Ray{
  constructor(x, y, z, rx, ry, rz){
    super(-x, -y, -z, rx, ry, rz);
  }
};

module.exports = Camera;