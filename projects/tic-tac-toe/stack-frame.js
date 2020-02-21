'use strict';

class StackFrame{
  constructor(prev=null, level=0, data=null, cost=0, next=null){
    this.prev = prev;
    this.level = level;
    this.data = data;
    this.cost = cost;
    this.next = next;
  }
}

module.exports = StackFrame;