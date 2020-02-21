'use strict';

const RealmGenerator = require('./realm-generator');
const realms = require('./realms');

class WorldGenerator{
  constructor(grid, func){
    this.grid = grid;
    this.func = func;

    this.gens = new Map();
    this.cache = new Map();
    this.activeGen = null;

    this.onGenBound = this.onGen.bind(this);
    grid.on('gen', this.onGenBound);
  }

  onGen(tile){
    const {activeGen, cache} = this;

    const gen = this.getGenFromTile(tile);
    if(gen === null || gen === activeGen){
      // cache.delete(tile);
      return;
    }

    if(activeGen === null){
      this.activeGen = gen;
      gen.gen(tile);
      this.activeGen = null;
      // cache.delete(tile);
      return;
    }

    tile.remove();
  }

  getGenFromTile(tile){
    const {cache} = this;
    if(cache.has(tile)) return cache.get(tile);

    let gen = this.func(tile);
    if(gen !== null){
      const [realm, key] = gen;
      gen = this.getGen(realms[realm], key);
    }

    cache.set(tile, gen);
    return gen;
  }

  hasGen(realm, key){
    const {gens} = this;
    return gens.has(realm) && gens.get(realm).has(key);
  }

  createGen(realm, key){
    const {gens} = this;
    const gen = realm.createGen(this, key);

    if(!gens.has(realm)) gens.set(realm, new Map());
    gens.get(realm).set(key, gen);

    return gen;
  }

  getGen(realm, key){
    const {gens} = this;
    if(this.hasGen(realm, key)) return gens.get(realm).get(key);
    return this.createGen(realm, key);
  }

  getGenRaw(realm, key){
    const {gens} = this;
    if(this.hasGen(realm, key)) return gens.get(realm).get(key);
    return null;
  }

  dispose(){
    this.grid.removeListener('gen', this.onGenBound);
  }
}

module.exports = WorldGenerator;