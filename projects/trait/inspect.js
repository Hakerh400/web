'use strict';

const Serializable = require('./serializable');

class Inspectable extends Serializable{
  *inspect(){ O.virtual('inspect'); }
}

module.exports = {
  Inspectable,
};