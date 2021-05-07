'use strict';

const assert = require('assert');
const kName = require('./kname');

class Request{
  static get [kName](){ O.virtual('kName'); }
  static execBatch(reqs, offset, len){ O.virtual('execBatch'); }

  constructor(world){
    this.world = world;
  }

  get pri(){ return this.constructor.pri; }
}

class CreateEntity extends Request{
  static get [kName](){ return 'createEnt'; }

  static execBatch(reqs, start, end){
    assert(end > start && end <= reqs.length);

    const {world} = reqs[start];

    for(let i = start; i !== end; i++){
      const req = reqs[i];

      new req.entCtor(req.tile, ...req.args);
    }
  }

  constructor(world, tile, entCtor, args){
    super(world);

    this.tile = tile;
    this.entCtor = entCtor;
    this.args = args;
  }
}

class RemoveEntity extends Request{
  static get [kName](){ return 'removeEnt'; }

  static execBatch(reqs, start, end){
    assert(end > start && end <= reqs.length);

    const {world} = reqs[start];

    for(let i = start; i !== end; i++){
      const req = reqs[i];

      req.ent.remove();
    }
  }

  constructor(world, ent){
    super(world);

    this.ent = ent;
  }
}

class MoveEntity extends Request{
  static get [kName](){ return 'moveEnt'; }

  static execBatch(reqs, start, end){
    assert(end > start && end <= reqs.length);

    const {world} = reqs[start];
    const entDestMap = new Map();

    for(let i = start; i !== end; i++){
      const req = reqs[i];
      const {ent, dest} = req;

      if(!entDestMap.has(ent))
        entDestMap.set(ent, new Set());

      entDestMap.get(ent).add(dest);
    }

    for(const [ent, dests] of entDestMap){
      if(dests.size !== 1) continue;
      ent.move(O.fst(dests));
    }
  }

  constructor(world, ent, dest){
    super(world);

    this.ent = ent;
    this.dest = dest;
  }
}

const reqsArr = [
  CreateEntity,
  MoveEntity,
  RemoveEntity,
];

const reqsObj = O.obj();

reqsArr.forEach((ctor, index) => {
  ctor.pri = index;
  reqsObj[ctor[kName]] = ctor;
});

module.exports = Object.assign(Request, {
  reqsArr,
  reqsObj,
});