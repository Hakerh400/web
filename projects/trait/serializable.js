'use strict';

const assert = require('assert');
const Serializer = require('./serializer');

const kNewDeser = Symbol('newDeser');

class SerializableBase{
  init(){}
  new(){}
}

class Serializable extends SerializableBase{
  static get baseCtor(){ return this; }

  static new(){
    const obj = new this(kNewDeser);
    obj.init();
    return obj;
  }

  static deserialize(buf){
    const ser = new Serializer(buf);
    return O.rec([this, 'deserm'], ser);
  }

  static *serPri(ser){
    const {pri, ctorsNum} = this;

    assert(typeof pri === 'number');
    assert(typeof ctorsNum === 'number');
    assert(pri < ctorsNum);

    ser.write(pri, ctorsNum);
  }

  static *deserPri(ser){
    const {ctorsNum} = this;

    assert(typeof ctorsNum === 'number');

    return ser.read(ctorsNum);
  }

  static *serCtor(ser){
    return O.tco([this, 'serPri'], ser);
  }

  static *deserCtor(ser){
    assert(ser);

    const {ctorsArr} = this;
    const pri = yield [[this, 'deserPri'], ser];

    assert(pri < ctorsArr.length);

    return ctorsArr[pri];
  }

  constructor(...args){
    super();

    if(args.length !== 0 && args[0] === kNewDeser){
      assert(args.length === 1);
      return;
    }

    this.init();
    this.new(...args);
  }

  new(){
    super.new();
  }

  get ctor(){ return this.constructor; }
  get baseCtor(){ return this.ctor.baseCtor; }
  get pri(){ return this.ctor.pri; }

  addTrait(trait){
    this.traits.add(trait);
  }

  removeTrait(trait){
    this.traits.remove(trait);
  }

  *getEnts(traitCtor){
    assert(traitCtor);
    
    const ents = new Set();

    for(const trait of this.getTraits(traitCtor)){
      const {ent} = trait;
      if(ents.has(ent)) continue;

      yield ent;

      ents.add(ent);
    }
  }

  getEnt(traitCtor){
    return uni(this.getEnts(traitCtor));
  }

  getTraits(traitCtor){
    return this.traits.get(traitCtor);
  }

  getTrait(traitCtor){
    return uni(this.getTraits(traitCtor));
  }

  hasTrait(traitCtor){
    return this.traits.hasKey(traitCtor);
  }
  
  serialize(){
    const {baseCtor} = this;
    const ser = new Serializer();

    O.rec([this, 'serm'], ser, baseCtor);

    return ser.getOutput();
  }

  *serm(ser){
    const ctor = this.baseCtor;
    const map = ser.getCtorMap(ctor);
    const {size} = map;

    if(map.has(this)){
      ser.write(0);
      ser.write(map.get(this), size);
      return;
    }

    ser.addObj(this);

    ser.write(1);
    return O.tco([this, 'ser'], ser);

  }

  static *deserm(ser){
    const ctor = this.baseCtor;
    const arr = ser.getCtorArr(ctor);
    const len = arr.length;
    
    if(!ser.read()){
      assert(len !== 0);

      const index = ser.read(len);
      assert(index < len);

      return arr[index];
    }

    const obj = yield [[ctor, 'deser'], ser];
    ser.addObj(obj);

    return obj;
  }

  *ser(ser){ O.virtual('ser'); }
  static *deser(ser){ O.virtual('deser', 1); }

  *serPri(ser){ return O.tco([this.ctor, 'serPri'], ser); }
  *serCtor(ser){ return O.tco([this.ctor, 'serCtor'], ser); }
}

const uni = iterable => {
  return O.uni(iterable);

  let result = null;
  let hasResult = 0;

  for(const val of iterable){
    assert(!hasResult);

    result = val;
    hasResult = 1;
  }

  assert(result);
  return result;
}

module.exports = Serializable;