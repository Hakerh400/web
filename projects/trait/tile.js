'use strict';

const assert = require('assert');
const Entity = require('./entity');
const Trait = require('./trait');
const CtorMap = require('./ctor-map');
const inspect = require('./inspect');
const info = require('./info');

const {
  BasicInfo,
  DetailedInfo,
} = info;

class Tile extends inspect.Inspectable{
  traits = new CtorMap();
  entsSet = new Set();

  constructor(world, pos){
    super();
    
    this.world = world;
    this.pos = pos;
  }

  get valid(){ return this.world !== null; }

  render(g){
    const ents = [...this.entsSet].sort((e1, e2) => {
      const layer1 = e1.layer;
      const layer2 = e2.layer;

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

    // if(this.entsSet.size === 3)
    //   assert.fail();

    this.traits.addEnt(ent);
    this.entsSet.add(ent);
    this.notify();
  }

  removeEnt(ent){
    assert(ent instanceof Entity);
    assert(ent.tile === this);

    this.traits.removeEnt(ent);
    this.entsSet.delete(ent);
    this.notify();
  }

  adj(dir){
    let [x, y] = this.pos;

    if(dir === 0) y--;
    else if(dir === 1) x++;
    else if(dir === 2) y++;
    else if(dir === 3) x--;
    else assert.fail();

    return this.world.getTile([x, y]);
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

  notify(){
    const {world} = this;

    world.markTileAsNotified(this);

    this.iterAdj(adj => {
      world.markTileAsNotified(adj);
    });
  }

  *inspect(){
    return new DetailedInfo('tile :: Tile', [
      new DetailedInfo('pos :: Position', [
        new BasicInfo(`x = ${this.pos[0]} :: Int`),
        new BasicInfo(`y = ${this.pos[1]} :: Int`),
      ]),
      new DetailedInfo('ents :: Set Entity', yield [O.mapr, this.entsSet, function*(ent){
        return O.tco([ent, 'inspect']);
      }]),
    ]);
  }
}

module.exports = Tile;