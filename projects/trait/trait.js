'use strict';

const assert = require('assert');
const EventHandler = require('./event-handler');
const Event = require('./event');
const kName = require('./kname');

const {pi2} = O;

class Trait{
  static get [kName](){ O.virtual('kName'); }

  static create(ent, name){
    assert(O.has(traitsObj, name));
    return new traitsObj[name](ent);
  }

  constructor(ent){
    this.ent = ent;
    ent.addTrait(this);
  }
  
  get name(){ return this.constructor[kName]; }
  get world(){ return this.ent.world; }
  get tile(){ return this.ent.tile; }
  get valid(){ return this.ent !== null; }

  render(g){}

  onCreate(){}
  onRemove(){}
  onMove(from, to){}

  handlers = O.obj();

  hasHandler(name){
    return O.has(this.handlers, name);
  }

  getHandler(name){
    const {handlers} = this;

    if(O.has(handlers, name))
      return handlers[name];

    assert(O.has(handlersObj, name));

    const [pri, func] = handlersObj[name];
    const handler = new EventHandler(this, pri, func);

    handlers[name] = handler;

    return handler;
  }

  popHandler(name){
    const {handlers} = this;
    assert(O.has(handlers, name));

    const handler = handlers[name];
    delete handlers[name];

    return handler;
  }

  remove(){
    this.onRemove();
    this.ent = null;
  }
}

class Meta extends Trait{
  static get [kName](){ return 'meta'; }

  render(g){
    assert.fail();
  }
}

class NavigationTarget extends Trait{
  static get [kName](){ return 'navTarget'; }

  onCreate(){
    const {world} = this;

    world.addEvt(new Event(this.getHandler('execNavTarget')));
  }

  exec(){
    const {world, tile, ent} = this;
    const {src} = ent;

    world.reqEntMove(src, tile);
    world.reqEntRemove(ent);
  }
}

class Player extends Trait{
  static get [kName](){ return 'player'; }

  render(g){
    drawCirc(g, .5, .5, .3, 'white');
  }

  onCreate(){
    const {world} = this;

    world.addHandler('keydown', this.getHandler('navigate'));
  }

  onRemove(){
    world.removeHandler('keydown', this.popHandler('navigate'));
  }

  navigate(evt){
    const {world, tile, ent} = this;
    const {code} = evt;

    let dir;

    if(code === 'ArrowUp') dir = 0;
    else if(code === 'ArrowRight') dir = 1;
    else if(code === 'ArrowDown') dir = 2;
    else if(code === 'ArrowLeft') dir = 3;
    else return;

    const tileNew = tile.nav(dir);
    if(tileNew === null) return;

    world.reqEntCreate(tileNew, Entity.NavigationTarget, [ent]);
  }
};

class Solid extends Trait{
  static get [kName](){ return 'solid'; }

  onCreate(){
    const {world, tile} = this;

    tile.addEntEnterHandler('navTarget', this.getHandler('stop'));
  }

  onRemove(){
    tile.removeEntEnterHandler('navTarget', this.getHandler('stop'));
  }

  onMove(from, to){
    const handler = this.getHandler('stop');

    from.removeEntEnterHandler('navTarget', handler);
    to.addEntEnterHandler('navTarget', handler);
  }

  stop(evt){
    const {ent} = evt;

    if(!ent.src.hasTrait('solid')) return;
    ent.remove();
  }
};

class Wall extends Trait{
  static get [kName](){ return 'wall'; }

  render(g){
    g.fillStyle = '#444';
    g.fillRect(0, 0, 1, 1);
  }
}

const drawCirc = (g, x, y, r, col=null) => {
  if(col !== null)
    g.fillStyle = col;

  g.beginPath();
  g.arc(x, y, r, 0, pi2);
  g.fill();
  g.stroke();
};

const traitsArr = [
  Meta,
  NavigationTarget,
  Player,
  Solid,
  Wall,
];

const traitsObj = O.obj();

for(const traitCtor of traitsArr)
  traitsObj[traitCtor[kName]] = traitCtor;

const handlersArrRaw = [
  ['navigate', Player.prototype.navigate],
  ['stop', Solid.prototype.stop],
  ['execNavTarget', NavigationTarget.prototype.exec],
];

const handlersObj = O.obj();

const handlersArr = handlersArrRaw.map(([name, func], index) => {
  const pri = index;
  const info = [pri, func];

  handlersObj[name] = info;

  return info;
});

module.exports = Object.assign(Trait, {
  traitsArr,
  traitsObj,
  handlersArr,
  handlersObj,
});

const Tile = require('./tile');
const Entity = require('./entity');