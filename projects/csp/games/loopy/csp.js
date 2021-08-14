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

  check(line, addInfo=0){
    // assert(line.isLine);
    if(!line.isLine) return 1;

    const {grid} = this;
    const {val} = line;
    if(val === null) return 1;

    for(const d of line.iterAdjS2()){
      if(d === null) continue;

      const {val} = d;
      if(val === null) continue;

      const [cntMin, cntMax] = d.getLinesCntBounds();
      if(val >= cntMin && val <= cntMax) continue;

      if(addInfo)
        this.setErr(2, [d]);

      return 0;
    }

    const danglingLines = line.getDangling();

    if(danglingLines !== null){
      if(addInfo)
        this.setErr(0, danglingLines);

      return 0;
    }

    if(val === 1){
      const branchingLines = line.getBranching();

      if(branchingLines !== null){
        if(addInfo)
          this.setErr(1, branchingLines);

        return 0;
      }

      if(line.isClosed()){
        const {pathLines} = line;

        for(const line1 of grid.iterLines()){
          if(!line1.full) continue;
          if(pathLines.has(line1)) continue;

          if(addInfo)
            this.setErr(3, [line1]);

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
        for(const line1 of grid.iterLines()){
          if(line1 === line) continue;
          if(!line1.full) continue;

          if(line1.isClosed()){
            if(addInfo)
              this.setErr(3, [line]);

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