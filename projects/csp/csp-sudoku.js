'use strict';

const assert = require('assert');
const CSP = require('./csp');

const n = 2;
const n2 = n ** 2;

class CSPSudoku extends CSP{
  *getRowTiles(tile){
    const {grid} = this;
    const {x, y} = tile;

    for(let i = 0; i !== n2; i++){
      if(i === x) continue;
      yield grid.getSquare(i, y);
    }
  }

  *getColTiles(tile){
    const {grid} = this;
    const {x, y} = tile;

    for(let i = 0; i !== n2; i++){
      if(i === y) continue;
      yield grid.getSquare(x, i);
    }
  }

  *getSectTiles(tile){
    const {grid} = this;
    const {x, y} = tile;
    const x1 = x - x % n;
    const y1 = y - y % n;

    for(let i = 0; i !== n; i++){
      for(let j = 0; j !== n; j++){
        const x2 = x1 + i;
        const y2 = y1 + j;
        if(x2 === x && y2 === y) continue;

        yield grid.getSquare(x2, y2);
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
    if(tile.isSquare){
      const {x, y} = tile;
      const val = O.the(vals);

      for(const iter of this.getRelTileIters(tile)){
        const allVals = new Set(vals);

        for(const d of iter){
          assert(d !== tile);

          for(const val of d.vals)
            allVals.add(val);
        }

        if(allVals.size !== n2)
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

    return 1;
  }
}

module.exports = CSPSudoku;