'use strict';

const assert = require('assert');
const Inspectable = require('./inspectable');
const ctorsPri = require('./ctors-pri');

class Action extends Inspectable{
  exec(btn, labs){ O.virtual('exec'); }

  *inspectData(){ return []; }

  *inspect(){
    return new DetailedInfo(`action :: ${this.ctor.name}`,
      yield [[this, 'inspectData']],
    );
  }

  *serData(ser){}
  *deserData(ser){}

  *ser(ser){
    yield [[this, 'serCtor'], ser];
    yield [[this, 'serData'], ser];
  }

  static *deser(ser){
    const ctor = yield [[Action, 'deserCtor'], ser];
    const action = ctor.new();

    yield [[action, 'deserData'], ser];
    
    return action;
  }
}

class OpenLevel extends Action{
  exec(btn, labs){
    if(labs.length !== 1) return;

    const level = labs[0];
    if(!O.has(levels, level)) return;

    const {world} = btn;

    levels[level](world, btn.ent, level);
  }
}

const ctorsArr = [
  Action,
  OpenLevel,
];

const ctorsObj = ctorsPri(ctorsArr);

module.exports = Object.assign(Action, {
  ctorsArr,
  ...ctorsObj,
});

const Grid = require('./grid');
const Entity = require('./entity');
const Trait = require('./trait');
const levels = require('./levels');