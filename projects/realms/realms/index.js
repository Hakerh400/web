'use strict';

const path = require('path');
const realmsList = require('../realms-list');

const cwd = __dirname;
const realms = O.obj();

for(const realmName of realmsList){
  const realm = require(path.join(cwd, realmName));
  realms[realmName] = realm;
}

module.exports = realms;