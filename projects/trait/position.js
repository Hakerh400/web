'use strict';

const assert = require('assert');
const inspect = require('./inspect');
const Serializable = require('./serializable');
const info = require('./info');
const ctorsPri = require('./ctors-pri');

const {
  BasicInfo,
  DetailedInfo,
} = info;

class Position extends inspect.Inspectable{
  new(grid=null){
    super.new();
    this.grid = grid;
  }
}

class Rectangle extends Position{
  new(x, y){
    super.new();

    this.x = x;
    this.y = y;
  }

  *ser(ser){
    yield [[this, 'serCtor'], ser];

    const {grid} = this;
    assert(grid !== null);

    const {w, h} = grid;

    ser.write(this.x, w);
    ser.write(this.y, h);
  }

  *inspect(){
    return new DetailedInfo('pos :: Position', [
      new BasicInfo(`x = ${this.x} :: Int`),
      new BasicInfo(`y = ${this.y} :: Int`),
    ]);
  }
}

const ctorsArr = [
  Rectangle,
];

const ctorsObj = ctorsPri(ctorsArr);

module.exports = Object.assign(Position, {
  ctorsArr,
  ...ctorsObj,
});