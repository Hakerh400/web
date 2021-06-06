'use strict';

const assert = require('assert');
const Request = require('./request');
const Room = require('./room');
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

    this.activeRooms = new Set();
    this.passiveRooms = new Set();
    this.selectedRoom = null;
    this.roomStack = [];

    this.reqs = new CtorsMap();
    this.notifiedTiles = new Set();
    this.notifiedTilesDelayed = new Set();
    this.notifiedTraits = new CtorsMap();

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
    };
  }

  createRoom(gridCtor, gridCtorArgs, mode, builder){
    const grid = new gridCtor(...gridCtorArgs);
    const room = new Room(this, grid);

    grid.enterBuildMode();
    builder(grid);
    grid.exitBuildMode();

    this.passiveRooms.add(room);

    if(mode === 1) this.makeRoomActive(room);
    else if(mode === 2) this.selectRoom(room);

    return room;
  }

  pushRoom(gridCtor, gridCtorArgs, builder){
    if(window.z) zz
    const {roomStack} = this;

    const room = this.createRoom(gridCtor, gridCtorArgs, 2, builder);
    roomStack.push(room);

    return room;
  }

  popRoom(){
    const {roomStack} = this;
    assert(roomStack.length >= 2);

    const room = roomStack.pop();
    this.selectRoom(O.last(roomStack));
    this.removeRoom(room);

    return room;
  }

  makeRoomActive(room){
    assert(room.passive);
    assert(this.passiveRooms.has(room));
    assert(!this.activeRooms.has(room));
    assert(this.selectedRoom !== room);

    this.passiveRooms.delete(room);
    this.activeRooms.add(room);

    room.active = 1;
  }

  makeRoomPassive(room){
    assert(room.active);
    assert(this.activeRooms.has(room));
    assert(!this.passiveRooms.has(room));

    if(this.selectedRoom === room)
      this.selectedRoom = null;

    this.activeRooms.delete(room);
    this.passiveRooms.add(room);

    room.active = 0;
  }

  selectRoom(room, passivize=1){
    if(room.passive) this.makeRoomActive(room);
    assert(this.activeRooms.has(room));

    if(this.selectedRoom !== null)
      this.unselectRoom(passivize);

    this.selectedRoom = room;
  }

  unselectRoom(passivize=1){
    const {selectedRoom} = this;
    assert(selectedRoom !== null);

    this.selectedRoom = null;

    if(passivize)
      this.makeRoomPassive(selectedRoom);
  }

  removeRoom(room){
    assert(room.passive);
    assert(this.passiveRooms.has(room));

    this.passiveRooms.delete(room);
    room.world = null;
  }

  tick(){
    const {
      activeRooms,
      selectedRoom,
      evts,
      reqs,
      notifiedTiles,
      notifiedTilesDelayed,
      notifiedTraits,
    } = this;

    assert(selectedRoom !== null);

    for(const tile of notifiedTilesDelayed)
      notifiedTiles.add(tile);

    notifiedTilesDelayed.clear();

    if(evts.lmb !== null) evts.lmb.notify();
    if(evts.rmb !== null) evts.lmb.notify();

    // O.logb();
    this.tickId = O.obj();

    for(const room of activeRooms){
      for(const trait of room.activeTraits){
        assert(trait.valid);
        trait.tile.notify();
      }
    }

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
            reqCtor.exec(reqsSet);

          if(this.baseReqPri <= pri){
            pri = this.baseReqPri;
            continue;
          }

          pri++;
        }

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

  reqCreateEnt(tile, entCtor, ...args){
    this.addReq(new Request.CreateEntity(this, tile, entCtor, args));
  }

  reqMoveEnt(ent, tileNew){
    this.addReq(new Request.MoveEntity(this, ent, ent.tile, tileNew));
  }

  reqRemoveEnt(ent){
    this.addReq(new Request.RemoveEntity(this, ent, ent));
  }

  reqPushRoom(ent, gridCtor, gridCtorArgs, builder){
    this.addReq(new Request.PushRoom(this, ent, gridCtor, gridCtorArgs, builder));
  }

  reqPopRoom(cb=null){
    this.addReq(new Request.PopRoom(this, cb));
  }

  *ser(ser){
    assert(this.selectedRoom !== null);
    assert(this.evts.nav === null);
    assert(this.notifiedTiles.size === 0);
    assert(this.notifiedTraits.size === 0);
    assert(this.reqs.empty);
    assert(this.tickId === null);
    assert(this.baseReqPri === null);

    yield [[ser, 'writeSet'], this.activeRooms];
    yield [[ser, 'writeSet'], this.passiveRooms];
    yield [[ser, 'writeArr'], this.roomStack];
    yield [[ser, 'writeSet'], this.notifiedTilesDelayed];

    yield [[this.selectedRoom, 'serm'], ser];
  }

  static *deser(ser){
    const world = World.new();

    const activeRooms = world.activeRooms = yield [[ser, 'readSet'], Room];
    const passiveRooms = world.passiveRooms = yield [[ser, 'readSet'], Room];
    const roomStack = world.roomStack = yield [[ser, 'readArr'], Room];
    const notifiedTilesDelayed = world.notifiedTilesDelayed = yield [[ser, 'readSet'], Tile];
    const selectedRoom = world.selectedRoom = yield [[Room, 'deserm'], ser];

    assert(activeRooms.has(selectedRoom));

    for(const room of activeRooms){
      room.world = world;
      room.active = 1;
    }

    for(const room of passiveRooms)
      room.world = world;

    return world;
  }
}

module.exports = World;