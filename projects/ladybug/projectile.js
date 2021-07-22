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

  move(){
    const {dir, speed} = this;

    this.x += cos(dir) * speed;
    this.y += sin(dir) * speed;
  }
}

module.exports = Projectile;