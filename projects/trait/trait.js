'use strict';

const assert = require('assert');
const CtorMap = require('./ctor-map');
const inspect = require('./inspect');
const info = require('./info');
const layers = require('./layers');

const {
  BasicInfo,
  DetailedInfo,
} = info;

const {min, max} = Math;
const {pi, pih, pi2} = O;

const layerMax = 1e3;

class Trait extends inspect.Inspectable{
  layer = layerMax;

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

  *inspectData(){
    return [];
  }

  *inspect(){
    const {layer} = this;

    const layerInfo = new BasicInfo(
      `layer = ${layer !== layerMax ?
        `Just ${this.layer}` :
        `Nothing`} :: Maybe Int`);

    return new DetailedInfo(`trait :: ${this.ctor.name}`, [
      layerInfo,
      new DetailedInfo('data :: TraitData', yield [[this, 'inspectData']]),
    ]);
  }
}

class Meta extends Trait{
  render(g){
    g.fillStyle = '#f00';
    g.fillRect(-.5, -.5, 1, 1);
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
  constructor(ent, src, direct=0, strong=0){
    super(ent);

    this.src = src;
    this.direct = direct;
    this.strong = strong;

    const ctor = NavigationTarget;

    this.world.reqModifyEntGlobData(src, ctor, ['set.insert', [this]]);
  }

  navigate(n){
    if(n) return;
    const {world, tile, ent: navTargetEnt, src} = this;

    world.reqMoveEnt(src, tile);
    world.reqRemoveEnt(navTargetEnt);
  }

  onRemove(){
    const {world, src} = this;
    const ctor = NavigationTarget;

    world.reqModifyEntGlobData(src, ctor, ['set.remove', [this]]);
  }

  *inspectData(){
    return [
      new BasicInfo(`direct = ${inspectBool(this.direct)} :: Bool`),
      new BasicInfo(`strong = ${inspectBool(this.strong)} :: Bool`),
    ];
  }
}

class Player extends ActiveTrait{
  layer = layers.Object;

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

    reqMoveEnt(world, ent, tileNew, 1, 1);
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
  layer = layers.Wall;

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
  layer = layers.Object;

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
    const {world, tile, ent} = this;
    const heavy = this.entHasTrait(Heavy);

    if(calcTargetTile(ent) !== tile) return;

    let srcTile = null;
    let strong = 0;

    for(const trait of tile.traits.get(NavigationTarget)){
      if(!trait.strong) continue;
      if(heavy && !trait.direct) continue;

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

    reqMoveEnt(world, ent, tileNew, 0, heavy ? 0 : 1);
  }
}

class Heavy extends Trait{}

class Item extends Trait{
  layer = layers.Item;
}

class Diamond extends Trait{
  render(g){
    g.fillStyle = '#08f';
    g.beginPath();
    g.moveTo(.5 - .5, .14 - .5);
    g.lineTo(.7 - .5, .38 - .5);
    g.lineTo(.5 - .5, .86 - .5);
    g.lineTo(.3 - .5, .38 - .5);
    g.closePath();
    g.stroke();
    g.fill();
    g.beginPath();
    g.moveTo(.5 - .5, .14 - .5);
    g.lineTo(.38 - .5, .44 - .5);
    g.lineTo(.5 - .5, .86 - .5);
    g.moveTo(.5 - .5, .14 - .5);
    g.lineTo(.62 - .5, .44 - .5);
    g.lineTo(.5 - .5, .86 - .5);
    g.moveTo(.3 - .5, .38 - .5);
    g.lineTo(.38 - .5, .44 - .5);
    g.lineTo(.62 - .5, .44 - .5);
    g.lineTo(.7 - .5, .38 - .5);
    g.stroke();
  }
}

class Floor extends Trait{
  layer = layers.Ground;
}

class Concrete extends Trait{
  render(g){
    g.fillStyle = '#808080';
    g.fillRect(-.5, -.5, 1, 1);
  }
}

class Text extends Trait{
  constructor(ent, val){
    super(ent);
    this.val = String(val);
  }

  render(g){
    g.fillStyle = '#000';
    g.fillText(this.val, 0, 0);
  }

  *inspectData(){
    return [
      new BasicInfo(`val = ${O.sf(this.val)} :: String`),
    ];
  }
}

const reqMoveEnt = (world, ent, tileNew, direct=0, strong=0) => {
  assert(ent instanceof Entity);
  world.reqCreateEnt(tileNew, Entity.NavigationTarget, ent, direct, strong);
};

const calcTargetTile = ent => {
  const targets = ent.getGlobData(NavigationTarget);

  if(targets === null || targets.size !== 1)
    return ent.tile;

  return O.fst(targets).tile;
};

const inspectBool = val => {
  return val ? 'True' : 'False';
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
  Item,
  Diamond,
  Floor,
  Concrete,
  Text,
});

const Entity = require('./entity');