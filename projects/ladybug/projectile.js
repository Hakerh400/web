'use strict';

const assert = require('assert');

const {sin, cos} = Math;

class Projectile{
  constructor(type, x, y, dir, speed){
    this.type = type;
    this.x = x;
    this.y = y;
    this.dir = dir;
    this.speed = speed;
  }

  move(speed){
    const {dir, speed: sp} = this;

    this.x += cos(dir) * sp * speed;
    this.y += sin(dir) * sp * speed;
  }
}

module.exports = Projectile;