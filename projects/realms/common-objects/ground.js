'use strict';

const Object = require('../object');

class Ground extends Object{
  static layer = 1;
  static traits = this.initTraits(['ground']);

  draw(g, t, k){
    g.beginPath();
    this.tile.border(g);
    g.fill();
  }
}

module.exports = Ground;