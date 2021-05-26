'use strict';

const assert = require('assert');
const CtorsMap = require('./ctors-map');

class SerializerBase extends O.IO{
  static #abuf = new ArrayBuffer(8);
  static #view = new DataView(this.#abuf);

  constructor(buf, checksum=0){
    super(buf, checksum);
  }

  write(num, mod=2){
    return this.write1(num, mod - 1);
  }

  read(mod=2){
    return this.read1(mod - 1);
  }

  write1(num, max=1){
    num |= 0;
    max |= 0;
    if(max === 0) return;

    let mask = 1;
    while(mask <= max) mask <<= 1;

    let limit = 1;

    while(mask !== 0){
      if(!limit || (max & mask)){
        let bit = num & mask ? 1 : 0;
        super.write(bit);
        if(!bit) limit = 0;
      }

      mask >>= 1;
    }

    return this;
  }

  read1(max=1){
    max |= 0;
    if(max === 0) return 0;

    let mask = 1;
    while(mask <= max) mask <<= 1;

    let limit = 1;
    let num = 0;

    while(mask !== 0){
      num <<= 1;

      if(!limit || (max & mask)){
        let bit = super.read();
        if(bit) num |= 1;
        else limit = 0;
      }

      mask >>= 1;
    }

    return num;
  }

  writeInt(num, signed=1){
    num |= 0;

    const snum = num;
    num = -~(num >= -num ? num : -num);

    while(num !== 1){
      super.write(1);
      super.write(num & 1 ? 1 : 0);
      num >>= 1;
    }

    super.write(0);

    if(signed && snum !== 0)
      super.write(snum < 0);

    return this;
  }

  readInt(signed=1){
    let num = 0;
    let mask = 1;

    while(super.read()){
      if(super.read()) num |= mask;
      mask <<= 1;
    }

    num = ~-(num | mask);

    if(signed && num !== 0 && super.read())
      num = -num;

    return num;
  }

  writeUint(num){
    return this.writeInt(num, 0);
  }

  readUint(){
    return this.readInt(0);
  }

  writeFloat(f){
    const view = this.constructor.#view;
    view.setFloat32(0, f, 1);
    for(let i = 0; i !== 4; i++)
      this.write1(view.getUint8(i), 255);
    return this;
  }

  readFloat(){
    const view = this.constructor.#view;
    for(let i = 0; i !== 4; i++)
      view.setUint8(i, this.read1(255));
    return view.getFloat32(0, 1);
  }

  writeDouble(f){
    const view = this.constructor.#view;
    view.setFloat64(0, f, 1);
    for(let i = 0; i !== 8; i++)
      this.write1(view.getUint8(i), 255);
    return this;
  }

  readDouble(){
    const view = this.constructor.#view;
    for(let i = 0; i !== 8; i++)
      view.setUint8(i, Number(this.read1(255)));
    return view.getFloat64(0, 1);
  }

  writeBuf(buf){
    this.writeUint(buf.length);

    for(const byte of buf)
      this.write1(byte, 255);

    return this;
  }

  readBuf(){
    const len = Number(this.readUint());
    const buf = O.Buffer.alloc(len);

    for(let i = 0; i !== len; i++)
      buf[i] = Number(this.read1(255));

    return buf;
  }

  writeStr(str){
    return this.writeBuf(O.Buffer.from(str, 'utf8'));
  }

  readStr(){
    return this.readBuf().toString('utf8');
  }

  getOutput(checksum=0, encoding=null, trim=1){
    let buf = super.getOutput(checksum);
    let len = buf.length;

    if(trim && len !== 0 && buf[len - 1] === 0){
      let i = len - 1;
      for(; i !== -1; i--)
        if(buf[i] !== 0) break;
      buf = O.Buffer.from(buf.slice(0, i + 1));
    }

    if(encoding !== null) buf = buf.toString(encoding);
    return buf;
  }
}

class Serializer extends SerializerBase{
  ctorMap = new Map();

  getCtorInfo(ctor){
    const map = this.ctorMap;

    if(!map.has(ctor))
      map.set(ctor, [[], new Map()]);

    return map.get(ctor);
  }

  getCtorArr(ctor){
    return this.getCtorInfo(ctor)[0];
  }

  getCtorMap(ctor){
    return this.getCtorInfo(ctor)[1];
  }

  addObj(obj){
    const [arr, map] = this.getCtorInfo(obj.baseCtor);

    assert(!map.has(obj));

    arr.push(obj);
    map.set(obj, map.size);
  }

  *writeArr(arr){
    this.writeInt(arr.length);

    for(const elem of arr)
      yield [[elem, 'serm'], this];

    return this;
  }

  *readArr(ctor){
    assert(ctor);

    const len = this.readInt();
    const arr = [];

    for(let i = 0; i !== len; i++)
      arr.push(yield [[ctor, 'deserm'], this]);

    return arr;
  }

  *writeSet(set){
    this.writeInt(set.size);

    for(const elem of set)
      yield [[elem, 'serm'], this];

    return this;
  }

  *readSet(ctor){
    assert(ctor);

    const size = this.readInt();
    const set = new Set();

    for(let i = 0; i !== size; i++)
      set.add(yield [[ctor, 'deserm'], this]);

    return set;
  }

  *writeCtorsMap(cmap){
    this.writeInt(cmap.size);

    for(const val of cmap.vals)
      yield [[val, 'serm'], this];
  
    return this;
  }

  *readCtorsMap(ctor){
    assert(ctor);

    const size = this.readInt();
    const cmap = new CtorsMap();

    for(let i = 0; i !== size; i++)
      cmap.add(yield [[ctor, 'deserm'], this]);

    return cmap;
  }
}

module.exports = Serializer;