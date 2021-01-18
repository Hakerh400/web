'use strict';

const assert = require('assert');

class Encoding{
  static getName(){ O.virtual('getName'); }
  static checkStr(){ O.virtual('checkStr'); }
  static countBytes(){ O.virtual('countBytes'); }
}

class Ascii extends Encoding{
  static getName(){ return 'ASCII'; }

  static checkStr(str){
    return /^[\x00-\xFF]*$/.test(str);
  }

  static countBytes(str){
    return str.length;
  }
}

module.exports = Object.assign(Encoding, {
  Ascii,
});