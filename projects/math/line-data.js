'use strict';

const assert = require('assert');
const util = require('./util');
const su = require('./str-util');

class LineData{
  constructor(index, ctx, str='', err=0){
    this.index = index;
    this.ctx = ctx;
    this.str = str;
    this.err = err;
  }
}

module.exports = LineData;