'use strict';

const assert = require('assert');
const CSP = require('./csp');

class CSPSudoku extends CSP{
  *getRowTiles(tile){
    const {x, y} = tile;

    for(let i = 0; i !== 9; i++){
      if(i === x) continue;
      yield this.get(i, y);
    }
  }

  *getColTiles(tile){
    const {x, y} = tile;

    for(let i = 0; i !== 9; i++){
      if(i === y) continue;
      yield this.get(x, i);
    }
  }

  *getSectTiles(tile){
    const {x, y} = tile;
    const x1 = x - x % 3;
    const y1 = y - y % 3;

    for(let i = 0; i !== 3; i++){
      for(let j = 0; j !== 3; j++){
        const x2 = x1 + i;
        const y2 = y1 + j;
        if(x2 === x && y2 === y) continue;

        yield this.get(x2, y2);
      }
    }
  }

  *getRelTileIters(tile){
    yield this.getRowTiles(tile);
    yield this.getColTiles(tile);
    yield this.getSectTiles(tile);
  }

  *getRelTilesRaw(tile){
    for(const iter of this.getRelTileIters(tile))
      yield* iter;
  }

  getRelTiles(tile){
    const iter = this.getRelTilesRaw(tile);
    return O.undupeIter(iter);
  }

  check(tile, vals){
    const {x, y} = tile;
    const val = O.the(vals);

    for(const iter of this.getRelTileIters(tile)){
      const allVals = new Set(vals);

      for(const d of iter){
        assert(d !== tile);

        for(const val of d.vals)
          allVals.add(val);
      }

      if(allVals.size !== 9)
        return 0;
    }

    if(val !== null){
      for(const d of this.getRelTiles(tile)){
        assert(d !== tile);

        if(val !== null && d.val === val)
          return 0;
      }
    }

    return 1;
  }
}

module.exports = CSPSudoku;