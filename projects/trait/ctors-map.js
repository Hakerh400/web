'use strict';

const assert = require('assert');

const kObj = Symbol('obj');

class CtorsMap extends O.SetMap{
  has(key, val=kObj){
    if(val !== kObj)
      return super.has(key, val);

    const {ctor} = key;
    assert(ctor);

    return super.has(ctor, key);
  }

  add(key, val=kObj){
    if(val !== kObj)
      return super.add(key, val);

    const {ctor} = key;
    assert(ctor);

    return super.add(ctor, key);
  }

  remove(key, val=kObj){
    if(val !== kObj)
      return super.remove(key, val);

    const {ctor} = key;
    assert(ctor);

    return super.remove(ctor, key);
  }
}

module.exports = CtorsMap;