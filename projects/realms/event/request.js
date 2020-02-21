'use strict';

const Event = require('./event');

class Request extends Event{
  constructor(src, type, data=null){
    super('request');

    this.src = src;
    this.type = type;
    this.data = data;
  }
}

module.exports = Request;