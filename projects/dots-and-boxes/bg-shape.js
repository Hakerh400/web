'use strict';

class BGShape{
  constructor(t, x, y, r, verts, dir, rot, speed, rotSpeed){
    this.t = t;
    this.x = x;
    this.y = y;
    this.r = r;
    this.verts = verts;
    this.dir = dir;
    this.rot = rot;
    this.speed = speed;
    this.rotSpeed = rotSpeed;
  }
}

module.exports = BGShape;