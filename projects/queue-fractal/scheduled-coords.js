'use strict';

class ScheduledCoords extends O.Comparable{
  constructor(x, y, pri){
    super();

    this.x = x;
    this.y = y;
    this.pri = pri;
  }

  cmp(other){
    return other.pri - this.pri;
  }
}

module.exports = ScheduledCoords;