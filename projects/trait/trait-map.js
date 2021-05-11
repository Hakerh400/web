'use strict';

const assert = require('assert');

class TraitMap extends O.MapSet{
  constructor(strict=1){
    super(null, strict);
  }

  addTrait(trait){
    super.add(trait.ctor, trait);
  }

  addEnt(ent){
    for(const trait of ent.traits.vals)
      this.addTrait(trait);
  }
}

module.exports = TraitMap;