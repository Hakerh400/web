'use strict';

const assert = require('assert');
const Request = require('./request');
const Tile = require('./tile');
const Trait = require('./trait');
const CtorMap = require('./ctor-map');

const {handlersArr, handlersMap} = Trait;
const {reqsArr} = Request;

class World{
  activeEnts = new Map();
  notifiedTiles = new Set();
  reqs = new CtorMap();

  evts = {
    nav: null,
  };

  #tickId = null;

  constructor(w, h){
    this.w = w;
    this.h = h;

    this.grid = new O.Grid(w, h, (x, y) => {
      return new Tile(this, [x, y]);
    });
  }

  get tickId(){ return this.#tickId; }

  getTile(pos){
    const [x, y] = pos;
    return this.grid.get(x, y);
  }

  addActiveEnt(ent){
    const {activeEnts} = this;

    if(!activeEnts.has(ent)){
      activeEnts.set(ent, 1);
      return;
    }

    const n = activeEnts.get(ent);
    assert(n > 0);

    activeEnts.set(ent, n + 1);
  }

  removeActiveEnt(ent){
    const {activeEnts} = this;
    assert(activeEnts.has(ent));

    const n = activeEnts.get(ent);
    assert(n > 0);

    if(n === 1){
      activeEnts.delete(ent);
      return;
    }

    activeEnts.set(ent, n - 1);
  }

  markTileAsNotified(tile){
    this.notifiedTiles.add(tile);
  }

  tick(){
    const {notifiedTiles, reqs} = this;

    this.#tickId = O.obj();

    for(const ent of this.activeEnts.keys()){
      assert(ent.valid);
      ent.tile.notify();
    }

    for(const [traitCtor, handler, once] of handlersArr){
      const executed = once ? new Set() : null;
      
      do{
        for(const reqCtor of reqsArr){
          const reqsSet = reqs.get(reqCtor);
          reqCtor.exec(reqsSet);
        }

        reqs.clear();

        for(const tile of notifiedTiles){
          for(const trait of tile.traits.get(traitCtor)){
            if(once){
              if(executed.has(trait)) continue;
              executed.add(trait);
            }

            handler.call(trait);
          }
        }
      }while(reqs.nempty);
    }

    notifiedTiles.clear();

    this.#tickId = null;
  }

  reqCreateEnt(tile, entCtor, ...args){
    this.reqs.add(new Request.CreateEntity(this, tile, entCtor, args));
  }

  reqMoveEnt(ent, tileNew){
    this.reqs.add(new Request.MoveEntity(this, ent, ent.tile, tileNew));
  }
}

module.exports = World;