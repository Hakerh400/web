'use strict';

const assert = require('assert');
const CSPBase = require('../../csp');

const exactlyOnceStr = type => {
  return `Each ${type} must contain every number exactly once`;
};

class CSP extends CSPBase{
  static cnstrs = [
    exactlyOnceStr('row'),
    exactlyOnceStr('column'),
    exactlyOnceStr('shape'),
    `All shapes must be closed`,
    `There must be no dangling lines`,
  ];

  get size(){ return this.grid.size; }

  check(tile, addInfo=0){
    const {grid, size} = this
    const {x, y, vals} = tile;
    const val = O.the(vals);

    if(addInfo)
      assert(val !== null);

    if(tile.isSquare){
      if(val !== null){
        let i = -1;

        for(const iter of tile.getRelIters()){
          i++;

          for(const d of iter){
            if(d === tile) continue;

            if(d.val === val){
              if(addInfo)
                this.setErr(i, [tile, d]);

              return 0;
            }
          }
        }
      }

      let i = -1;

      for(const iter of tile.getRelIters()){
        i++;

        const allVals = new Set(vals);

        for(const d of iter){
          if(d === tile) continue;

          for(const val of d.vals)
            allVals.add(val);
        }

        if(i === 2){
          assert(tile.shapeSize <= size);

          if(!(tile.shapeSize === size || tile.isShapeComplete))
            continue;
        }

        if(allVals.size === size) continue;

        if(addInfo)
          this.setErr(i, [tile]);

        return 0;
      }

      return 1;
    }

    if(tile.isLine){
      assert(val !== null);

      const tiles = [...tile.iterAdjS2()];
      const [d1, d2] = tiles;

      if(val === 1){
        for(let i = 0; i !== 2; i++){
          const d = tiles[i];
          if(d === null) continue;

          const allVals = new Set(d.vals);

          for(const d3 of d.iterShape()){
            if(d3 === d) continue;

            if(i === 0 && d3 === d2){
              if(addInfo)
                this.setErr(4, [tile]);

              return 0;
            }

            for(const val of d3.vals)
              allVals.add(val);
          }

          assert(d.shapeSize <= size);

          if(!(d.shapeSize === size || d.isShapeComplete))
            continue;

          if(d.shapeSize !== size){
            if(addInfo)
              this.setErr(2, [tile]);

            return 0;
          }

          if(allVals.size !== size){
            if(addInfo)
              this.setErr(2, [tile]);

            return 0;
          }
        }

        return 1;
      }

      if(val === 0){
        if(d1 === null || d2 === null){
          if(addInfo)
            this.setErr(3);

          return 0;
        }

        const danglingLines = tile.getDangling();

        if(danglingLines !== null){
          if(addInfo)
            this.setErr(4, danglingLines);

          return 0;
        }

        const d = d1;
        const dVals = d.vals;
        const dVal = O.the(dVals);
        const vals = new Map();
        const allVals = new Set(dVals);

        if(dVal !== null)
          vals.set(dVal, d);

        for(const d1 of d.iterShape()){
          if(d1 === d) continue;

          const vals1 = d1.vals;

          for(const val of vals1)
            allVals.add(val);

          const val = O.the(vals1);
          if(val === null) continue;

          if(vals.has(val)){
            if(addInfo)
              this.setErr(2, [vals.get(val), d1]);

            return 0;
          }

          vals.set(val, d1);
        }

        if(d.shapeSize > size){
          if(addInfo)
            this.setErr(2);

          return 0;
        }

        if(!d.isShapeComplete) return 1;

        if(d.shapeSize !== size){
          if(addInfo)
            this.setErr(2);

          return 0;
        }

        if(allVals.size !== size){
          if(addInfo)
            this.setErr(2);

          return 0;
        }

        return 1;
      }

      assert.fail();
    }

    assert.fail();
  }
}

module.exports = CSP;