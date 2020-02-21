'use strict';

class Node{
  index = 0;

  constructor(type, alpha, beta, score, lines){
    this.type = type;
    this.alpha = alpha;
    this.beta = beta;
    this.score = score;
    this.lines = lines;
  }
}

module.exports = Node;