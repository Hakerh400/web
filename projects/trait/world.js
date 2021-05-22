'use strict';

const assert = require('assert');
const Request = require('./request');
const Tile = require('./tile');
const Entity = require('./entity');
const Trait = require('./trait');
const CtorMap = require('./ctor-map');
const inspect = require('./inspect');

const {handlersArr, handlersMap} = Trait;
const {reqsArr} = Request;

const reqCtorsNum = reqsArr.length;

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
    const {notifiedTiles, executedTraits, reqs} = this;

    // O.logb();
    this.#tickId = O.obj();

    for(const trait of this.activeTraits){
      assert(trait.valid);
      trait.tile.notify();
    }

    for(const [traitCtor, handler] of handlersArr){
      const traitsExecNum = new Map();

      do{
        // if(reqs.nempty){
        //   log(...reqs.vals);
        //   log();
        // }

        for(let pri = 0; pri !== reqCtorsNum;){
          this.baseReqPri = pri + 1;

          const reqCtor = reqsArr[pri];
          const reqsSet = reqs.get(reqCtor);

          reqs.map.delete(reqCtor);

          if(reqsSet.size !== 0)
            reqCtor.exec(reqsSet);

          if(this.baseReqPri <= pri){
            pri = this.baseReqPri;
            continue;
          }

          pri++;
        }

        // reqs.clear();
        
        for(const tile of notifiedTiles){
          for(const trait of tile.traits.get(traitCtor)){
            if(!traitsExecNum.has(trait))
              traitsExecNum.set(trait, 0);

            const n = traitsExecNum.get(trait);
            handler.call(trait, n);

            traitsExecNum.set(trait, n + 1);
          }
        }
      }while(reqs.nempty);
    }

    notifiedTiles.clear();

    this.#tickId = null;
  }

  addReq(req){
    this.reqs.add(req);

    if(req.pri < this.baseReqPri)
      this.baseReqPri = req.pri;
  }

  reqModifyEntGlobData(ent, traitCtor, action){
    this.addReq(new Request.ModifyEntGlobData(this, ent, traitCtor, action));
  }

  reqCreateEnt(tile, entCtor, ...args){
    this.addReq(new Request.CreateEntity(this, tile, entCtor, args));
  }

  reqCreateEntAtPos(pos, entCtor, ...args){
    const tile = this.getTile(pos);
    this.addReq(new Request.CreateEntity(this, tile, entCtor, args));
  }

  reqMoveEnt(ent, tileNew){
    this.addReq(new Request.MoveEntity(this, ent, ent.tile, tileNew));
  }

  reqRemoveEnt(ent){
    this.addReq(new Request.RemoveEntity(this, ent, ent));
  }
}

module.exports = World;