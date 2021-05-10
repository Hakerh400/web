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
    const dir = this.world.evts.nav;
    if(dir === null) return;

    const tileNew = this.tile.nav(dir);
    this.move(tileNew);
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
  [Player, 'navigate'],
];

module.exports = Object.assign(Trait, {
  // handlersArr,
  // handlersMap,

  Player,
});