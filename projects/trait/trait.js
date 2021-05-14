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

  getGlobData(){ return this.ent.getGlobData(this.ctor); }
  getLocData(){ return this.ent.getLocData(this); }

  render(g){}
  onCreate(){}
  onRemove(){}

  remove(){
    this.onRemove();
    this.ent = null;
  }
}

class Meta extends Trait{
  render(g){
    g.fillStyle = 'red';
    g.fillRect(.25, .25, .5, .5);
  }
}

class ActiveTrait extends Trait{
  constructor(ent, ...args){
    super(ent, ...args);
    this.world.addActiveTrait(this);
  }

  remove(){
    this.world.removeActiveTrait(this);
    super.remove();
  }
}

class NavigationTarget extends Trait{
  constructor(ent, src){
    super(ent);

    this.src = src;

    const ctor = NavigationTarget;
    const data = src.getGlobData(ctor);

    if(data === null){
      src.setGlobData(ctor, new Set([this]));
    }else{
      data.add(this);
    }
  }

  navigate(){
    const {world, tile, ent: navTargetEnt, src} = this;

    world.reqMoveEnt(src, tile);
    world.reqRemoveEnt(navTargetEnt);
  }

  onRemove(){
    const {src} = this;
    const ctor = NavigationTarget;
    const data = src.getGlobData(ctor);

    assert(data !== null);
    assert(data.has(this));

    data.delete(this);
  }
}

class Player extends ActiveTrait{
  render(g){
    drawCirc(g, .5, .5, .3, 'white');
  }

  navigate(){
    const {world, tile, ent} = this;

    const dir = world.evts.nav;
    if(dir === null) return;

    const tileNew = tile.adj(dir);
    if(tileNew === null) return;

    reqMoveEnt(world, ent, tileNew);
  }
}

class Solid extends Trait{
  stop(){
    const {world, tile, ent} = this;
    const targetTile = calcTargetTile(ent);

    for(const trait of targetTile.traits.get(NavigationTarget)){
      if(trait.src === ent) continue;
      world.reqRemoveEnt(trait.ent);
    }
  }
}

class Wall extends Trait{
  render(g){
    g.fillStyle = '#444';
    g.fillRect(0, 0, 1, 1);
  }
}

class Box extends Trait{
  render(g){
    g.fillStyle = '#880';
    g.beginPath();
    g.rect(.25, .25, .5, .5);
    g.fill();
    g.stroke();
  }
}

class Pushable extends Trait{
  push(){
    const {world, tile, ent} = this;

    if(calcTargetTile(ent) !== tile) return;

    let srcTile = null;

    for(const trait of tile.traits.get(NavigationTarget)){
      const tile = trait.src.tile;

      if(srcTile === null){
        srcTile = tile;
        continue;
      }

      if(tile === srcTile) continue;

      return;
    }

    if(srcTile === null) return;

    const dir = srcTile.adj2dir(tile);
    if(dir === null) return;

    const tileNew = tile.adj(dir);
    if(tileNew === null) return;

    reqMoveEnt(world, ent, tileNew);
  }
}

const reqMoveEnt = (world, ent, tileNew) => {
  assert(ent instanceof Entity);
  world.reqCreateEnt(tileNew, Entity.NavigationTarget, ent);
};

const calcTargetTile = ent => {
  const targets = ent.getGlobData(NavigationTarget);

  if(targets === null || targets.size !== 1)
    return ent.tile;

  return O.fst(targets).tile;
};

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
  [Pushable, 'push'],
  [Solid, 'stop'],
  [NavigationTarget, 'navigate', 1],
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

  // Abstract traits
  ActiveTrait,

  // Meta traits
  Meta,
  NavigationTarget,

  // Concrete traits
  Player,
  Solid,
  Wall,
  Box,
  Pushable,
});

const Entity = require('./entity');