'use strict';

const assert = require('assert');

class Event{
  constructor(handler, evtInfo=null, validityCheck=null){
    this.handler = handler;
    this.evtInfo = evtInfo;
    this.validityCheck = validityCheck;
  }

  get pri(){ return this.handler.pri; }

  get valid(){
    if(!this.handler.valid) return 0;
    if(this.validityCheck !== null && !this.validityCheck()) return 0;

    return 1;
  }
}

module.exports = Event;