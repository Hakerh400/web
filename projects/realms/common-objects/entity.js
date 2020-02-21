'use strict';

const Object = require('../object');

class Entity extends Object{
  static layer = 5;
  static traits = this.initTraits(['occupying', 'entity']);
}

module.exports = Entity;