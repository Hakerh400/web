'use strict';

const assert = require('assert');
const CtorsMap = require('./ctors-map');
const Inspectable = require('./inspectable');
const info = require('./info');
const layers = require('./layers');
const Serializable = require('./serializable');
const ctorsPri = require('./ctors-pri');

const {
  BasicInfo,
  DetailedInfo,
} = info;

const {min, max} = Math;
const {pi, pih, pi2} = O;

const layersNum = O.keys(layers).length >> 1;

class Trait extends Inspectable{
  static get baseCtor(){ return Trait; }

  init(){
    super.init();

    this.locDataEnts = new Set();
    this.layer = null;
  }

  new(ent){
    super.new();

    this.ent = ent;

    this.onCreate();
  }

  get valid(){
    return (
      this.ent !== null &&
      this.tile !== null &&
      this.grid !== null &&
      this.room !== null &&
      this.world !== null
    );
  }

  get pos(){ return this.ent.pos; }
  get tile(){ return this.ent.tile; }
  get grid(){ return this.ent.grid; }
  get room(){ return this.ent.room; }
  get world(){ return this.ent.world; }

  notify(){ this.ent.notify(); }

  getGlobData(){ return this.ent.getGlobData(this.ctor); }
  getLocData(){ return this.ent.getLocData(this); }

  entHasTrait(traitCtor){ return this.ent.hasTrait(traitCtor); }

  render(g){}
  onCreate(){}
  onRemove(){}

  remove(){
    this.onRemove();

    for(const ent of this.locDataEnts)
      ent.locData.delete(this);

    this.ent.removeTrait(this);
    this.ent = null;
  }

  *ser(ser){
    const {layer} = this;

    yield [[this, 'serCtor'], ser];

    if(layer === null){
      ser.write(0);
    }else{
      ser.write(1);
      ser.write(layer, layersNum);
    }

    yield [[this, 'serData'], ser];
  }

  static *deser(ser){
    const ctor = yield [[this, 'deserCtor'], ser];
    const trait = ctor.new();

    const layer = ctor.layer = ser.read() ?
      ser.read(layersNum) : null;

    yield [[trait, 'deserData'], ser];

    return trait;
  }

  *serData(ser){}
  *deserData(ser){}

  static *serEntGlobData(ser, data){ O.virtual('serEntGlobData'); }
  static *deserEntGlobData(ser, data){ O.virtual('deserEntGlobData'); }

  *serEntLocData(ser, data){ O.virtual('serEntLocData'); }
  *deserEntLocData(ser, data){ O.virtual('deserEntLocData'); }

  *inspectData(){
    return [];
  }

  *inspect(){
    const {layer} = this;

    const layerInfo = new BasicInfo(
      `layer = ${layer !== null ?
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
    g.fillRect(0, 0, 1, 1);
  }
}

class ActiveTrait extends Trait{
  new(ent, ...args){
    super.new(ent, ...args);
    this.room.addActiveTrait(this);
  }

  remove(){
    this.room.removeActiveTrait(this);
    super.remove();
  }
}

class NavigationTarget extends Trait{
  new(ent, src, direct=0, strong=0){
    super.new(ent);

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

  static *serEntGlobData(ser, data){
    const set = data !== null ? data : new Set();
    yield [[ser, 'writeSet'], set];
  }

  static *deserEntGlobData(ser){
    return O.tco([ser, 'readSet'], Entity);
  }

  *inspectData(){
    return [
      new BasicInfo(`direct = ${inspectBool(this.direct)} :: Bool`),
      new BasicInfo(`strong = ${inspectBool(this.strong)} :: Bool`),
    ];
  }
}

class Player extends ActiveTrait{
  init(){
    super.init();

    this.layer = layers.Object;
  }

  render(g){
    g.fillStyle = 'white';
    g.beginPath();
    drawCirc(g, .5, .5, .4);
    g.fill();
    g.stroke();

    g.fillStyle = 'white';
    g.beginPath();
    drawCirc(g, .3, .45, .1);
    g.fill();
    g.stroke();
    g.beginPath();
    drawCirc(g, .7, .45, .1);
    g.fill();
    g.stroke();

    g.fillStyle = 'black';
    g.beginPath();
    drawCirc(g, .3, .45, .035);
    g.fill();
    g.beginPath();
    drawCirc(g, .7, .45, .035);
    g.fill();

    g.beginPath();
    g.arc(.5, .5, .2, pi / 4, pi * 3 / 4);
    g.stroke();
  }

  navigate(n){
    if(n) return;
    const {world, tile, ent} = this;

    const dir = world.evts.nav;
    if(dir === null) return;

    const tileNew = tile.adj(dir);
    if(tileNew === null) return;

    reqMoveEnt(ent, tileNew, 1, 1);
  }

  restart(n){
    if(n) return;
    const {world, grid} = this;

    if(!world.evts.restart) return;

    world.reqPopRoom((grid, ent) => {
      if(!ent) return;

      const {tile} = ent;
      const btn = tile.getTrait(Button);
      if(!btn) return;

      btn.exec();
    });
  }

  exit(n){
    if(n) return;
    const {world, grid} = this;

    if(!world.evts.exit) return;

    world.reqPopRoom();
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
  init(){
    super.init();

    this.layer = layers.Wall;
  }

  render(g){
    const {gs} = g;

    g.fillStyle = '#888';
    g.fillRect(0, 0, 1, 1);

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

    const x1 = -dx / 2 + gs;
    const y1 = -dy / 2 + gs;

    let i = 0;

    for(let yy = y1; yy < 1; yy += dy, i++){
      const offset = dx / 2 * (i % 2);

      for(let xx = x1 + offset; xx < 1; xx += dx){
        const x = max(xx, 0)
        const y = max(yy, 0);
        const x2 = min(xx + w, 1);
        const y2 = min(yy + h, 1);
        const ax = x2 - x;
        const ay = y2 - y;

        if(1 - x2 < space / 5){
          g.fillRect(x, y, 1 - x + gs, ay);
          break;
        }
        
        g.fillRect(x, y, ax, ay);
      }
    }
  }
}

class Box extends Trait{
  init(){
    super.init();

    this.layer = layers.Object;
  }

  render(g){
    const {gs} = g;

    if(this.entHasTrait(Heavy)){
      const s1 = .3;
      const s2 = .215;
      const s3 = .075;

      g.save();
      g.translate(.5, .5);

      g.fillStyle = '#ff0';
      g.beginPath();
      g.rect(-s1, -s1, s1 * (2 - gs), s1 * (2 - gs));
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

      g.restore();

      return;
    }

    g.fillStyle = '#ff0';
    g.beginPath();
    g.rect(.25, .25, .5, .5);
    g.fill();
    g.stroke();
  }
}

class Pushable extends Trait{
  push(n){
    const {world, room, tile, ent} = this;
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

    reqMoveEnt(ent, tileNew, 0, heavy ? 0 : 1);
  }
}

class Heavy extends Trait{}

class Item extends Trait{
  init(){
    super.init();

    this.layer = layers.Item;
  }
}

class Diamond extends Trait{
  render(g){
    g.fillStyle = '#08f';
    g.beginPath();
    g.moveTo(.5, .14);
    g.lineTo(.7, .38);
    g.lineTo(.5, .86);
    g.lineTo(.3, .38);
    g.closePath();
    g.stroke();
    g.fill();
    g.beginPath();
    g.moveTo(.5, .14);
    g.lineTo(.38, .44);
    g.lineTo(.5, .86);
    g.moveTo(.5, .14);
    g.lineTo(.62, .44);
    g.lineTo(.5, .86);
    g.moveTo(.3, .38);
    g.lineTo(.38, .44);
    g.lineTo(.62, .44);
    g.lineTo(.7, .38);
    g.stroke();
  }

  collect(n){
    if(n) return;

    const {world, tile, level} = this;

    if(!tile.hasTrait(Player)) return;

    world.reqPopRoom((grid, ent) => {
      if(!ent) return;

      const {w, h} = grid;
      const {x, y} = ent.pos;

      const i = x + y * w + 1;
      const x1 = i % w;
      const y1 = i / w | 0;

      const text = ent.getTrait(Text);
      if(!text) return;

      const {str} = text;
      if(!/^\d{2}$/.test(str)) return;

      const nextLevel = Number(str) + 1;

      const tile = grid.getp(x1, y1);
      if(tile === null) return;

      const locks = [...tile.getEnts(Lock)];
      if(locks.length !== 1) return;

      const lock = locks[0];
      const lab = String(nextLevel).padStart(2, '0');

      world.reqRemoveEnt(lock);
      world.reqCreateEnt(tile, Entity.Button, lab, new Action.OpenLevel());
    });
  }
}

class Floor extends Trait{
  init(){
    super.init();
    this.layer = layers.Ground;
  }
}

class Concrete extends Trait{
  render(g){
    g.fillStyle = '#808080';
    g.fillRect(0, 0, 1, 1);
  }
}

class Text extends Trait{
  new(ent, str){
    super.new(ent);

    this.str = String(str);
  }

  render(g){
    const {gs} = g;

    g.fillStyle = '#000';
    g.fillText(this.str, .5 - gs, .5 + gs);
  }

  *serData(ser){
    ser.writeStr(this.str);
  }

  *deserData(ser){
    this.str = ser.readStr();
  }

  *inspectData(){
    return [
      new BasicInfo(`str = ${O.sf(this.str)} :: String`),
    ];
  }
}

class Button extends ActiveTrait{
  init(){
    super.init();

    this.layer = layers.FloorObj;
  }

  new(ent, action=null){
    super.new(ent);

    this.action = action;
  }

  render(g){
    const {gs} = g;

    const s = .8;
    const r = .2;

    const s1 = 1 - s;
    const sh = s / 2;
    const s1h = s1 / 2;
    const s1h1 = 1 - s1h;

    const p1 = s1h + r;
    const p2 = 1 - p1;

    g.fillStyle = '#89a';
    g.beginPath();
    g.moveTo(p1, s1h - gs);

    g.lineTo(p2, s1h - gs);
    g.arc(p2, p1, r, pi * 1.5, pi * 2);

    g.lineTo(s1h1, p2);
    g.arc(p2, p2, r, 0, pi * .5);

    g.lineTo(p1, s1h1);
    g.arc(p1 + gs, p2, r, pi * .5, pi);
    g.lineTo(s1h, p2);

    g.lineTo(s1h, p1);
    g.arc(p1 + gs, p1, r, pi, pi * 1.5);

    g.fill();
    g.stroke();
  }

  exec(){
    const {world, ent, action} = this;
    if(action === null) return;

    const labs = [...O.mapg(ent.getTraits(Text), trait => {
      return trait.str;
    })];

    action.exec(this, labs);
  }

  click(n){
    if(n) return;
    const {world, tile} = this;

    if(world.evts.lmb !== tile) return;

    this.exec();
  }

  press(n){
    if(n) return;
    const {world, tile} = this;

    const pressed = (
      tile.hasTrait(Trait.Solid) ||
      tile.hasTrait(Trait.Item)
    );

    if(!pressed) return;

    world.reqCreateEnt(tile, Entity.ElectricalSource);
  }

  *serData(ser){
    const {action} = this;

    if(action === null){
      ser.write(0);
      return;
    }

    ser.write(1);
    yield [[action, 'serm'], ser];
  }

  *deserData(ser){
    this.action = ser.read() ?
      yield [[Action, 'deserm'], ser] :
      null;
  }

  *inspectData(){
    const {action} = this;

    const actionStr = action !== null ?
      `Just ${action.ctor.name}` : 'Nothing';

    return [
      new DetailedInfo(`action = ${actionStr} :: Maybe Action`,
        action !== null ? yield [[action, 'inspectData']]: [],
      ),
    ];
  }
}

class Lock extends Trait{
  init(){
    super.init();

    this.layer = layers.Wall;
  }

  render(g){
    const {gs} = g;

    const y = .45;
    const h = .35;
    const hh = h / 2;
    const ym = y + hh;
    const r = .04;
    const r2 = r * 2;
    const r3 = r * 3;

    g.fillStyle = 'white';
    g.beginPath();
    g.arc(.5, y, .25, pi, pi * 2.1);
    g.arc(.5, y, .15, pi * 2.1, pi, 1);
    g.fill();
    g.stroke();

    g.fillStyle = 'rgb(249,174,87)';
    g.beginPath();
    g.rect(.2, y, .6, h);
    g.fill();
    g.stroke();

    g.fillStyle = 'black';
    drawCirc(g, .5, ym - .025, r);
    g.beginPath();
    g.moveTo(.5 + gs, ym - gs * 2);
    g.lineTo(.5 + r2 + gs, ym + r3);
    g.lineTo(.5 - r2, ym + r3);
    g.lineTo(.5, ym - gs);
    g.closePath();
    g.fill();
  }
}

class Entered extends Trait{}

class Swap extends Trait{
  init(){
    super.init();

    this.layer = layers.Object;
  }

  render(g){
    const {gs} = g;

    g.concaveMode = 1;

    g.fillStyle = 'rgb(96,180,180)';
    g.beginPath();
    g.moveTo(.5, 0);
    g.lineTo(.7, .2);
    g.lineTo(.6, .2);
    g.lineTo(.6, .4);
    g.lineTo(.8, .4);
    g.lineTo(.8, .3);
    g.lineTo(1, .5);
    g.lineTo(.8, .7);
    g.lineTo(.8, .6);
    g.lineTo(.6, .6);
    g.lineTo(.6, .8);
    g.lineTo(.7, .8);
    g.lineTo(.5, 1);
    g.lineTo(.3, .8);
    g.lineTo(.4, .8);
    g.lineTo(.4, .6);
    g.lineTo(.2, .6);
    g.lineTo(.2, .7);
    g.lineTo(0, .5);
    g.lineTo(.2, .3);
    g.lineTo(.2, .4);
    g.lineTo(.4, .4);
    g.lineTo(.4, .2);
    g.lineTo(.3, .2);
    g.closePath();
    g.fill();
    g.stroke();

    g.concaveMode = 0;
  }

  swap(n){
    if(n) return;
    const {tile, ent} = this;

    for(const navTarget of tile.getTraits(NavigationTarget))
      reqMoveEnt(ent, navTarget.src.tile);
  }
}

class Wire extends Trait{
  new(ent, active=0){
    super.new(ent);

    this.active = active;
  }

  render(g){
    const {tile} = this;
    let dirs = 0;

    for(const [adj, dir] of tile.adjs){
      if(!adj.hasTrait(Wire)) continue;
      dirs |= 1 << dir;
    }

    g.fillStyle = this.active ? '#0f0' : '#080';
    g.drawTube(0, 0, dirs, .25, 1);
  }

  turnOff(n){
    if(n) return;
    if(!this.active) return;

    this.active = 0;
    this.notify();
  }

  *serData(ser){
    ser.write(this.active ? 1 : 0);
  }

  *deserData(ser){
    this.active = ser.read();
  }

  *inspectData(){
    return [
      new BasicInfo(`active = ${inspectBool(this.active)} :: Bool`),
    ];
  }
}

class ElectricalSource extends Trait{
  turnWiresOn(n){
    if(n) return;

    const {world, tile, ent} = this;

    tile.iter(tile => {
      let found = 0;

      for(const wire of tile.getTraits(Wire)){
        if(wire.active) continue;

        wire.active = 1;
        wire.notify();

        found = 1;
      }

      return found ? null : 0;
    });

    world.reqRemoveEnt(ent);
  }
}

class DigitalDoor extends Trait{
  render(g){
    const {gs} = g;

    g.fillStyle = '#f80';

    if(this.isOpen){
      g.beginPath();
      g.moveTo(0, 0);
      g.arc(0, .25 + gs / 2, .25, pi * 3 / 2, pi * 5 / 2);
      g.closePath();
      g.fill();
      g.stroke();

      g.beginPath();
      g.moveTo(1, 1);
      g.arc(1, .75, .25 - gs, pi / 2, pi * 3 / 2);
      g.closePath();
      g.fill();
      g.stroke();

      return;
    }

    g.fillRect(0, 0, 1, 1);

    g.beginPath();
    g.moveTo(.5, 0);
    g.arc(.5, .25 + gs / 2, .25, pi * 3 / 2, pi * 5 / 2);
    g.arc(.5, .75, .25 - gs, pi * 3 / 2, pi / 2, 1);
    g.stroke();
  }

  get isOpen(){
    return !this.ent.hasTrait(Solid);
  }

  update(n){
    if(n) return;

    const {world, tile, ent} = this;
    const {isOpen} = this

    if(isPowered(tile)){
      if(isOpen) return;
    
      for(const trait of ent.getTraits(Solid))
        trait.remove();
      
      return;
    }

    if(!isOpen) return;
    if(tile.hasTrait(Solid)) return;

    ent.createTrait(Solid);
  }
}

const reqMoveEnt = (ent, tileNew, direct=0, strong=0) => {
  assert(ent instanceof Entity);
  const {world} = ent;
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

const isPowered = tile => {
  for(const wire of tile.getTraits(Wire))
    if(wire.active)
      return 1;

  return 0;
};

const handlersArr = [
  [Player, 'navigate'],
  [Button, 'click'],
  [Pushable, 'push'],
  [Swap, 'swap'],
  [Solid, 'stop'],
  [NavigationTarget, 'navigate'],
  [Button, 'press'],
  [Wire, 'turnOff'],
  [ElectricalSource, 'turnWiresOn'],
  [DigitalDoor, 'update'],
  [Diamond, 'collect'],
  [Player, 'restart'],
  [Player, 'exit'],
];

const handlersMap = new CtorsMap();

for(const info of handlersArr){
  const [ctor, methodName] = info;
  const method = ctor.prototype[methodName];

  info[1] = method;
  handlersMap.add(ctor, method);
}

const ctorsArr = [
  ActiveTrait,

  Meta,
  NavigationTarget,

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
  Button,
  Lock,
  Swap,
  Entered,
  DigitalDoor,
  Wire,
  Text,
  ElectricalSource,
];

const ctorsObj = ctorsPri(ctorsArr);

module.exports = Object.assign(Trait, {
  handlersArr,
  handlersMap,

  ctorsArr,
  ...ctorsObj,
});

const Grid = require('./grid');
const Entity = require('./entity');
const Action = require('./action');