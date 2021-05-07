'use strict';

const assert = require('assert');
const Tile = require('./tile');
const Request = require('./request');
const Event = require('./event');

const {reqsObj} = Request;

class World{
  handlers = O.obj();
  evtsBuf = [];
  reqsBuf = [];
  curHandlerPri = 0;

  constructor(w, h){
    this.w = w;
    this.h = h;
    
    this.grid = new O.Grid(w, h, (x, y) => {
      return new Tile(this, [x, y]);
    });
  }

  getTile([x, y]){
    const {grid} = this;

    return grid.get(x, y);
  }

  // addTraitToTile(tile, trait){}
  // removeTraitFromTile(tile, trait){}

  addHandler(evtName, handler){
    const {handlers} = this;

    if(!O.has(handlers, evtName))
      handlers[evtName] = new Set();

    const handlersSet = handlers[evtName]
    assert(!handlersSet.has(handler));

    handlersSet.add(handler);
  }

  removeHandler(evtName, handler){
    const {handlers} = this;
    assert(O.has(handlers[evtName]));

    const handlersSet = handlers[evtName];
    assert(handlersSet.has(handler));

    handlersSet.delete(handler);
  }

  addEvt(evt){
    assert(evt instanceof Event);
    this.evtsBuf.push(evt);
  }

  emit(evtName, evtInfo){
    const {handlers, evtsBuf} = this;

    if(!O.has(handlers, evtName))
      return;

    for(const handler of handlers[evtName]){
      if(handler.pri < this.curHandlerPri) continue;

      this.addEvt(new Event(handler, evtInfo));
    }
  }

  tick(){
    const {evtsBuf, reqsBuf} = this;

    this.curHandlerPri = 0;

    while(evtsBuf.length !== 0){
      evtsBuf.sort((a, b) => a.pri - b.pri);

      const pri = evtsBuf[0].pri;
      assert(typeof pri === 'number');

      this.curHandlerPri = pri;

      while(evtsBuf.length !== 0 && evtsBuf[0].pri === pri){
        const evt = evtsBuf.shift();
        if(!evt.valid) continue;

        const {handler, evtInfo} = evt;
        handler.exec(evtInfo);
      }

      reqsBuf.sort((a, b) => a.pri - b.pri);

      const reqsNum = reqsBuf.length;

      for(let i = 0; i < reqsNum;){
        const req = reqsBuf[i];
        const {pri} = req;

        const start = i;
        let end = i;

        for(let j = start; j !== reqsNum; j++){
          const req = reqsBuf[j];
          if(req.pri > pri) break;
          end++;
        }

        req.constructor.execBatch(reqsBuf, start, end);
        i = end;
      }

      reqsBuf.length = 0;
    }
  }

  createEnt(coords, ctor, ...args){
    const tile = this.getTile(coords);
    return tile.createEnt(ctor, ...args);
  }

  reqEntCreate(tile, entCtor, ...args){
    this.reqsBuf.push(new reqsObj.createEnt(this, tile, entCtor, ...args));
  }

  reqEntRemove(ent, ...args){
    this.reqsBuf.push(new reqsObj.removeEnt(this, ent, ...args));
  }

  reqEntMove(ent, dest, ...args){
    this.reqsBuf.push(new reqsObj.moveEnt(this, ent, dest, ...args));
  }
}

module.exports = World;