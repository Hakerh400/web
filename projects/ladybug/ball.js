'use strict';

const assert = require('assert');

class Ball{
  constructor(traj, chain, index, next=null){
    this.traj = traj;
    this.chain = chain;
    this.index = index;
    this.next = next;
  }

  get xy(){ return this.traj[this.index]; }
  get x(){ return this.xy[0]; }
  get y(){ return this.xy[1]; }
}