'use strict';

const assert = require('assert');
const CtorMap = require('./ctor-map');
const inspect = require('./inspect');
const info = require('./info');

const {
  BasicInfo,
  DetailedInfo,
} = info;

const {min, max} = Math;
const {pi, pih, pi2} = O;

class Trait extends inspect.Inspectable{
  constructor(ent){
    super();

    this.ent = ent;
    this.onCreate();
  }

  get ctor(){ return this.constructor; }
  get world(){ return this.ent.world; }
  get tile(){ return this.ent.tile; }
  get valid(){ return this.ent !== null; }

  getGlobData(){ return this.ent.getGlobData(this.ctor); }
  getLocData(){ return this.ent.getLocData(this); }

  entHasTrait(traitCtor){ return this.ent.hasTrait(traitCtor); }

  render(g){}
  onCreate(){}
  onRemove(){}

  remove(){
    this.onRemove();
    this.ent = null;
  }

  *inspect(){
    return new BasicInfo(`trait :: ${this.ctor.name}`);
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

    world.reqModifyEntGlobData(src, ctor, ['set.insert', [this]]);
  }

  navigate(n){
    if(n) return;
    const {world, tile, ent: navTargetEnt, src} = this;

    world.reqMoveEnt(src, tile);
    world.reqRemoveEnt(navTargetEnt);
  }

  onRemove(){
    const {src} = this;
    const ctor = NavigationTarget;

    world.reqModifyEntGlobData(src, ctor, ['set.remove', [this]]);
  }
}

class Player extends ActiveTrait{
  render(g){
    g.fillStyle = 'white';
    g.beginPath();
    drawCirc(g, 0, 0, .4);
    g.fill();
    g.stroke();

    g.fillStyle = 'white';
    g.beginPath();
    drawCirc(g, -.2, -.05, .1);
    g.fill();
    g.stroke();
    g.beginPath();
    drawCirc(g, .2, -.05, .1);
    g.fill();
    g.stroke();

    g.fillStyle = 'black';
    g.beginPath();
    drawCirc(g, -.2, -.05, .035);
    g.fill();
    g.beginPath();
    drawCirc(g, .2, -.05, .035);
    g.fill();

    g.beginPath();
    g.arc(0, 0, .2, pi / 4, pi * 3 / 4);
    g.stroke();
  }

  navigate(n){
    if(n) return;
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
    const s = 1 / g.s;

    g.fillStyle = '#888';
    g.fillRect(-.5, -.5, 1, 1);

    g.fillStyle = '#444';

    const w = .45;
    const h = .20;
    const space = .05;

    // const A = +(1 / (w + space)).toFixed(3);
    // const B = +(1 / (h + space)).toFixed(3);
    //
    // const check = a => {
    //   if(a !== (a | 0)) return 0;
    //   if(a & 1) return 0;
    //   return 1;
    // };
    //
    // if(!(check(A) && check(B))){
    //   log(A);
    //   log(B);
    //   assert.fail();
    // }

    const dx = w + space;
    const dy = h + space;

    const x1 = -.5 - dx / 2;
    const y1 = -.5 - dy / 2;

    let i = 0;

    for(let yy = y1; yy < .5; yy += dy, i++){
      const offset = dx / 2 * (i % 2);

      for(let xx = x1 + offset; xx < .5; xx += dx){
        const x = max(xx, -.5)
        const y = max(yy, -.5);
        const x2 = min(xx + w, .5);
        const y2 = min(yy + h, .5);
        const ax = x2 - x;
        const ay = y2 - y;

        if(w - x2 < space / 5){
          g.fillRect(x, y, w + s - x, ay);
          continue;
        }
        
        g.fillRect(x, y, ax, ay);
      }
    }
  }
}

class Box extends Trait{
  render(g){
    const s = 1 / g.s;

    if(this.entHasTrait(Heavy)){
      const s1 = .3;
      const s2 = .215;
      const s3 = .075;

      g.fillStyle = '#ff0';
      g.beginPath();
      g.rect(-s1, -s1, s1 * (2 - s), s1 * (2 - s));
      g.fill();
      g.stroke();

      g.fillStyle = '#880';
      g.beginPath();
      g.rect(-s2, -s2, s2 * 2, s2 * 2);
      g.fill();
      g.stroke();

      g.fillStyle = '#ff0';
      g.beginPath();
      g.moveTo(s2 - s3, -s2);
      g.lineTo(s2, -s2);
      g.lineTo(s2, -s2 + s3);
      g.lineTo(-s2 + s3, s2);
      g.lineTo(-s2, s2);
      g.lineTo(-s2, s2 - s3);
      g.closePath();
      g.fill();
      g.stroke();
      g.beginPath();
      g.moveTo(-s2 + s3, -s2);
      g.lineTo(-s2, -s2);
      g.lineTo(-s2, -s2 + s3);
      g.lineTo(s2 - s3, s2);
      g.lineTo(s2, s2);
      g.lineTo(s2, s2 - s3);
      g.closePath();
      g.fill();
      g.stroke();

      return;
    }

    g.fillStyle = '#ff0';
    g.beginPath();
    g.rect(-.25, -.25, .5, .5);
    g.fill();
    g.stroke();
  }
}

class Pushable extends Trait{
  push(n){
    if(n && this.entHasTrait(Heavy)) return;
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

class Heavy extends Trait{
  
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
  [Player, 'navigate'],
  [Pushable, 'push'],
  [Solid, 'stop'],
  [NavigationTarget, 'navigate'],
];

const handlersMap = new CtorMap();

for(const info of handlersArr){
  const [ctor, methodName] = info;
  const method = ctor.prototype[methodName];

  info[1] = method;
  handlersMap.add(ctor, method);
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
  Heavy,
});

const Entity = require('./entity');