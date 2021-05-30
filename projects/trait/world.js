'use strict';

const assert = require('assert');
const Request = require('./request');
const Room = require('./room');
const Trait = require('./trait');
const CtorsMap = require('./ctors-map');
const Serializable = require('./serializable');

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

    this.tickId = null;
    this.baseReqPri = null;

    this.resetEvts();
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
    // room.world = null;
  }

  tick(){
    const {activeRooms, selectedRoom, evts, reqs, notifiedTiles} = this;

    assert(selectedRoom !== null);

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

  reqPushRoom(gridCtor, gridCtorArgs, builder){
    this.addReq(new Request.PushRoom(this, gridCtor, gridCtorArgs, builder));
  }

  reqPopRoom(cb=null){
    this.addReq(new Request.PopRoom(this, cb));
  }

  *ser(ser){
    assert(this.selectedRoom !== null);
    assert(this.evts.nav === null);
    assert(this.notifiedTiles.size === 0);
    assert(this.reqs.empty);
    assert(this.tickId === null);
    assert(this.baseReqPri === null);

    yield [[ser, 'writeSet'], this.activeRooms];
    yield [[ser, 'writeSet'], this.passiveRooms];
    yield [[ser, 'writeArr'], this.roomStack];

    yield [[this.selectedRoom, 'serm'], ser];
  }

  static *deser(ser){
    const world = World.new();

    const activeRooms = world.activeRooms = yield [[ser, 'readSet'], Room];
    const passiveRooms = world.passiveRooms = yield [[ser, 'readSet'], Room];
    const roomStack = world.roomStack = yield [[ser, 'readArr'], Room];
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