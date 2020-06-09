'use strict';

class CoordsCollection{
  constructor(x=null, y=null){
    this.map = new O.Map2D();
    this.arr = [];

    if(x !== null)
      this.add(x, y);
  }

  reset(x=null, y=null){
    this.map.reset();
    this.arr.length = 0;

    if(x !== null)
      this.add(x, y);
  }

  empty(){
    this.reset();
  }

  len(){
    return this.arr.length >> 1;
  }

  isEmpty(){
    return this.len() === 0;
  }

  eq(cc){
    if(this.len() !== cc.len()) return 0;
    return !this.some((x, y) => !cc.has(x, y));
  }

  neq(cc){
    return !this.eq(cc);
  }

  has(x, y){
    return this.map.has(x, y);
  }

  add(x, y, top=1){
    const {map, arr} = this;

    if(!map.has(x, y)){
      map.add(x, y, arr.length);
      arr.push(x, y);
      return;
    }

    if(!top) return;

    const i = map.get(x, y);
    const j = arr.length - 2;
    if(i === j) return;

    const x1 = arr[j];
    const y1 = arr[j + 1];

    map.set(x, y, j);
    map.set(x1, y1, i);
    arr[j] = x, arr[j + 1] = y;
    arr[i] = x1, arr[i + 1] = y1;
  }

  push(x, y){
    this.add(x, y);
  }

  remove(x, y){
    const {map, arr} = this;
    if(!map.has(x, y)) return;

    const i = map.get(x, y);
    this.removeByIndex(i);
  }

  delete(x, y){
    this.remove(x, y);
  }

  del(x, y){
    this.remove(x, y);
  }

  removeByIndex(i){
    const {map, arr} = this;
    const j = arr.length - 2;

    const x = arr[i];
    const y = arr[i + 1];
    map.remove(x, y);

    if(i !== j){
      const x1 = arr[j];
      const y1 = arr[j + 1];

      map.set(x1, y1, i);
      arr[i] = x1, arr[i + 1] = y1;
    }

    arr.length = j;
  }

  pop(v){
    return this.getByIndex(v, this.arr.length - 2, 1);
  }

  rand(v, remove=0){
    return this.getByIndex(v, O.rand(this.arr.length) & ~1, remove);
  }

  getByIndex(v, i, remove=0){
    const {arr} = this;
    if((i & 1) || i < 0 || i >= arr.length) return null;

    v.x = arr[i];
    v.y = arr[i + 1];

    if(remove)
      this.removeByIndex(i);

    return v;
  }

  iter(func){ return this.map.iter(func); }
  some(func){ return this.map.some(func); }
  find(v, func){ return this.map.find(v, func); }
  [Symbol.iterator](){ return this.map[Symbol.iterator](); }
}

module.exports = CoordsCollection;