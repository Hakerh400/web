'use strict';

const assert = require('assert');
const Request = require('./request');
const Grid = require('./grid');
const Tile = require('./tile');
const Entity = require('./entity');
const Trait = require('./trait');
const CtorsMap = require('./ctors-map');
const inspect = require('./inspect');
const Serializable = require('./serializable');

const {handlersArr, handlersMap} = Trait;
const {reqsArr} = Request;

const reqCtorsNum = reqsArr.length;

class Room extends Serializable{
  init(){
    super.init();

    this.activeTraits = new Set();
    this.notifiedTiles = new Set();
    this.reqs = new CtorsMap();

    this.evts = {
      nav: null,
    };

    this.tickId = null;
    this.baseReqPri = null;
  }

  new(grid){
    super.new();

    this.grid = grid;
    grid.room = this;
  }

  getTile(pos){
    return this.grid.get(pos);
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
    this.tickId = O.obj();

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

    this.tickId = null;
    this.baseReqPri = null;
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

  *ser(ser){
    assert(this.evts.nav === null);
    assert(this.notifiedTiles.size === 0);
    assert(this.reqs.empty);
    assert(this.tickId === null);
    assert(this.baseReqPri === null);

    yield [[this.grid, 'serm'], ser];
    yield [[ser, 'writeSet'], this.activeTraits, Trait];
  }

  static *deser(ser){
    const room = Room.new();

    const grid = room.grid = yield [[Grid, 'deserm'], ser];
    const activeTraits = room.activeTraits = yield [[ser, 'readSet'], Trait];

    grid.room = room;

    return room;
  }
}

module.exports = Room;