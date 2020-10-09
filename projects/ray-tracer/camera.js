'use strict';

const Vector = require('./vector');

class Camera extends Vector{
  constructor(x=0, y=0, z=0, pitch=0, yaw=0, vx=0, vy=0, vz=0){
    super(x, y, z);

    this.pitch = pitch;
    this.yaw = yaw;

    this.vel = new Vector(vx, vy, vz);
  }

  tick(){
    this.add(this.vel.clone().rot_(this.pitch, this.yaw, 0));
  }
};

module.exports = Camera;