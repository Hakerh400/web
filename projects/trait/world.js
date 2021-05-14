'use strict';

const assert = require('assert');
const Request = require('./request');
const Tile = require('./tile');
const Entity = require('./entity');
const Trait = require('./trait');
const CtorMap = require('./ctor-map');

const {handlersArr, handlersMap} = Trait;
const {reqsArr} = Request;

class World{
  activeTraits = new Set();
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

  addActiveTrait(trait){
    const {activeTraits} = this;
    assert(!activeTraits.has(trait));
    activeTraits.add(trait);
  }

  removeActiveEnt(trait){
    const {activeTraits} = this;
    assert(activeTraits.has(trait));
    activeTraits.delete(trait);
  }

  markTileAsNotified(tile){
    this.notifiedTiles.add(tile);
  }

  tick(){
    const {notifiedTiles, reqs} = this;

    this.#tickId = O.obj();

    for(const trait of this.activeTraits){
      assert(trait.valid);
      trait.tile.notify();
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

  reqCreateEntAtPos(pos, entCtor, ...args){
    const tile = this.getTile(pos);
    this.reqs.add(new Request.CreateEntity(this, tile, entCtor, args));
  }

  reqMoveEnt(ent, tileNew){
    this.reqs.add(new Request.MoveEntity(this, ent, ent.tile, tileNew));
  }

  reqRemoveEnt(ent){
    this.reqs.add(new Request.RemoveEntity(this, ent, ent));
  }
}

module.exports = World;