'use strict';

class Realm{
  get name(){ O.virtual('name'); }
  get ctors(){ O.virtual('ctors'); }
  createGen(start, pset){ O.virtual('createGen'); }
}

module.exports = Realm;