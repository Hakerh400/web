'use strict';

const assert = require('assert');
const TraitMap = require('./trait-map');

const {pi2} = O;

class Trait{
  constructor(ent){
    this.ent = ent;
  }

  get ctor(){ return this.constructor; }
  get world(){ return this.ent.world; }
  get tile(){ return this.ent.tile; }
  get valid(){ return this.ent !== null; }

  render(g){}
}

class Player extends Trait{
  render(g){
    drawCirc(g, .5, .5, .3, 'white');
  }

  navigate(){
    const {world, tile} = this;

    const dir = world.evts.nav;
    if(dir === null) return;

    const tileNew = tile.nav(dir);
    world.reqEntMove(this, tileNew);
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

const handlersArrRaw = [
  [Player, 'navigate', 0],
];

const handlersMap = new TraitMap();

const handlersArr = handlersArrRaw.map(([ctor, methodName, repeat], index) => {
  const method = ctor.prototype[methodName];
  handlersMap.add(ctor, [method, index, repeat]);
  return [ctor, method];
});

module.exports = Object.assign(Trait, {
  handlersArr,
  handlersMap,

  Player,
});