'use strict';

const assert = require('assert');

class Request{
  static exec(reqs){ O.virtual('exec', 1); }

  constructor(world){
    this.world = world;
  }
}

class CreateEntity extends Request{
  constructor(world, tile, entCtor){
    super(world);
    this.tile = tile;
    this.entCtor = entCtor;
  }
}

module.exports = Object.assign(Request, {
  CreateEntity,
});