'use strict';

const assert = require('assert');
const CtorMap = require('./ctor-map');

class Request{
  static exec(reqs){ O.virtual('exec', 1); }

  constructor(world){
    this.world = world;
  }

  get ctor(){ return this.constructor; }
}

class SimpleRequest extends Request{
  static exec(reqs){
    for(const req of reqs)
      req.simpleExec();
  }

  simpleExec(){ O.virtual('SimpleRequest'); }
}

class CreateEntity extends SimpleRequest{
  constructor(world, tile, entCtor, args){
    super(world);

    this.tile = tile;
    this.entCtor = entCtor;
    this.args = args;
  }

  simpleExec(){
    this.tile.createEnt(this.entCtor, ...this.args);
  }
}

class MoveEntity extends Request{
  static exec(reqs){
    const map = new Map();

    for(const req of reqs){
      const {ent, tileFrom, tileTo} = req;
      assert(ent.tile === tileFrom);

      if(!map.has(ent)){
        map.set(ent, tileTo);
        continue;
      }

      if(map.get(ent) === tileTo)
        continue;

      map.set(ent, null);
    }

    for(const [ent, target] of map){
      if(target === null) continue;

      ent.tile.removeEnt(ent);
      ent.tile = target;
      target.addEnt(ent);
    }
  }

  constructor(world, ent, tileFrom, tileTo){
    super(world);

    this.ent = ent;
    this.tileFrom = tileFrom;
    this.tileTo = tileTo;
  }
}

const reqsArr = [
  CreateEntity,
  MoveEntity,
  // RemoveEntty,
];

module.exports = Object.assign(Request, {
  reqsArr,

  CreateEntity,
  MoveEntity,
});