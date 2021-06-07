'use strict';

const assert = require('assert');
const Position = require('./position');
const CtorsMap = require('./ctors-map');
const Inspectable = require('./inspectable');
const info = require('./info');
const Serializable = require('./serializable');
const ctorsPri = require('./ctors-pri');

const {
  BasicInfo,
  DetailedInfo,
} = info;

class Tile extends Inspectable{
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

  get valid(){
    return (
      this.grid !== null &&
      this.room !== null &&
      this.world !== null
    );
  }
  
  get room(){ return this.grid.room; }
  get world(){ return this.grid.world; }

  get adjs(){ O.virtual('adjs'); }
  iter(){ O.virtual('iter'); }

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

  hasTrait(traitCtor){
    return this.traits.hasKey(traitCtor);
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

    for(const trait of ent.traits.vals)
      this.addTrait(trait);

    this.ents.add(ent);
    this.notify();
  }

  removeEnt(ent){
    assert(ent instanceof Entity);
    assert(ent.tile === this);

    for(const trait of ent.traits.vals)
      this.removeTrait(trait);

    this.ents.delete(ent);
    this.notify();
  }

  addTrait(trait){
    super.addTrait(trait);
    this.grid.addTrait(trait);
  }

  removeTrait(trait){
    super.removeTrait(trait);
    this.grid.removeTrait(trait);
  }

  notify(delay){
    const {room, grid} = this;
    if(grid.buildMode) return;

    room.markTileAsNotified(this, delay);

    for(const [adj] of this.adjs)
      room.markTileAsNotified(adj, delay);
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

      for(const trait of ent.traits.vals)
        traits.add(trait);
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

  isAdj(adj){
    return this.adj2dir(adj) !== null;
  }

  adj2dir(adj){
    for(let dir = 0; dir !== 4; dir++)
      if(this.adj(dir) === adj)
        return dir;

    return null;
  }

  get adjs(){
    const tile = this;

    return function*(){
      for(let dir = 0; dir !== 4; dir++){
        const adj = tile.adj(dir);
        if(adj === null) continue;

        yield [adj, dir];
      }
    }();
  }

  iter(func){
    const queue = [this];
    const seen = new Set(queue);

    while(queue.length !== 0){
      const tile = queue.shift();
      const result = func(tile);

      if(result === 1) break;
      if(result === 0) continue;

      assert(result === null);

      for(const [adj] of tile.adjs){
        if(seen.has(adj)) continue;

        queue.push(adj);
        seen.add(adj);
      }
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

const Entity = require('./entity');
const Trait = require('./trait');