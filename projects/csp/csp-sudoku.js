'use strict';

const assert = require('assert');
const CSP = require('./csp');

class CSPSudoku extends CSP{
  #shapeSize;
  #isShapeComplete;

  constructor(grid){
    super(grid);
    this.size = grid.size;
  }

  *getRowTiles(tile){
    const {grid, size} = this;
    const {x, y} = tile;

    for(let i = 0; i !== size; i++){
      if(i === x) continue;
      yield grid.getSquare(i, y);
    }
  }

  *getColTiles(tile){
    const {grid, size} = this;
    const {x, y} = tile;

    for(let i = 0; i !== size; i++){
      if(i === y) continue;
      yield grid.getSquare(x, i);
    }
  }

  *getShapeTiles(tile){
    this.#isShapeComplete = 1;

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

        if(val === null){
          this.#isShapeComplete = 0;
          continue;
        }

        if(val === 1) continue;

        const tile = grid.getSquare(x1, y1);
        if(tile === null || seen.has(tile)) continue;

        seen.add(tile);
        stack.push(tile);
      }
    }

    this.#shapeSize = seen.size;
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

  check(tile){
    const {grid, size} = this
    const {x, y, vals} = tile;
    const val = O.the(vals);

    if(tile.isSquare){
      let i = -1;

      for(const iter of this.getRelTileIters(tile)){
        i++;

        const allVals = new Set(vals);

        for(const d of iter){
          assert(d !== tile);

          for(const val of d.vals)
            allVals.add(val);
        }

        if(i === 2){
          assert(this.#shapeSize <= size);

          if(!(this.#shapeSize === size || this.#isShapeComplete))
            continue;

          if(allVals.size === size) continue;
          return 0;
        }
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

    if(tile.isLine){
      assert(val !== null);

      const tiles = tile.getAdjSquares();
      const [d1, d2] = tiles;

      if(val === 1){
        for(let i = 0; i !== 2; i++){
          const d = tiles[i];
          if(d === null) continue;

          const allVals = new Set(d.vals);

          for(const d3 of this.getShapeTiles(d)){
            assert(d3 !== d);

            if(i === 0 && d3 === d2)
              return 0;

            for(const val of d3.vals)
              allVals.add(val);
          }

          assert(this.#shapeSize <= size);

          if(!(this.#shapeSize === size || this.#isShapeComplete))
            continue;

          if(this.#shapeSize !== size)
            return 0;

          if(allVals.size !== size)
            return 0;
        }

        return 1;
      }

      if(val === 0){
        if(d1 === null || d2 === null)
          return 0;

        const checkDangling = coords => {
          let fullLinesNum = 0;

          for(let i = 0; i !== coords.length; i += 3){
            const x = coords[i];
            const y = coords[i + 1];
            const vert = coords[i + 2];

            const line = vert ?
              grid.getVLine(x, y) : grid.getHLine(x, y);

            if(line === null) continue;

            const {val} = line;
            if(val === null) return 1;
            if(val === 0) continue;

            fullLinesNum++;
          }

          return fullLinesNum !== 1;
        };

        if(tile.isHLine){
          if(!checkDangling([
            x - 1, y, 0,
            x, y - 1, 1,
            x, y, 1,
          ])) return 0;

          if(!checkDangling([
            x + 1, y, 0,
            x + 1, y - 1, 1,
            x + 1, y, 1,
          ])) return 0;
        }else{
          if(!checkDangling([
            x, y - 1, 1,
            x - 1, y, 0,
            x, y, 0,
          ])) return 0;

          if(!checkDangling([
            x, y + 1, 1,
            x - 1, y + 1, 0,
            x, y + 1, 0,
          ])) return 0;
        }

        const d = d1;
        const dVals = d.vals;
        const dVal = O.the(dVals);
        const vals = new Set();
        const allVals = new Set(dVals);

        if(dVal !== null)
          vals.add(dVal);

        for(const d1 of this.getShapeTiles(d)){
          assert(d1 !== d);

          const vals1 = d1.vals;

          for(const val of vals)
            allVals.add(val);

          const val = O.the(vals1);
          if(val === null) continue;

          if(vals.has(val))
            return 0;

          vals.add(val);
        }

        if(this.#shapeSize > size)
          return 0;

        if(!this.#isShapeComplete) return 1;

        if(this.#shapeSize !== size)
          return 0;

        if(allVals.size !== size)
          return 0;

        return 1;
      }

      assert.fail();
    }

    assert.fail();
  }
}

module.exports = CSPSudoku;