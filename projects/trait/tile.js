'use strict';

class Tile{
  ents = new Set();

  get entsNum(){
    return this.ents.size;
  }

  get traits(){
    return this.getTraitsGen();
  }

  *getTraitsGen(){
    const traits = new Set();

    for(const ent of this.ents)
      for(const trait of ent.traits)
        yield trait;
  }

  getTraitsSet(){
    return [...this.traits];
  }

  getTraitsObj(){
    const obj = O.obj();

    for(const trait of this.traits)
      obj[trait] = -~obj[trait];

    return obj;
  }
}

module.exports = Tile;