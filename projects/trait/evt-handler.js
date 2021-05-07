'use strict';

const assert = require('assert');

class EventHandler{
  constructor(trait, pri, func){
    assert(typeof func === 'function');

    this.trait = trait;
    this.pri = pri;
    this.func = func;
  }

  exec(info){
    this.func.call(this.trait, info);
  }
}

module.exports = EventHandler;