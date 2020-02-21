'use strict';

const Event = require('./event');
const Transition = require('./transition');
const Pivot = require('./pivot');

const {
  Request,
} = Event;

const {
  Translation,
  Rotation,
  Scale,

  intps,
} = Transition;

class Object{
  static realm = null;
  static objName = null;
  static layer = 0;
  static traits = O.obj();

  static listenersG = O.obj();
  static listenersL = O.obj();
  static listenersM = O.obj();

  static gradients = [];
  static gradientInstances = [];

  layer = this.constructor.layer;
  is = this.constructor.traits;
  listensG = this.constructor.listenersG;
  listensL = this.constructor.listenersL;
  listensM = this.constructor.listenersM;

  transitions = [];
  keepTranslation = 0;

  tMoved = null;

  removed = 0;

  constructor(tile){
    const {grid} = tile;
    
    this.grid = grid;
    this.tile = tile;

    tile.addObj(this);

    for(const type in this.listensG)
      grid.addGridEventListener(type, this);
  }

  static initTraits(arr){ return window.Object.assign(O.arr2obj(arr), this.traits); }
  static initListenersG(arr){ return window.Object.assign(O.arr2obj(arr), this.listenersG); }
  static initListenersL(arr){ return window.Object.assign(O.arr2obj(arr), this.listenersL); }
  static initListenersM(arr){ return window.Object.assign(O.arr2obj(arr), this.listenersM); }

  static initGradients(arr){
    this.gradients = arr;
    this.gradientInstances = O.ca(arr.length, () => null);

    return arr;
  }

  ser(s){}
  deser(s){}

  get tick(){ return this.grid.reng.tick; }

  gradient(g, index){
    const ctor = this.constructor;
    const instances = ctor.gradientInstances;
    const instance = instances[index];
    if(instance !== null) return instance;

    const params = ctor.gradients[index];
    const coords = params.slice(0, 4);
    const stops = params.slice(4);
    const len = stops.length;
    const len1 = len - 1;

    const grad = g.createLinearGradient.apply(g, coords);

    for(let i = 0; i !== len; i++)
      grad.addColorStop(i / len1, stops[i]);

    return ctor.gradientInstances[index] = grad;
  }
  
  draw(g, t, k){ O.virtual('draw'); }

  canMove(dir, num){
    const {tile} = this;
    const newTile = tile.adj(dir, num);
    const {has} = newTile;

    return !has.occupying;
  }

  tryToMove(dir, num){
    if(!this.canMove(dir, num)) return 0;
    this.move(dir, num);
    return 1;
  }

  move(dir, num){
    const {tile} = this;
    const newTile = tile.adj(dir, num);

    this.moveToTile(newTile);
    this.addTr(new Translation(tile, newTile));

    if(this.is.nonFloating && !this.tile.has.ground)
      this.collapse();
  }

  moveToTile(tile){
    this.tile.removeObj(this);
    tile.addObj(this);
    this.tile = tile;
    this.tMoved = this.tick;
  }

  checkGround(){
    if(this.tMoved !== this.tick && !this.tile.has.ground){
      this.collapse();
      return 1;
    }

    return 0;
  }

  send(tile, traits, type, data){
    const req = new Request(this, type, data);
    const objs = new Set(tile.get(traits));
    let consumed = 0;

    while(1){
      const num = objs.size;

      for(const obj of objs){
        if(!(type in obj.listensM)){
          objs.delete(obj);
          continue;
        }

        if(obj[type](req)){
          consumed = 1;
          objs.delete(obj);
        }
      }

      if(objs.size === num) break;
    }

    return consumed;
  }

  addTr(transition){
    const {grid, transitions} = this;

    transitions.push(transition);

    if(transitions.length === 1){
      if(this.removed) grid.removedObjs.push(this);
      else grid.transitionsArr.push(transitions);
    }
  }

  collapse(){
    this.remove();
    this.addTr(new Scale(1, 0));

    if(this.transitions.length === 1)
      this.keepTranslation = 1;
  }

  remove(){
    const {grid, tile, transitions} = this;

    tile.removeObj(this);

    for(const type in this.listensG)
      grid.removeGridEventListener(type, this);

    if(transitions.length !== 0)
      grid.removedObjs.push(this);

    this.removed = 1;
  }
}

module.exports = Object;