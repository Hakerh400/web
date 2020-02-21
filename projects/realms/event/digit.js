'use strict';

const Event = require('./event');

class Digit extends Event{
  constructor(digit, tile){
    super('digit', tile);
    this.digit = digit;
  }
}

module.exports = Digit;