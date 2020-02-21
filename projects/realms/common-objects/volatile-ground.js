'use strict';

const Object = require('../object');
const Ground = require('./ground');

class VolatileGround extends Ground{
  static traits = this.initTraits(['volatile']);
  static listenersL = this.initListenersL(['update']);

  update(evt){
    if(this.tile.has.heavy){
      this.collapse();
      return 1;
    }

    return 0;
  }
}

module.exports = VolatileGround;