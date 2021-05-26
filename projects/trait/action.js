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

    const lab = labs[0];
    if(!/^\d{2}$/.test(lab)) return;

    const {world} = btn;
    const level = Number(lab);

    world.reqPushRoom(Grid.Rectangle, [20, 15], grid => {
      const {w, h} = grid;

      for(const tile of grid.tiles)
        tile.createEnt(Entity.Concrete);

      for(let i = 0; i !== h - 3; i++){
        grid.createEnt(5, i + 3, Entity.Wall);
        grid.createEnt(w - 6, i, Entity.Wall);
      }

      grid.createEnt(2, h - 3, Entity.Player);
      grid.createEnt(3, h - 3/*w - 3, 2*/, Entity.Diamond, level);

      grid.getp(0, 0).getEnt(Trait.Concrete).createTrait(Trait.Text, level);
    });
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