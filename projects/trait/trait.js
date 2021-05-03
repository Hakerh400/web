'use strict';

const assert = require('assert');

class Trait{
  constructor(ent){
    this.ent = ent;
  }

  get world(){ return this.ent.world; }
  get tile(){ return this.ent.tile; }
}

module.exports = Object.assign(Trait, {});