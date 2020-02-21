'use strict';

const er = O.obj();
er[0] = er[1] = er;
er.epsilons = [];
er.final = 0;

class Node{
  constructor(ptr0=er, ptr1=er, epsilons=[], final=0){
    this[0] = ptr0;
    this[1] = ptr1;
    
    this.name = '';
    this.epsilons = epsilons;
    this.final = final;
  }

  setName(name){
    this.name = name;
    return this;
  }

  set(ptr0=null, ptr1=null){
    this[0] = ptr0;
    this[1] = ptr1;
    return this;
  }
}

module.exports = Node;