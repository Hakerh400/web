'use strict';

const assert = require('assert');

class Ball{
  constructor(traj, index, type, marked=0, markedRight=0){
    this.traj = traj;
    this.index = index;
    this.type = type;
    this.marked = marked;
    this.markedRight = markedRight;
  }

  get xy(){
    assert(this.isIn);
    return this.traj.ps[this.index];
  }

  get adjs(){
    if(!this.isIn)
      return [null, null];
    
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

  touches(ball, rec=1){
    if(!this.isIn) return 0;
    if(!ball.isIn) return 0;

    const {index} = ball;
    const [iprev, inext] = this.adjs;

    if(index === iprev) return 1;
    if(index === inext) return 1;

    if(!rec) return 0;
    return ball.touches(this, 0);
  }

  collides(ball, rec=1){
    if(!this.isIn) return 0;
    if(!ball.isIn) return 0;

    const {index} = ball;
    const [iprev, inext] = this.adjs;

    let b = 1;
    if(iprev !== null && index < iprev) b = 0;
    if(inext !== null && index > inext) b = 0;

    if(b) return 1;
    if(!rec) return 0;
    return ball.collides(this, 0);
  }
}

module.exports = Ball;