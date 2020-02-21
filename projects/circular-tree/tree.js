'use strict';

const Node = require('./node');

class Tree{
  constructor(){
    const left = (k, n) => {
      k -= 2 ** (-n);
      n++;

      return new Node(O.hsv(k), () => left(k, n), () => right(k, n));
    };

    const right = (k, n) => {
      k += 2 ** (-n);
      n++;

      return new Node(O.hsv(k), () => left(k, n), () => right(k, n));
    };

    this.root = new Node(O.hsv(.5), () => left(.5, 2), () => right(.5, 2));
  }

  get(id, depth){
    let node = this.root;

    while(depth--){
      id *= 2;
      node = node.get(id & 1);
    }

    return node.val;
  }
}

module.exports = Tree;