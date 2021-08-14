'use strict';

const assert = require('assert');
const CSPBase = require('../../csp');

class CSP extends CSPBase{
  static cnstrs = [
    `There must be no dangling lines`,
    `There must be no branching lines`,
    `Each number must be surrounded by exactly that number of lines`,
    `There must be exactly one loop`,
  ];

  check(tile, addInfo=0){
    const {grid} = this;
    const {val} = tile;
    if(val === null) return 1;

    if(tile.isSquare){
      const [cntMin, cntMax] = tile.getLinesCntBounds();

      if(val < cntMin || val > cntMax){
        if(addInfo)
          this.setErr(2, [tile]);

        return 0;
      }

      return 1;
    }

    assert(tile.isLine);

    for(const d of tile.iterAdjS2()){
      if(d === null) continue;

      const {val} = d;
      if(val === null) continue;

      const [cntMin, cntMax] = d.getLinesCntBounds();

      if(val < cntMin || val > cntMax){
        if(addInfo)
          this.setErr(2, [d]);

        return 0;
      }
    }

    const danglingLines = tile.getDangling();

    if(danglingLines !== null){
      if(addInfo)
        this.setErr(0, danglingLines);

      return 0;
    }

    if(val === 1){
      const branchingLines = tile.getBranching();

      if(branchingLines !== null){
        if(addInfo)
          this.setErr(1, branchingLines);

        return 0;
      }

      if(tile.isClosed()){
        const {pathLines} = tile;

        for(const line of grid.iterLines()){
          if(!line.full) continue;
          if(pathLines.has(line)) continue;

          if(addInfo)
            this.setErr(3, [line]);

          return 0;
        }

        for(const d of grid.iterSquares()){
          const {val} = d;
          if(val === null) continue;

          const [cntMin] = d.getLinesCntBounds();
          if(val === cntMin) continue;

          if(addInfo)
            this.setErr(2, [d]);

          return 0;
        }
      }else{
        for(const line of grid.iterLines()){
          if(line === tile) continue;
          if(!line.full) continue;

          if(line.isClosed()){
            if(addInfo)
              this.setErr(3, [tile]);

            return 0;
          }

          return 1;
        }
      }

      return 1;
    }

    assert(val === 0);

    for(const line of grid.iterLines()){
      const {val} = line;
      if(val !== 0) return 1;
    }

    if(addInfo)
      this.setErr(3);

    return 0;
  }
}

module.exports = CSP;