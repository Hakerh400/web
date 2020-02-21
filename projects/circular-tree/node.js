'use strict';

class Node{
  left = null;
  right = null;

  constructor(val, f1, f2){
    this.val = val;
    this.f1 = f1;
    this.f2 = f2;
  }

  get(index){
    if(index === 0){
      if(this.left === null)
        this.left = this.f1();
      return this.left;
    }
    if(this.right === null)
      this.right = this.f2();
    return this.right;
  }
}

module.exports = Node;