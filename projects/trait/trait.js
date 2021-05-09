'use strict';

const assert = require('assert');

const {pi2} = O;

class Trait{
  constructor(ent){
    this.ent = ent;
  }

  get ctor(){ return this.constructor; }
  get world(){ return this.ent.world; }
  get tile(){ return this.ent.tile; }

  render(g){}
}

class Player extends Trait{
  render(g){
    drawCirc(g, .5, .5, .3, 'white');
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

module.exports = Object.assign(Trait, {
  Player,
});