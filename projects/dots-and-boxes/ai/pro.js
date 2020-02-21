'use strict';

const AI = require('./ai');
const Node = require('./node');

class AIPro extends AI{
  play(){
    const {grid, player, depth} = this;

    const lines = O.shuffle(grid.getLines());
    const stack = [new Node(0, -O.N, O.N, 0, lines)];

    let scoreBest = -O.N;
    let indexBest = -1;

    const pop = () => {
      stack.pop();
      if(stack.length === 0) return 0;

      const prev = O.last(stack);
      const [x, y, type] = prev.lines[prev.index++];

      grid.removeLine(x, y, type);

      return 1;
    };

    while(1){
      const node = O.last(stack);
      const {type, lines, index} = node;

      if(node.alpha >= node.beta){
        if(!pop()) break;
        continue;
      }

      if(index === lines.length){
        if(!pop()) break;

        const prev = O.last(stack);
        const score = type === 0 ? node.alpha : node.beta;

        if(stack.length === 1 && score > scoreBest){
          scoreBest = score;
          indexBest = prev.index - 1;
        }

        if(prev.type === 0){
          if(score > prev.alpha)
            prev.alpha = score;
        }else{
          if(score < prev.beta)
            prev.beta = score;
        }

        continue;
      }

      const line = node.lines[index];
      const scoreDif = stack.length !== depth ? grid.setLine(...line) : grid.calcTotal(...line, 4);
      const scoreNew = node.type === 0 ? node.score + scoreDif : node.score - scoreDif;

      if(depth === 1 && scoreNew > scoreBest){
        scoreBest = scoreNew;
        indexBest = index;
      }

      if(stack.length === depth){
        if(type === 0){
          if(scoreNew > node.alpha)
            node.alpha = scoreNew;
        }else{
          if(scoreNew < node.beta)
            node.beta = scoreNew;
        }

        node.index++;
        continue;
      }

      const typeNew = type ^ (scoreDif === 0);
      const alphaNew = type === 1 ? -O.N : node.alpha;
      const betaNew = type === 0 ? O.N : node.beta;

      stack.push(new Node(typeNew, alphaNew, betaNew, scoreNew, grid.getLines()));
    }

    return grid.setLine(...lines[indexBest]);
  }
}

module.exports = AIPro;