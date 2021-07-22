'use strict';

const assert = require('assert');

class Ball{
  constructor(traj, index, type){
    this.traj = traj;
    this.index = index;
    this.type = type;
  }

  get xy(){
    assert(this.isIn);
    return this.traj.ps[this.index];
  }

  get adjs(){
    assert(this.isIn);
    return this.traj.adjs[this.index];
  }

  get x(){ return this.xy[0]; }
  get y(){ return this.xy[1]; }

  get iprev(){ return this.adjs[0]; }
  get inext(){ return this.adjs[1]; }

  get isIn(){
    const {index} = this;

    if(index === null) return 0;
    if(!this.traj.has(index)) return 0;

    return 1;
  }

  touches(ball){
    const {index} = ball;
    const [iprev, inext] = this.adjs;

    if(index === iprev) return 1;
    if(index === inext) return 1;

    return 0;
  }

  collides(ball){
    const {index} = ball;
    const [iprev, inext] = this.adjs;

    if(iprev !== null && index < iprev) return 0;
    if(inext !== null && index > inext) return 0;

    return 1;
  }
}

module.exports = Ball;