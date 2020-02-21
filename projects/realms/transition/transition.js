'use strict';

const intps = require('./intps');

class Transition{
  constructor(intp=intps.LINEAR){
    this.intp = intp;
  }
}

module.exports = Transition;