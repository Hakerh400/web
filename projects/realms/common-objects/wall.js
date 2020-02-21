'use strict';

const Object = require('../object');

class Wall extends Object{
  static layer = 6;
  static traits = this.initTraits(['occupying', 'wall']);
}

module.exports = Wall;