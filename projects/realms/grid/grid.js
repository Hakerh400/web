'use strict';

const Event = require('../event');

class Grid extends O.EventEmitter{
  listeners = O.obj();
  updates = new Set();
  transitionsArr = [];
  removedObjs = [];

  constructor(reng){
    super();

    this.reng = reng;
  }

  get type(){ O.virtual('type'); }
  get tick(){ return this.reng.tick; }

  emitAndTick(evt){
    const {tick} = this.reng;

    if(this.emitGridEvent(evt)){
      this.tick(new Event('tick'));
      return 1;
    }

    return 0;
  }

  tick(evt){
    const {updates} = this;
    const {tick} = this.reng;
    let updated = 0;

    this.updates = new Set();

    if(this.emitGridEvent(new Event('tick')))
      updated = 1;

    if(this.emitGridEventToTiles(new Event('update'), updates))
      updated = 1;

    return updated;
  }

  endAnim(){
    const {transitionsArr, removedObjs} = this;

    for(const transitions of transitionsArr)
      transitions.length = 0;

    transitionsArr.length = 0;
    removedObjs.length = 0;
  }

  addGridEventListener(type, obj){
    const {listeners} = this;

    if(!(type in listeners))
      listeners[type] = new Set();
    
    listeners[type].add(obj);
  }

  removeGridEventListener(type, obj){
    const {listeners} = this;
    const set = listeners[type];

    if(set.size === 1) delete listeners[type];
    else set.delete(obj);
  }

  emitGridEvent(evt){
    const objs = this.enumerateListeners(evt);
    return this.emitGridEventToObjs(evt, objs);
  }

  emitGridEventToTiles(evt, tiles){
    const {type} = evt;
    const objs = new Set();

    for(const tile of tiles)
      for(const obj of tile.objs)
        if(obj.listensL[type])
          objs.add(obj);

    return this.emitGridEventToObjs(evt, objs);
  }

  emitGridEventToObjs(evt, objs){
    const {type} = evt;
    let consumed = 0;

    while(1){
      const num = objs.size;

      for(const obj of objs){
        if(obj[type](evt)){
          consumed = 1;
          objs.delete(obj);
        }
      }

      if(objs.size === num) break;
    }

    return consumed;
  }

  enumerateListeners(evt){
    const {listeners} = this;
    const {type, tile} = evt;
    const objs = new Set();

    if(tile !== null)
      for(const obj of tile.objs)
        if(obj.listensL[type])
          objs.add(obj);

    if(type in listeners)
      for(const obj of listeners[type])
        objs.add(obj);

    return objs;
  }

  rand(a, b){
    return O.rand(a, b);
  }

  randElem(arr, splice=0, fast=0){
    return O.randElem(arr, splice, fast);
  }

  get target(){ O.virtual('target'); }
  draw(g, t, k){ O.virtual('draw'); }
  drag(dx, dy){ O.virtual('drag'); }
  zoom(dir){ O.virtual('zoom'); }
  has(){ O.virtual('has'); }
  gen(){ O.virtual('gen'); }
  getRaw(){ O.virtual('getRaw'); }
  get(){ O.virtual('get'); }
  set(){ O.virtual('set'); }
  prune(){ O.virtual('prune'); }
  relocate(){ O.virtual('relocate'); }
}

module.exports = Grid;