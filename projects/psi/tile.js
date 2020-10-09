'use strict';

const O = require('../omikron');
const Vector = require('./vector');
const Object = require('./object');

class Tile extends Vector{
  constructor(grid, x, y, z){
    super(x, y, z);

    this.grid = grid;
    this.objs = [];

    this.has = O.obj();
  }

  get len(){ return this.objs.length; }
  get fst(){ return this.len !== 0 ? this.objs[0] : null; }
  get empty(){ return this.len === 0; }
  get nempty(){ return this.len !== 0; }
  get sngl(){ return this.len === 1; }
  get mult(){ return this.len > 1; }
  get free(){ return !this.has.occupying; }
  get nfree(){ return this.has.occupying; }

  find(trait){
    for(const obj of this.objs)
      if(obj.is[trait])
        return obj;

    return null;
  }

  findm(traits){
    outer: for(const obj of this.objs){
      for(const trait of traits)
        if(!obj.is[trait])
          continue outer;

      return obj;
    }

    return null;
  }

  update(){
    this.grid.updatev(this);
    return this;
  }

  addObj(obj){
    const {objs, has} = this;

    obj.index = objs.length;
    objs.push(obj);

    for(const trait in obj.is){
      if(trait in has) has[trait]++;
      else has[trait] = 1;
    }

    if(obj.updateBound !== null) this.ael('update', obj.updateBound);
    this.update();

    return this;
  }

  removeObj(obj){
    const {objs, has} = this;
    const {index} = obj;
    const last = objs.pop();

    if(last !== obj){
      last.index = index;
      objs[index] = last;
    }

    for(const trait in obj.is)
      has[trait]--;

    if(obj.updateBound !== null) this.rel('update', obj.updateBound);
    this.update();

    return this;
  }

  purge(){
    const {objs} = this;
    const len = objs.length;

    for(let i = 0; i !== len; i++)
      objs[0].remove();

    return this;
  }

  [Symbol.iterator](){ return this.objs[Symbol.iterator](); }
};

module.exports = Tile;