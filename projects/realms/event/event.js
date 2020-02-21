'use strict';

class Event{
  consumed = 0;

  constructor(type, tile=null){
    this.type = type;
    this.tile = tile;
  }

  consume(){
    this.consumed = 1;
  }
}

module.exports = Event;