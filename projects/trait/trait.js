'use strict';

const assert = require('assert');
const CtorMap = require('./ctor-map');

const {pi2} = O;

class Trait{
  constructor(ent){
    this.ent = ent;
    this.onCreate();
  }

  get ctor(){ return this.constructor; }
  get world(){ return this.ent.world; }
  get tile(){ return this.ent.tile; }
  get valid(){ return this.ent !== null; }

  render(g){}
  onCreate(){}
  onRemove(){}

  remove(){
    this.onRemove();
    this.ent = null;
  }
}

class Player extends Trait{
  onCreate(){
    const {world, ent} = this;

    world.addActiveEnt(ent);
  }

  render(g){
    drawCirc(g, .5, .5, .3, 'white');
  }

  navigate(){
    const {world, tile, ent} = this;

    const dir = world.evts.nav;
    if(dir === null) return;

    const tileNew = tile.nav(dir);
    world.reqMoveEnt(ent, tileNew);
  }

  onRemove(){
    const {world, ent} = this;

    world.addActiveEnt(ent);
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

const handlersArr = [
  [Player, 'navigate', 1],
];

const handlersMap = new CtorMap();

for(const info of handlersArr){
  const [ctor, methodName, once=0] = info;
  const method = ctor.prototype[methodName];

  info[1] = method;
  handlersMap.add(ctor, [method, once]);
}

module.exports = Object.assign(Trait, {
  handlersArr,
  handlersMap,

  Player,
});