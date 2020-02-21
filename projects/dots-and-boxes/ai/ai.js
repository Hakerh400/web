'use strict';

const {min, max} = Math;

class AI{
  constructor(grid, player, maxDepth){
    this.grid = grid;
    this.player = player;
    this.maxDepth = maxDepth;
  }

  static create(grid, player1, player2){
    return [player1, player2].map((p, i) => {
      if(p[0] === 0) return null;

      const ctor = AI.getCtors()[p[1]];

      return new ctor(grid, i, p[2]);
    });
  }

  static getCtors(){
    return [
      AI.AIBeginner,
      AI.AIAdvanced,
      AI.AIPro,
    ];
  }

  get depth(){
    return min(this.maxDepth, this.grid.availsNum);
  }

  play(){ O.virtual('play'); }
}

module.exports = AI;