'use strict';

const assert = require('assert');

class TraitMap extends O.MapSet{
  constructor(strict=1){
    super(null, strict);
  }

  addEnt(ent){
    for(const traitCtor of ent.traits.keys)
      super.add(traitCtor, ent);
  }

  addTrait(trait){
    super.add(trait.ctor, trait);
  }
}

module.exports = TraitMap;