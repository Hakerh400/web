'use strict';

class Inspectable{
  *inspect(){ O.virtual('inspect'); }
}

module.exports = {
  Inspectable,
};