'use strict';

const Event = require('./event');

class Navigate extends Event{
  constructor(dir, dmax, tile){
    super('navigate', tile);

    this.dir = dir;
    this.dmax = dmax;
  }
}

module.exports = Navigate;