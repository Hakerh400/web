'use strict';

const assert = require('assert');
const Position = require('./position');
const Entity = require('./entity');
const Trait = require('./trait');
const CtorsMap = require('./ctors-map');
const inspect = require('./inspect');
const info = require('./info');
const Serializable = require('./serializable');
const ctorsPri = require('./ctors-pri');

const {
  BasicInfo,
  DetailedInfo,
} = info;

class Tile extends inspect.Inspectable{
  static get baseCtor(){ return Tile; }

  init(){
    super.init();

    this.traits = new CtorsMap();
    this.ents = new Set();
  }

  new(grid, pos){
    super.new();
    
    this.grid = grid;
    this.pos = pos;
  }

  get valid(){ return this.grid !== null; }
  get room(){ return this.grid.room; }

  render(g){
    const ents = [...this.ents].sort((e1, e2) => {
      const layer1 = e1.layer;
      const layer2 = e2.layer;

      assert(layer1 !== null);
      assert(layer2 !== null);

      return layer1 - layer2;
    });

    for(const ent of ents)
      ent.render(g);
  }

  createEnt(ctor, ...args){
    const ent = new ctor(this, ...args);
    this.addEnt(ent);
    return ent;
  }

  addEnt(ent){
    assert(ent instanceof Entity);
    assert(ent.tile === this);

    // if(this.ents.size === 3)
    //   assert.fail();

    this.traits.addEnt(ent);
    this.ents.add(ent);
    this.notify();
  }

  removeEnt(ent){
    assert(ent instanceof Entity);
    assert(ent.tile === this);

    this.traits.removeEnt(ent);
    this.ents.delete(ent);
    this.notify();
  }

  notify(){
    const {room} = this;

    room.markTileAsNotified(this);

    this.iterAdj(adj => {
      room.markTileAsNotified(adj);
    });
  }

  *ser(ser){
    yield [[this, 'serCtor'], ser];

    // yield [[this.pos, 'serm'], ser];
    yield [[ser, 'writeSet'], this.ents];
  }

  static *deser(ser){
    const ctor = yield [[this, 'deserCtor'], ser];
    const tile = ctor.new();

    const ents = tile.ents = yield [[ser, 'readSet'], Entity];
    const traits = tile.traits = new CtorsMap();

    for(const ent of ents){
      ent.tile = tile;
      traits.addEnt(ent);
    }

    return tile;
  }

  *inspect(){
    return new DetailedInfo('tile :: Tile', [
      yield [[this.pos, 'inspect']],
      new DetailedInfo('ents :: Set Entity', yield [O.mapr, this.ents, function*(ent){
        return O.tco([ent, 'inspect']);
      }]),
    ]);
  }
}

class Rectangle extends Tile{
  adj(dir){
    let {x, y} = this.pos;

    if(dir === 0) y--;
    else if(dir === 1) x++;
    else if(dir === 2) y++;
    else if(dir === 3) x--;
    else assert.fail();

    return this.room.getTile(new Position.Rectangle(x, y));
  }

  adj2dir(adj){
    for(let dir = 0; dir !== 4; dir++)
      if(this.adj(dir) === adj)
        return dir;

    return null;
  }

  iterAdj(func){
    for(let dir = 0; dir !== 4; dir++){
      const adj = this.adj(dir);
      if(adj === null) continue;

      func(adj, dir);
    }
  }
}

const ctorsArr = [
  Rectangle,
];

const ctorsObj = ctorsPri(ctorsArr);

module.exports = Object.assign(Tile, {
  ctorsArr,
  ...ctorsObj,
});