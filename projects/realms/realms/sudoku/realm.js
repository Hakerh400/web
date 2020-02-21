'use strict';

const RealmBase = require('../../realm');
const Generator = require('./generator');
const cs = require('./ctors');

const NAME = 'sudoku';

for(const ctorName in cs)
  cs[ctorName].realm = NAME;

class Realm extends RealmBase{
  get name(){ return NAME; }
  get ctors(){ return cs }

  createGen(start, pset){
    return new Generator(this, start, pset);
  }
}

module.exports = new Realm();