'use strict';

const assert = require('assert');
const Tile = require('./tile');
const Entity = require('./entity');
const Trait = require('./trait');
const CtorsMap = require('./ctors-map');
const ctorsPri = require('./ctors-pri');

class Request{
  static exec(reqs){ O.virtual('exec', 1); }

  constructor(world){
    this.world = world;
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

  constructor(world, ent, traitCtor, action){
    super(world);

    this.ent = ent;
    this.traitCtor = traitCtor;
    this.action = action;
  }
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

class RemoveEntity extends Request{
  static exec(reqs){
    const removed = new Set();

    for(const req of reqs){
      const {ent} = req;
      if(removed.has(ent)) continue;

      ent.remove();
    }
  }

  constructor(world, ent){
    super(world);
    this.ent = ent;
  }
}

class PushRoom extends Request{
  static exec(reqs){
    if(reqs.size !== 1) O.noimpl();

    const req = O.fst(reqs);
    const {world, ent, gridCtor, gridCtorArgs, builder} = req;

    if(ent !== null)
      ent.createTrait(Trait.Entered);

    world.pushRoom(gridCtor, gridCtorArgs, builder);
  }

  constructor(world, ent, gridCtor, gridCtorArgs, builder){
    super(world);

    if(ent !== null)
      assert(ent instanceof Entity);

    this.ent = ent;
    this.gridCtor = gridCtor;
    this.gridCtorArgs = gridCtorArgs;
    this.builder = builder;
  }
}

class PopRoom extends Request{
  static exec(reqs){
    if(reqs.size !== 1) O.noimpl();

    const req = O.fst(reqs);
    const {world, cb} = req;

    world.popRoom();

    const {grid} = world.selectedRoom;
    const ent = grid.getEnt(Trait.Entered);

    if(ent !== null)
      ent.getTrait(Trait.Entered).remove();

    if(cb !== null)
      cb(grid, ent);
  }

  constructor(world, cb=null){
    super(world);

    this.cb = cb;
  }
}

const ctorsArr = [
  ModifyEntGlobData,
  CreateEntity,
  MoveEntity,
  RemoveEntity,
  PushRoom,
  PopRoom,
];

const ctorsObj = ctorsPri(ctorsArr);

module.exports = Object.assign(Request, {
  ctorsArr,
  ...ctorsObj,
});