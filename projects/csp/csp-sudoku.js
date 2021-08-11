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

  *getShapeTiles(tile){
    const {grid} = this;
    const stack = [tile];
    const seen = new Set(stack);

    let first = 1;

    while(stack.length !== 0){
      const tile = stack.pop();
      const {x, y} = tile;

      if(first){
        first = 0;
      }else{
        yield tile;
      }

      for(let dir = 0; dir !== 4; dir++){
        let x1 = x;
        let y1 = y;

        const line =
          dir === 0 ? grid.getHLine(x1, y1--) :
          dir === 1 ? grid.getVLine(++x1, y1) :
          dir === 2 ? grid.getHLine(x1, ++y1) :
                      grid.getVLine(x1--, y1);

        assert(line !== null);

        const {val} = line;
        if(val !== 1) continue;

        const tile = grid.getSquare(x1, y1);
        if(tile === null || seen.has(tile)) continue;

        seen.add(tile);
        stack.push(tile);
      }
    }
  }

  *getRelTileIters(tile){
    yield this.getRowTiles(tile);
    yield this.getColTiles(tile);
    yield this.getShapeTiles(tile);
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

    if(tile.isSquare){
      for(const iter of this.getRelTileIters(tile)){
        const allVals = new Set(vals);

        for(const d of iter){
          assert(d !== tile);

          for(const val of d.vals)
            allVals.add(val);
        }

        if(allVals.size > n2)
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

    if(tile.isHLine){
      return val === (y % 2 === 0 ? 1 : 0);
    }

    if(tile.isVLine){
      return val === (x % 2 === 0 ? 1 : 0);
    }

    assert.fail();
  }
}

module.exports = CSPSudoku;