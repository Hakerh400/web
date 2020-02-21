'use strict';

const RealmBase = require('../../realm');
const Generator = require('./generator');
const cs = require('./ctors');

const NAME = 'sokoban';

for(const ctorName in cs)
  cs[ctorName].realm = NAME;

class Realm extends RealmBase{
  get name(){ return NAME; }
  get ctors(){ return cs }

  createGen(wgen, key){
    return new Generator(this, wgen, key);
  }
}

module.exports = new Realm();