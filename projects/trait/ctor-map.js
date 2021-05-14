'use strict';

const assert = require('assert');

class CtorMap extends O.SetMap{
  constructor(strict=1){
    super(null, strict);
  }

  add(obj){
    super.add(obj.constructor, obj);
  }

  remove(obj){
    super.remove(obj.constructor, obj);
  }

  addTrait(trait){
    this.add(trait);
  }

  removeTrait(trait){
    this.remove(trait);
  }

  addEnt(ent){
    for(const trait of ent.traits.vals)
      this.addTrait(trait);
  }

  removeEnt(ent){
    for(const trait of ent.traits.vals)
      this.removeTrait(trait);
  }
}

module.exports = CtorMap;