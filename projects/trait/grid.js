'use strict';

const assert = require('assert');
const Tile = require('./tile');
const Position = require('./position');
const Serializable = require('./serializable');
const ctorsPri = require('./ctors-pri');

class Grid extends Serializable{
  static get baseCtor(){ return Grid; }

  init(){
    this.buildMode = 0;
  }

  new(room=null){
    super.new();
    this.room = room;
  }

  get valid(){ return this.room !== null; }
  get world(){ return this.room.world; }

  enterBuildMode(){
    assert(!this.buildMode);
    this.buildMode = 1;
  }

  exitBuildMode(){
    assert(this.buildMode);
    this.buildMode = 0;
  }

  has(pos){ O.virtual('has'); }
  getc(pos){ O.virtual('getc'); }
  get tiles(){ O.virtual('tiles'); }

  get(pos){
    if(!this.has(pos)) return null;
    return this.getc(pos);
  }

  static *deser(ser){
    const ctor = yield [[this, 'deserCtor'], ser];
    return O.tco([ctor, 'deser'], ser);
  }
}

class Rectangle extends Grid{
  new(w, h){
    super.new();
    
    this.w = w;
    this.h = h;

    this.tilesRaw = O.ca(h, y => O.ca(w, x => {
      const pos = new Position.Rectangle(x, y);
      pos.grid = this;

      return new Tile.Rectangle(this, pos);
    }));
  }

  has({x, y}){
    const {w, h} = this;

    return (
      x >= 0 && y >= 0 &&
      x < w && y < h
    );
  }

  getc({x, y}){
    return this.tilesRaw[y][x];
  }

  get tiles(){
    const grid = this;

    return function*(){
      for(const row of grid.tilesRaw)
        yield* row;
    }();
  }

  getp(x, y){
    return this.tilesRaw[y][x];
  }

  createEnt(x, y, entCtor, ...args){
    const tile = this.getp(x, y);
    return tile.createEnt(entCtor, ...args);
  }

  *ser(ser){
    yield [[this, 'serCtor'], ser];

    ser.writeInt(this.w);
    ser.writeInt(this.h);

    for(const tile of this.tiles)
      yield [[tile, 'serm'], ser];
  }

  static *deser(ser){
    const grid = Rectangle.new();

    const w = grid.w = ser.readInt();
    const h = grid.h = ser.readInt();

    grid.tilesRaw = yield [O.car, h, function*(y){
      return O.tco(O.car, w, function*(x){
        const pos = new Position.Rectangle(x, y);
        pos.grid = grid;

        const tile = yield [[Tile, 'deserm'], ser];

        tile.grid = grid;
        tile.pos = pos;

        return tile;
      });
    }];

    return grid;
  }
}

const ctorsArr = [
  Rectangle,
];

const ctorsObj = ctorsPri(ctorsArr);

module.exports = Object.assign(Grid, {
  ctorsArr,
  ...ctorsObj,
});