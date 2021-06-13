'use strict';

const assert = require('assert');
const CtorsMap = require('./ctors-map');
const Inspectable = require('./inspectable');
const Serializable = require('./serializable');
const info = require('./info');
const layers = require('./layers');
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

  static onRemoveGlobData(data){}

  init(){
    super.init();

    this.locDataEnts = new Set();
    this.layer = null;
    this.itemRaw = null;
  }

  new(ent, dir=0){
    super.new();

    this.ent = ent;
    this.baseDir = dir;

    this.onCreate();
  }

  get valid(){
    return (
      this.ent?.
      tile?.
      grid?.
      room?.
      world
    );
  }

  get pos(){ return this.ent.pos; }
  get tile(){ return this.ent.tile; }
  get grid(){ return this.ent.grid; }
  get room(){ return this.ent.room; }
  get world(){ return this.ent.world; }

  get dir(){
    return this.ent.dir + this.baseDir & 3;
  }

  get item(){
    const item = this.itemRaw;
    if(item === null) return null;

    assert(item.valid);
    assert(item.trait === this);

    return item;
  }

  set item(item){
    const itemPrev = this.item;

    if(item !== null){
      assert(itemPrev === null);
      assert(item.trait === null);
      assert(!item.deleted);

      this.itemRaw = item;
      item.trait = this;

      assert(item.valid);
      return;
    }

    assert(itemPrev !== null);

    this.itemRaw = null;
    itemPrev.trait = null;
  }

  adj(dir){
    const {tile} = this;

    if(dir === null) return tile;
    return tile.adj(this.dir + dir & 3);
  }

  notify(delay){ this.ent.notify(delay); }

  notifySilent(){
    this.world.notifiedTraits.add(this);
  }

  getGlobData(){ return this.ent.getGlobData(this.ctor); }
  getLocData(){ return this.ent.getLocData(this); }

  entHasTrait(traitCtor){ return this.ent.hasTrait(traitCtor); }

  render(g){}
  onCreate(){}
  onRemove(rm){}

  remove(rm=0){
    this.onRemove(rm);

    const {world, item} = this;

    if(item !== null)
      world.reqDeleteItem(item);

    for(const ent of this.locDataEnts)
      ent.locData.delete(this);

    this.ent.removeTrait(this);
    this.ent = null;
  }

  *ser(ser){
    const {layer, item} = this;

    yield [[this, 'serCtor'], ser];

    ser.write(this.baseDir, 4);

    if(layer === null){
      ser.write(0);
    }else{
      ser.write(1);
      ser.write(layer, layersNum);
    }

    if(item === null){
      ser.write(0);
    }else{
      ser.write(1);
      yield [[item, 'serm'], ser];
    }

    yield [[this, 'serData'], ser];
  }

  static *deser(ser){
    const ctor = yield [[this, 'deserCtor'], ser];
    const trait = ctor.new();
    
    ent.baseDir = ser.read(4);

    const layer = ctor.layer = ser.read() ?
      ser.read(layersNum) : null;

    const item = trait.itemRaw = ser.read() ?
      yield [[Item, 'deserm'], ser] : null;

    if(item !== null)
      item.trait = trait;

    yield [[trait, 'deserData'], ser];

    return trait;
  }

  *serData(ser){}
  *deserData(ser){}

  static *serEntGlobData(ser, data){ O.virtual('serEntGlobData'); }
  static *deserEntGlobData(ser, data){ O.virtual('deserEntGlobData'); }

  *serEntLocData(ser, data){ O.virtual('serEntLocData'); }
  // *deserEntLocData(ser){ O.virtual('deserEntLocData'); }

  *inspectData(){
    return [];
  }

  *inspect(){
    const {layer, item} = this;

    const layerInfo = new BasicInfo(
      `layer = ${layer !== null ?
        `Just ${this.layer}` :
        `Nothing`} :: Maybe Int`);

    let itemInfo;

    if(item === null){
      itemInfo = new BasicInfo(`item = Nothing :: Maybe Item`);
    }else{
      const {details} = yield [[item, 'inspect']];
      itemInfo = new DetailedInfo(`item = Just ${item.ctor.name} :: Maybe Item`, details);
    }

    return new DetailedInfo(`trait :: ${this.ctor.name}`, [
      new BasicInfo(`baseDir = ${this.inspectDir(this.dir)}`),
      layerInfo,
      itemInfo,
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
  new(ent){
    super.new(ent);
    this.room.addActiveTrait(this);
  }

  onRemove(rm){
    super.onRemove(rm);
    this.room.removeActiveTrait(this);
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

  onRemove(rm){
    super.onRemove(rm);

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
      new BasicInfo(`direct = ${this.inspectBool(this.direct)}`),
      new BasicInfo(`strong = ${this.inspectBool(this.strong)}`),
    ];
  }
}

class Player extends ActiveTrait{
  new(ent, levelEnt){
    super.new(ent);

    assert(levelEnt instanceof Entity);
    this.levelEnt = levelEnt;
  }

  init(){
    super.init();
    this.layer = layers.Object;
  }

  onRemove(rm){
    super.onRemove(rm);
    if(rm) return;

    this.restart();
  }

  render(g){
    const {item} = this;

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

    if(item){
      g.save();
      g.translate(.5, .5);
      g.scale(.5);
      item.render(g);
      g.restore();
    }
  }

  applyItem(n){
    if(n) return;
    const {world, tile, ent, item} = this;

    if(item === null) return;
    if(!world.evts.applyItem) return;

    const dir = world.evts.nav;

    const target = dir !== null ?
      this.adj(dir) :
      tile;

    item.apply(target);
  }

  navigate(n){
    if(n) return;
    const {world, tile, ent} = this;

    if(world.evts.applyItem) return;

    const dir = world.evts.nav;
    if(dir === null) return;

    const tileNew = this.adj(dir);
    if(tileNew === null) return;

    moveEnt(ent, tileNew, 1, 1);
  }

  checkGround(n){
    if(n) return;
    const {tile, ent} = this;

    if(tile.hasTrait(Ground)) return;
    ent.remove();
  }

  checkRestart(n){
    if(n) return;
    const {world} = this;

    if(!world.evts.restart) return;

    this.restart();    
  }

  exit(n){
    if(n) return;
    const {world, grid} = this;

    if(!world.evts.exit) return;

    exitToMenu(this.menu);
  }

  pickOrDropItem(n){
    if(n) return;
    const {world, tile} = this;

    if(!world.evts.pickOrDropItem) return;

    if(!this.item){
      const itemTrait = tile.getTrait(ItemTrait);
      if(!itemTrait) return;

      const {item} = itemTrait;
      if(!item) return;

      world.reqPickItem(itemTrait, this);
      return;
    }

    if(tile.hasTrait(ItemTrait)) return;

    world.reqDropItem(this);
  }

  restart(){
    const {world, levelEnt} = this;

    exitToMenu(this.menu, () => {
      if(!levelEnt) return;

      const {tile} = levelEnt;
      const btn = tile.getTrait(Button);
      if(!btn) return;

      btn.exec();
    });
  }

  get menu(){
    const {levelEnt} = this;
    if(!levelEnt?.valid) return null;

    return levelEnt.room;
  }

  *serData(ser){
    yield [[this.levelEnt, 'serm'], ser];
  }

  *deserData(ser){
    this.levelEnt = yield [[Entity, 'deserm'], ser];
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

    g.fillStyle = '#444';
    g.fillRect(0, 0, 1, 1);

    g.strokeStyle = '#888';
    g.beginPath();

    const w = .45;
    const h = .20;
    const space = .05;

    const dx = w + space;
    const dy = h + space;

    const x1 = dx * .4 / 1.4 + gs;
    const y1 = -dy / 2 + gs;

    let i = 0;

    for(let yy = y1;; yy += dy){
      const offset = dx / 2 * (i++ % 2);

      g.moveTo(0, yy);
      g.lineTo(1, yy);

      for(let xx = x1 + offset; xx < 1; xx += dx){
        g.moveTo(xx, yy - dy);
        g.lineTo(xx, yy);
      }

      if(yy > 1) break;
    }

    g.stroke();
    g.strokeStyle = '#000';
  }
}

class Pushable extends Trait{
  push(n){
    const {world, room, tile, ent} = this;
    const heavy = this.entHasTrait(Heavy);

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

    moveEnt(ent, tileNew, 0, heavy ? 0 : 1);
    return 1;
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

    g.concaveMode = 1;
    g.fillStyle = '#ff0';
    g.beginPath();
    g.rect(.25, .25, .5, .5);
    g.fill();
    g.stroke();
    g.concaveMode = 0;
  }

  checkGround(n){
    if(n) return;
    const {world, tile, ent} = this;

    if(tile.hasTrait(Ground)) return;

    if(tile.hasTrait(Water)){
      removeEnt(ent);
      removeEnts(tile, Water);

      const hasWire = ent.hasTrait(Wire);
      createEnt(tile, Entity.WoodenGround, {wire: hasWire});

      return;
    }

    removeEnt(ent);
  }
}

class Heavy extends Trait{}

class ItemTrait extends Trait{
  init(){
    super.init();
    this.layer = layers.Item;
  }

  new(ent, itemCtor, ...args){
    super.new(ent);

    if(itemCtor instanceof Item){
      assert(args.length === 0);

      const item = itemCtor;

      setItem: {
        check: {
          if(item.deleted) break check;

          this.item = item;

          if(!item.valid){
            item.delete();
            break check;
          }

          break setItem;
        }

        removeEnt(ent);
      }
    }else{
      this.item = new itemCtor(null, ...args);
    }
  }

  render(g){
    const {item} = this;
    if(!item) return;

    item.render(g);
  }
}

class Diamond extends Trait{
  init(){
    super.init();
    this.layer = layers.Treasure;
  }

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

    const player = tile.getTrait(Player);
    if(!player) return;

    const {menu, levelEnt} = player;

    exitToMenu(menu, () => {
      if(!levelEnt) return;

      const {grid} = menu;
      const {w, h} = grid;
      const {x, y} = levelEnt.pos;

      const i = x + y * w + 1;
      const x1 = i % w;
      const y1 = i / w | 0;

      const text = levelEnt.getTrait(Text);
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

class Ground extends Trait{
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

class UnstableGround extends Trait{
  render(g){
    g.fillStyle = '#808080';

    const s = 1 / 7;

    g.beginPath();
    g.moveTo(s * 2, 0);
    g.lineTo(s * 4, 0);
    g.lineTo(0, s * 4);
    g.lineTo(0, s * 2);
    g.closePath();
    g.fill();
    g.stroke();

    g.beginPath();
    g.moveTo(s * 6, 0);
    g.lineTo(1, 0);
    g.lineTo(1, s);
    g.lineTo(s, 1);
    g.lineTo(0, 1);
    g.lineTo(0, s * 6);
    g.closePath();
    g.fill();
    g.stroke();

    g.beginPath();
    g.moveTo(1, s * 3);
    g.lineTo(1, s * 5);
    g.lineTo(s * 5, 1);
    g.lineTo(s * 3, 1);
    g.closePath();
    g.fill();
    g.stroke();
  }

  collapse(n){
    if(n) return;
    const {tile, ent} = this;

    if(!tile.hasTrait(Solid)) return;

    removeEnt(ent);
  }
}

class WoodenGround extends Trait{
  render(g){
    g.fillStyle = '#8a0';
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

class Button extends Trait{
  init(){
    super.init();

    this.layer = layers.GroundObj;
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
    ) | 0;

    const status = pressed ? 1 : 0;

    for(const wire of tile.getTraits(Wire)){
      // if(wire.getStatus(0) === null && wire.active === pressed)
      //   continue;
      
      wire.updateRec(status);
    }
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
      moveEnt(ent, navTarget.src.tile);
  }

  checkGround(n){
    if(n) return;
    const {tile, ent} = this;

    if(tile.hasTrait(Ground)) return;
    ent.remove();
  }
}

class ElectronicBase extends Trait{
  new(ent){
    super.new(ent);

    ent.createTrait(Electronic);
  }

  onRemove(rm){
    super.onRemove(rm);
    removeTraits(this.ent, Electronic);
  }
}

class Electronic extends Trait{}

class WireBase extends ElectronicBase{
  static wiresMap = new WeakMap();

  init(){
    super.init();

    this.statusInfo = new WeakMap();
    this.status = O.ca(this.infoSize, () => 0);
  }

  new(ent, ...args){
    super.new(ent);

    const {infoSize} = this;
    assert(args.length <= infoSize);

    while(args.length !== infoSize)
      args.push(0);

    for(let i = 0; i !== infoSize; i++)
      this.status[i] = args[i] | 0;
  }

  get infoSize(){ O.virtual('infoSize'); }

  getStatusArr(){
    const {world, statusInfo} = this;
    const {tickId} = world;

    if(!statusInfo.has(tickId))
      statusInfo.set(tickId, O.ca(this.infoSize, () => null));

    return statusInfo.get(tickId);
  }

  getStatus(index){
    const statusArr = this.getStatusArr();
    assert(index < statusArr.length);

    return statusArr[index];
  }

  setStatus(index, status){
    const {world, statusInfo} = this;
    const {tickId} = world;

    const statusArr = this.getStatusArr();
    assert(index < statusArr.length);

    const statusOld = statusArr[index];

    assert(status === -1 || status === 0 || status === 1);

    if(statusOld === 2) return;
    if(statusOld === status) return;

    this.notify();

    if(statusOld === null || statusOld === -1){
      statusArr[index] = status;
      return;
    }

    if(status === -1) return;

    statusArr[index] = 2;
  }

  update(n){
    if(n) return;
    const {infoSize} = this;

    let found = 0;

    for(let i = 0; i !== infoSize; i++){
      let status = this.getStatus(i);

      if(status === null) continue;
      if(status === 2) continue;

      if(status === -1)
        status = 0;

      if(status === this.status[i]) continue;

      this.status[i] = status;
      found = 1;
    }

    if(found) this.notify(1);
  }

  *serData(ser){
    for(const status of this.status){
      assert(status === 0 || status === 1);
      ser.write(status);
    }
  }

  *deserData(ser){
    const {infoSize, status} = this;
    assert(status.length === infoSize);

    for(let i = 0; i !== infoSize; i++)
      status[i] = ser.read();
  }
}

class Wire extends WireBase{
  get infoSize(){ return 1; }

  render(g){
    const {tile} = this;
    const {gs} = g;
    const gsh = gs / 2;

    let dirs = 0;

    for(const [adj, dir] of tile.adjs)
      if(adj.hasTrait(Electronic))
        dirs |= 1 << dir;

    g.fillStyle = this.status[0] ? '#0f0' : '#080';
    drawTube(g, dirs, .2, 1);
  }

  get active(){ return this.status[0]; }
  set active(a){ this.status[0] = a; }

  cooldown(n){
    if(n) return;

    if(!this.active) return;
    if(this.getStatus(0) === -1) return;

    this.updateRec(-1);
  }

  updateRec(status){
    const {tile} = this;

    const seen = O.ca(2, () => new Set());
    const stack = [];

    const add = (tile, index) => {
      if(tile === null) return;

      const set = seen[index];
      if(set.has(tile)) return;

      set.add(tile);
      stack.push([tile, index]);
    };

    add(tile, 0);
    add(tile, 1);

    while(stack.length !== 0){
      const [tile, index] = stack.pop();
      let found = 0;

      for(const wire of tile.getTraits(Wire)){
        wire.setStatus(0, status);
        found = 2;
      }

      for(const wireOverlap of tile.getTraits(WireOverlap)){
        wireOverlap.setStatus(index, status);
        found = 1;
      }

      if(found === 0) continue;

      if(found === 2 || index === 0){
        add(tile.adj(0), 0);
        add(tile.adj(2), 0);
      }

      if(found === 2 || index === 1){
        add(tile.adj(1), 1);
        add(tile.adj(3), 1);
      }
    }
  }

  *inspectData(){
    return [
      new BasicInfo(`active = ${this.inspectBool(this.active)}`),
    ];
  }
}

class WireOverlap extends WireBase{
  get infoSize(){ return 2; }

  get activeV(){ return this.status[0]; }
  set activeV(a){ this.status[0] = a; }

  get activeH(){ return this.status[1]; }
  set activeH(a){ this.status[1] = a; }

  render(g){
    const {gs} = g;

    g.fillStyle = this.activeV ? '#0f0' : '#080';
    g.beginPath();
    g.rect(.4, 0, .2, 1);
    g.fill();
    g.stroke();

    g.fillStyle = this.activeH ? '#0f0' : '#080';
    g.beginPath();
    g.moveTo(0, .4);
    g.lineTo(.4, .4);
    g.arc(.5/* + gs / 2*/, .4, .1/* - gs*/, pi, pi2);
    g.lineTo(.6, .4);
    g.lineTo(1, .4);
    g.lineTo(1, .6);
    g.lineTo(.6, .6);
    g.arc(.5/* + gs / 2*/, .6, .1/* - gs*/, pi2, pi, 1);
    g.lineTo(.4, .6);
    g.lineTo(0, .6);
    g.closePath();
    g.fill();
    g.stroke();
  }

  *inspectData(){
    return [
      new BasicInfo(`activeV = ${this.inspectBool(this.activeV)}`),
      new BasicInfo(`activeH = ${this.inspectBool(this.activeH)}`),
    ];
  }
}

class LogicGate extends ActiveTrait{
  init(){
    super.init();

    this.layer = layers.GroundObj;
  }
}

class LogicGateBase extends Trait{
  new(ent, dir){
    super.new(ent, dir);

    ent.createTrait(Electronic);
  }

  onRemove(rm){
    super.onRemove(rm);
    removeTraits(this.ent, Electronic);
  }

  updateWires(n){
    if(n) return;
    const {tile, dir} = this;

    const inputs = [];
    const outputWires = [];

    for(const wire of tile.getTraits(Wire))
      inputs.push(wire.active);

    for(const wireOverlap of tile.getTraits(Wire))
      inputs.push(wireOverlap.active);

    for(const [adj, adjDir] of tile.adjs){
      const isOut = adjDir === dir;

      for(const wire of adj.getTraits(Wire)){
        if(isOut){
          outputWires.push(wire);
          continue;
        }

        inputs.push(wire.active);
      }

      for(const wireOverlap of adj.getTraits(WireOverlap)){
        if(isOut) continue;

        inputs.push(wireOverlap.status[adjDir & 1]);
      }
    }

    const output = this.apply(inputs);
    if(output === null) return;

    for(const wire of outputWires)
      wire.updateRec(output);
  }

  apply(inputs){ O.virtual('apply'); }
}

class Inverter extends LogicGateBase{
  render(g){
    g.fillStyle = '#fff';

    g.beginPath();
    g.moveTo(.2, .9);
    g.lineTo(.5, .3);
    g.lineTo(.8, .9);
    g.closePath();
    g.fill();
    g.stroke();

    drawCirc(g, .5, .2, .1);
  }

  apply(inputs){
    const input = O.uni(inputs);
    if(input === null) return null;

    return input ^ 1;
  }
}

class Disjunction extends LogicGateBase{
  render(g){
    g.fillStyle = '#fff';

    g.beginPath();
    g.moveTo(.1, .9);
    O.drawArc(g, .1, .9, .5, .1, .2);
    g.lineTo(.5, .1)
    O.drawArc(g, .5, .1, .9, .9, .2);
    O.drawArc(g, .9, .9, .1, .9, -.5);
    g.closePath();
    g.fill();
    g.stroke();
  }

  apply(inputs){
    return inputs.reduce((a, b) => a | b, 0);
  }
}

class Conjunction extends LogicGateBase{
  render(g){
    g.fillStyle = '#fff';

    g.beginPath();
    g.moveTo(.1, .7);
    g.arc(.5, .7, .4, pi, pi2);
    g.lineTo(.9, .7);
    g.closePath();
    g.fill();
    g.stroke();
  }

  apply(inputs){
    return inputs.reduce((a, b) => a & b, 1);
  }
}

class DigitalDoor extends Trait{
  render(g){
    g.fillStyle = '#f80';

    if(this.isOpen){
      g.beginPath();
      g.moveTo(0, 0);
      g.arc(0, .25, .25, pi * 3 / 2, pi * 5 / 2);
      g.lineTo(0, .5);
      g.closePath();
      g.fill();
      g.stroke();

      g.beginPath();
      g.moveTo(1, 1);
      g.arc(1, .75, .25, pi / 2, pi * 3 / 2);
      g.closePath();
      g.fill();
      g.stroke();

      return;
    }

    g.fillRect(0, 0, 1, 1);

    g.beginPath();
    g.moveTo(.5, 0);
    g.arc(.5, .25, .25, pi * 3 / 2, pi * 5 / 2);
    g.arc(.5, .75, .25, pi * 3 / 2, pi / 2, 1);
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

class OneWay extends Trait{
  init(){
    super.init();

    this.layer = layers.Wall;
  }

  render(g){
    g.globalAlpha = .3;
    g.fillStyle = '#2fa';
    g.fillRect(0, 0, 1, 1);

    g.globalAlpha = .75
    g.fillStyle = '#1a8';
    g.beginPath();
    g.moveTo(.5, .1);
    g.lineTo(.9, .9);
    g.lineTo(.8, .9);
    g.lineTo(.5, .3);
    g.lineTo(.2, .9);
    g.lineTo(.1, .9);
    g.closePath();
    g.fill();
    g.stroke();

    g.globalAlpha = 1;
  }

  stop(){
    const {world, tile, ent} = this;
    const targetTile = calcTargetTile(ent);

    const dir = this.dir + 2 & 3;

    for(const trait of targetTile.traits.get(NavigationTarget)){
      const {src} = trait;
      if(src === ent) continue;

      const entDir = src.tile.adj2dir(targetTile);
      if(entDir !== dir) continue;

      world.reqRemoveEnt(trait.ent);
    }
  }
}

class Liquid extends Trait{
  init(){
    super.init();

    this.layer = layers.Liquid;
  }
}

class Water extends Trait{
  render(g){
    g.fillStyle = '#088';
    g.fillRect(0, 0, 1, 1);
  }
}

class Tail extends Trait{
  static onRemoveGlobData(tail){
    if(!tail) return;
    tail.removeTarget();
  }

  init(){
    super.init();

    this.layer = layers.Object;
    this.target = null;

    this.potentialTargets = new Set();
  }

  onRemove(rm){
    super.onRemove(rm);
    this.removeTarget();
  }

  removeTarget(){
    const {world, target} = this;

    if(!target) return;
    if(!target.valid) return;

    this.target = null;

    world.reqModifyEntGlobData(target, Tail, ['val.set', null]);
  }

  render(g){
    const {tile, ent, target} = this;
    let dirs = 0;

    calcDirs1: {
      if(!target) break calcDirs1;
      if(!target.valid) break calcDirs1;
      if(target.getGlobData(Tail) !== this) break calcDirs1;

      const dir = tile.adj2dir(target.tile);
      if(dir === null) break calcDirs1;

      dirs |= 1 << dir;
    }

    calcDirs2: {
      const tail = ent.getGlobData(Tail);
      if(!tail) break calcDirs2;
      if(tail.target !== ent) break calcDirs2;

      const dir = tile.adj2dir(tail.tile);
      if(dir === null) break calcDirs2;

      dirs |= 1 << dir;
    }

    g.fillStyle = '#f8f';
    drawTube(g, dirs, .4);

    g.fillStyle = '#c6c';
    drawCirc(g, .5, .5, .1);
  }

  observe(n){
    if(n) return;
    const {tile, ent, potentialTargets} = this;

    assert(potentialTargets.size === 0);
    if(this.target !== null) return;

    for(const [adj] of tile.adjs){
      for(const navTarget of adj.getTraits(NavigationTarget)){
        const {src} = navTarget;

        if(src === ent) continue;
        if(src.getGlobData(Tail) !== null) continue;

        potentialTargets.add(src);
      }
    }
  }

  update(n){
    if(n) return;
    const {world, tile, potentialTargets} = this;

    if(this.target !== null){
      const {target} = this;

      assert(potentialTargets.size === 0);
      potentialTargets.clear();

      checkTarget: {
        if(!target.valid) break checkTarget;
        if(target.getGlobData(Tail) !== this) break checkTarget;
        if(!target.tile.isAdj(tile)) break checkTarget;

        return;
      }

      this.removeTarget();

      return;
    }

    const actualTargets = new Set();

    for(const target of potentialTargets){
      if(!target.valid) continue;
      if(!target.tile.isAdj(tile)) continue;

      actualTargets.add(target);
    }

    potentialTargets.clear();

    const target = O.uni(actualTargets);
    if(!target) return;

    this.target = target;

    world.reqModifyEntGlobData(target, Tail, ['val.set', this]);
  }

  follow(n){
    const {tile, ent, target} = this;

    if(calcTargetTile(ent) !== tile) return;

    if(!target) return;
    if(!target.valid) return;
    if(!target.tile.isAdj(tile)) return;

    const targetTile = calcTargetTile(target);
    if(targetTile === target.tile) return;
    if(targetTile === tile) return;

    moveEnt(ent, target.tile);
  }

  checkGround(n){
    if(n) return;
    const {tile, ent} = this;

    if(tile.hasTrait(Ground)) return;
    ent.remove();
  }

  *serData(ser){
    const {target} = this;

    if(target !== null){
      ser.write(1);
      yield [[target, 'serm'], ser];
    }else{
      ser.write(0);
    }
  }

  *deserData(ser){
    if(ser.read())
      this.target = [[Entity, 'deserm'], ser];
  }
}

class LockedDoor extends Trait{
  init(){
    super.init();
    this.layer = layers.Wall;
  }

  render(g){
    g.fillStyle = 'rgb(240,179,112)';
    g.fillRect(0, 0, 1, 1);

    g.fillStyle = '#000';
    g.beginPath();
    g.moveTo(.5, .35);
    g.lineTo(.65, .75)
    g.lineTo(.35, .75);
    g.closePath();
    g.fill();

    drawCirc(g, .5, .35, .08);
  }
}

const moveEnt = (ent, tileNew, direct=0, strong=0) => {
  assert(ent instanceof Entity);

  const {world, tile} = ent;
  const dir = tile.adj2dir(tileNew);
  const dir1 = dir + 2 & 3;

  for(const oneWay of tileNew.getTraits(OneWay))
    if(oneWay.dir === dir1) return;

  world.reqCreateEnt(tileNew, Entity.NavigationTarget, ent, direct, strong);
  // ent.notify();
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

const drawTube = (g, dirs, size, round) => {
  g.concaveMode = 1;
  g.drawTube(0, 0, dirs, size, round);
  g.concaveMode = 0;
};

const isPowered = tile => {
  for(const wire of tile.getTraits(Wire))
    if(wire.active)
      return 1;

  return 0;
};

const createEnt = (tile, traitCtor, ...args) => {
  const {world} = tile;
  world.reqCreateEnt(tile, traitCtor, ...args);
};

const removeEnt = ent => {
  const {world} = ent;
  world.reqRemoveEnt(ent);
};

const removeEnts = (tile, traitCtor) => {
  for(const ent of tile.getEnts(traitCtor))
    removeEnt(ent);
};

const removeTraits = (ent, traitCtor) => {
  for(const trait of ent.getTraits(traitCtor))
    trait.remove();
};

const exitToMenu = (menu, cb=null) => {
  if(!menu) return;

  const {world} = menu;
  const {rooms} = world;

  world.reqSelectRoom(menu);

  for(const room of world.rooms){
    if(room === menu) continue;
    world.reqRemoveRoom(room);
  }

  world.onReqDone(() => {
    if(O.uni(rooms) !== menu) return;
    if(cb === null) return;

    cb();
  });
};

const handlersArr = [
  [Player, 'pickOrDropItem'],
  [Player, 'applyItem'],
  [Player, 'navigate'],

  [Button, 'click'],
  [Pushable, 'push'],
  [Swap, 'swap'],
  [OneWay, 'stop'],
  [Tail, 'follow'],
  [Tail, 'observe'],
  [Solid, 'stop'],
  [NavigationTarget, 'navigate'],
  [Tail, 'update'],

  [Box, 'checkGround'],
  [Swap, 'checkGround'],
  [Tail, 'checkGround'],

  [Wire, 'cooldown'],
  // [WireOverlap, 'cooldown'],
  [Button, 'press'],
  [Inverter, 'updateWires'],
  [Disjunction, 'updateWires'],
  [Conjunction, 'updateWires'],
  [Wire, 'update'],
  [WireOverlap, 'update'],

  [DigitalDoor, 'update'],
  [Diamond, 'collect'],

  [Player, 'checkGround'],
  [UnstableGround, 'collapse'],

  [Player, 'checkRestart'],
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
  Liquid,
  Water,
  Ground,
  Concrete,
  UnstableGround,
  WoodenGround,

  LogicGate,
  LogicGateBase,

  Inverter,
  Disjunction,
  Conjunction,

  ItemTrait,
  Diamond,
  Button,
  Lock,
  Swap,
  Entered,
  DigitalDoor,
  LockedDoor,
  Tail,

  ElectronicBase,
  Electronic,

  WireBase,
  Wire,
  WireOverlap,

  Text,
  OneWay,
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
const Item = require('./item');
const Action = require('./action');