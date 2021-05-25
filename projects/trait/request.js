'use strict';

const assert = require('assert');
const Tile = require('./tile');
const Entity = require('./entity');
const Trait = require('./trait');
const CtorsMap = require('./ctors-map');

class Request{
  static exec(reqs){ O.virtual('exec', 1); }

  constructor(room){
    this.room = room;
  }

  get ctor(){ return this.constructor; }
  get pri(){ return this.ctor.pri; }
}

class SimpleRequest extends Request{
  static exec(reqs){
    for(const req of reqs)
      req.simpleExec();
  }

  simpleExec(){ O.virtual('simpleExec'); }
}

class ModifyEntGlobData extends Request{
  static exec(reqs){
    // const entTraitDataMap = new Map();
    let m = null;

    for(const req of reqs){
      const {ent, traitCtor, action} = req;
      const [name, info] = action;

      if(m === null) m = name;
      assert(name === m);

      if(name === 'set.insert'){
        let set = ent.getGlobData(traitCtor);

        if(set === null){
          set = new Set();
          ent.setGlobData(traitCtor, set);
        }

        for(const elem of info)
          set.add(elem);

        continue;
      }

      if(m === 'set.remove'){
        let set = ent.getGlobData(traitCtor);

        if(set === null)
          continue;

        for(const elem of info)
          set.delete(elem);

        continue;
      }

      assert.fail();

      // if(!entTraitDataMap.has(ent))
      //   entTraitDataMap.set(ent, new Map());
    }
  }

  constructor(room, ent, traitCtor, action){
    super(room);

    this.ent = ent;
    this.traitCtor = traitCtor;
    this.action = action;
  }
}

class CreateEntity extends SimpleRequest{
  constructor(room, tile, entCtor, args){
    super(room);

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

  constructor(room, ent, tileFrom, tileTo){
    super(room);

    this.ent = ent;
    this.tileFrom = tileFrom;
    this.tileTo = tileTo;
  }
}

class RemoveEntity extends Request{
  static exec(reqs){
    const removed = new Set();

    for(const req of reqs){
      const {ent} = req;
      if(removed.has(ent)) continue;

      ent.remove();
    }
  }

  constructor(room, ent){
    super(room);
    this.ent = ent;
  }
}

const reqsArr = [
  ModifyEntGlobData,
  CreateEntity,
  MoveEntity,
  RemoveEntity,
];

reqsArr.forEach((ctor, pri) => {
  ctor.pri = pri;
});

module.exports = Object.assign(Request, {
  reqsArr,

  ModifyEntGlobData,
  CreateEntity,
  MoveEntity,
  RemoveEntity,
});