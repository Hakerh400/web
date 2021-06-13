'use strict';

const assert = require('assert');
const Request = require('./request');
const Room = require('./room');
const Tile = require('./tile');
const Entity = require('./entity');
const Trait = require('./trait');
const CtorsMap = require('./ctors-map');
const Serializable = require('./serializable');
const flags = require('./flags');

const {handlersArr, handlersMap} = Trait;
const reqsArr = Request.ctorsArr;

const reqCtorsNum = reqsArr.length;

class World extends Serializable{
  init(){
    super.init();

    this.rooms = new Set();
    this.mainRoom = null;
    this.selectedRoom = null;

    this.reqs = new CtorsMap();
    this.notifiedTiles = new Set();
    this.notifiedTilesDelayed = new Set();
    this.notifiedTraits = new CtorsMap();
    this.detachedItems = new Set();
    this.onReqDoneCbs = [];

    this.tickId = null;
    this.baseReqPri = null;

    this.resetEvts();

    this.notifiedTilesInfo = flags.DisplayNotifiedTiles ? new Set() : null;
  }

  resetEvts(){
    this.evts = {
      nav: null,
      lmb: null,
      rmb: null,
      restart: 0,
      exit: 0,
      pickOrDropItem: 0,
      applyItem: 0,
    };
  }

  onReqDone(cb){
    this.onReqDoneCbs.push(cb);
  }

  createRoom(gridCtor, gridCtorArgs, builder){
    const {rooms} = this;

    const grid = new gridCtor(...gridCtorArgs);
    const room = new Room(this, grid);

    grid.enterBuildMode();
    builder(grid);
    grid.exitBuildMode();

    rooms.add(room);

    this.mainRoom ??= room;

    return room;
  }

  selectRoom(room){
    assert(room.valid);
    this.selectedRoom = room;
  }

  removeRoom(room){
    const {rooms} = this;

    assert(rooms.has(room));
    assert(room.valid);

    room.remove();
    rooms.delete(room);
  }

  tick(){
    const {
      rooms,
      selectedRoom,
      evts,
      reqs,
      notifiedTiles,
      notifiedTilesDelayed,
      notifiedTraits,
      detachedItems,
      onReqDoneCbs,
    } = this;

    assert(selectedRoom !== null);

    for(const tile of notifiedTilesDelayed)
      notifiedTiles.add(tile);

    notifiedTilesDelayed.clear();

    if(evts.lmb !== null) evts.lmb.notify();
    if(evts.rmb !== null) evts.lmb.notify();

    // O.logb();
    this.tickId = O.obj();

    for(const room of rooms)
      for(const trait of room.activeTraits)
        notifiedTraits.add(trait);

    if(flags.DisplayNotifiedTiles){
      const {notifiedTilesInfo} = this;

      notifiedTilesInfo.clear();

      for(const tile of notifiedTiles)
        notifiedTilesInfo.add(tile);
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
            reqCtor.exec(this, reqsSet);

          if(this.baseReqPri <= pri){
            pri = this.baseReqPri;
            continue;
          }

          pri++;
        }

        for(const item of detachedItems){
          if(item.valid) continue;
          item.delete();
        }

        detachedItems.clear();

        for(const cb of onReqDoneCbs)
          cb();

        onReqDoneCbs.length = 0;

        // reqs.clear();

        const execHandler = trait => {
          if(!trait.valid) return;

          // assert(trait[handler.name] === handler);

          if(!traitsExecNum.has(trait))
            traitsExecNum.set(trait, 0);

          const n = traitsExecNum.get(trait);
          if(n === null) return;

          const result = handler.call(trait, n);

          if(result){
            traitsExecNum.set(trait, null);
            return;
          }

          traitsExecNum.set(trait, n + 1);
        };

        const invalidTiles = new Set();
        
        for(const tile of notifiedTiles){
          if(!tile.valid){
            invalidTiles.add(tile);
            continue;
          }

          for(const trait of tile.traits.get(traitCtor))
            execHandler(trait);
        }

        for(const trait of notifiedTraits.get(traitCtor))
          execHandler(trait);

        for(const tile of invalidTiles)
          notifiedTiles.delete(tile);
      }while(reqs.nempty);
    }

    notifiedTiles.clear();
    notifiedTraits.clear();

    this.tickId = null;
    this.baseReqPri = null;

    this.resetEvts();
  }

  addReq(req){
    this.reqs.add(req);

    if(req.pri < this.baseReqPri)
      this.baseReqPri = req.pri;
  }

  reqModifyEntGlobData(ent, traitCtor, action){
    this.addReq(new Request.ModifyEntGlobData(this, ent, traitCtor, action));
  }

  // reqModifyEntLocData(ent, trait, action){
  //   this.addReq(new Request.ModifyEntLocData(this, ent, trait, action));
  // }

  reqCreateEnt(tile, entCtor, ...args){
    this.addReq(new Request.CreateEntity(this, tile, entCtor, args));
  }

  reqMoveEnt(ent, tileNew){
    this.addReq(new Request.MoveEntity(this, ent, ent.tile, tileNew));
  }

  reqRemoveEnt(ent){
    this.addReq(new Request.RemoveEntity(this, ent, ent));
  }

  reqCreateRoom(gridCtor, gridCtorArgs, builder){
    this.addReq(new Request.CreateRoom(this, gridCtor, gridCtorArgs, builder));
  }

  reqSelectRoom(room){
    this.addReq(new Request.SelectRoom(this, room));
  }

  reqRemoveRoom(room){
    this.addReq(new Request.RemoveRoom(this, room));
  }

  reqPickItem(from, to){
    const {item} = from;

    assert(item !== null);
    assert(to.item === null);

    this.reqSetItem(to, item);
    this.reqRemoveEnt(from.ent);
  }

  reqDropItem(ent){
    const {item} = ent;

    assert(item !== null);

    this.reqSetItem(ent, null);
    this.reqCreateEnt(ent.tile, Entity.ItemEntity, item);
  }

  reqSetItem(trait, item){
    this.addReq(new Request.SetItem(this, trait, item));
  }

  reqDeleteItem(item){
    this.addReq(new Request.DeleteItem(this, item));
  }

  *ser(ser){
    assert(this.mainRoom !== null);
    assert(this.selectedRoom !== null);
    assert(this.evts.nav === null);
    assert(this.notifiedTiles.size === 0);
    assert(this.notifiedTraits.size === 0);
    assert(this.detachedItems.size === 0);
    assert(this.reqs.empty);
    assert(this.tickId === null);
    assert(this.baseReqPri === null);

    yield [[ser, 'writeSet'], this.rooms];
    yield [[this.mainRoom, 'serm'], ser];
    yield [[this.selectedRoom, 'serm'], ser];

    yield [[ser, 'writeSet'], this.notifiedTilesDelayed];
  }

  static *deser(ser){
    const world = World.new();

    const rooms = world.rooms = yield [[ser, 'readSet'], Room];
    const mainRoom = world.mainRoom = yield [[Room, 'deserm'], ser];
    const selectedRoom = world.selectedRoom = yield [[Room, 'deserm'], ser];

    const notifiedTilesDelayed = world.notifiedTilesDelayed = yield [[ser, 'readSet'], Tile];

    assert(rooms.has(mainRoom));
    assert(rooms.has(selectedRoom));

    for(const room of rooms)
      room.world = world;

    world.mainRoom = O.fst(rooms);

    return world;
  }
}

module.exports = World;