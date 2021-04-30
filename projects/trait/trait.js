'use strict';

const assert = require('assert');
const WorldElement = require('./world-elem');

class Trait extends WorldElement{
  ent = null;

  get tile(){
    assert(this.ent !== null);
    return this.ent.tile;
  }

  setEnt(ent){
    if(ent !== null){
      assert(this.ent === null);
      this.ent = ent;
      return;
    }

    assert(this.ent !== null);
    this.ent = null;
  }
}

module.exports = Object.assign(Trait, {});