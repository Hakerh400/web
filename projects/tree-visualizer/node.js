'use strict';

class Node{
  constructor(val=null, ptrs=[]){
    this.val = val;
    this.ptrs = ptrs;
  }

  add(ptr){
    this.ptrs.push(ptr);
    return this;
  }

  addAll(ptrs){
    for(const ptr of ptrs) this.add(ptr);
    return this;
  }

  [Symbol.iterator](){
    return this.ptrs[Symbol.iterator]();
  }
}

module.exports = Node;