'use strict';

const assert = require('assert');

const STEP_BY_STEP = 0
const SORT_VALS    = 0

class CSPBase{
  constructor(grid, tiles){
    this.grid = grid;
    this.tiles = tiles;

    this.solver = O.recg([this, 'solve'], tiles);

    let unsolvedNum = 0;

    for(const {vals} of tiles){
      const valsNum = vals.size;
      assert(valsNum !== 0);

      if(valsNum !== 1) unsolvedNum++;
    }

    this.unsolvedNum = unsolvedNum;
    this.solutions = [];
  }

  getRels(tile){ O.virtual('getRels'); }

  get(x, y){
    const {grid} = this;
    const tile = grid.get(x, y);
    if(tile === null) return null;
    return this.getVal(tile);
  }

  get solved(){
    return this.unsolvedNum === 0;
  }

  createSolution(){
    const sol = [...this.tiles].map(a => a.val);
    this.solutions.push(sol);
  }

  tick(){
    const {solver} = this;
    const result = solver.next();

    if(result.done)
      return result.value;

    return null;
  }

  *solve(tiles){
    const {solutions} = this;

    let depth = -1;

    while(!this.solved){
      depth++;

      const elims = yield [[this, 'solveWithDepth'], tiles, depth, 1];

      if(elims === null)
        return 0;
    }

    // log(depth);

    return 1;
  }

  *solveWithDepth(tiles, depth, applyElims=0){
    const {solutions} = this;
    const elimsAll = new Map();
    const csp = this;

    const elimVal = function*(tile, val){
      addElim(elimsAll, tile, val);
      return O.tco([csp, 'elimVal'], tile, val);
    };

    while(tiles.size !== 0){
      const tiles1 = tiles;
      tiles = new Set();

      for(const tile of tiles1){
        const {vals} = tile;
        assert(vals.size !== 0);

        if(vals.size === 1) continue;

        const valsArr = [...vals];
        const elimsSet = new Set();
        const relsArr = [];

        for(const val of valsArr){
          const tileElims = newElims();

          for(const v of vals){
            if(v === val) continue;
            addElim(tileElims, tile, v);
          }

          // if(this.getVal(this.grid.get(0, 0)) === 2 && tile.x === 1) debugger;
          yield [[this, 'applyElims'], tileElims];
          const rels = this.getRels(tile, val);

          if(rels === null){
            yield [[this, 'revertElims'], tileElims];

            if(vals.size === 1){
              // assert(!applyElims);
              yield [[this, 'revertElims'], elimsAll];
              return null;
            }

            yield [elimVal, tile, val];
            continue;
          }

          if(this.solved){
            this.createSolution();

            if(solutions.length !== 1){
              const [sol1, sol2] = solutions;

              for(let i = 0; i !== sol1.length; i++)
                if(sol1[i] !== sol2[i])
                  return O.ret(2);

              solutions.pop();
            }

            elimsSet.add(tileElims);
            yield [[this, 'revertElims'], tileElims];

            break;
          }

          if(depth === 0){
            elimsSet.add(tileElims);
            relsArr.push(rels);
            yield [[this, 'revertElims'], tileElims];
            continue;
          }

          // debugger;
          // const a = JSON.stringify([...thisTiles].map(([a, b]) => [a.x, a.y, [...b]]));
          const elimsNew = yield [[this, 'solveWithDepth'], rels, depth - 1];
          // const b = JSON.stringify([...thisTiles].map(([a, b]) => [a.x, a.y, [...b]]));

          // if(a !== b){
          //   log(a);
          //   log(b);
          //   assert.fail();
          // }

          // debugger;
          yield [[this, 'revertElims'], tileElims];

          if(elimsNew === null){
            // log(JSON.stringify([...thisTiles].map(([a, b]) => [a.x, a.y, [...b]])));
            // log(JSON.stringify([...elimsAll].map(([a, b]) => [a.x, a.y, [...b]])));
            // log(tile.x, tile.y, val);
            // log();
            // debugger;
            // log(JSON.stringify([...thisTiles].map(([a, b]) => [a.x, a.y, [...b]])));
            // log(tile.x, tile.y, val);

            if(vals.size === 1){
              // assert(!applyElims);
              yield [[this, 'revertElims'], elimsAll];
              return null;
            }

            yield [elimVal, tile, val];
            // log(JSON.stringify([...thisTiles].map(([a, b]) => [a.x, a.y, [...b]])));
            // log()
            continue;
          }

          elimsSet.add(elimsUnion([tileElims, elimsNew]));
          // relsArr.push(rels);
        }

        if(elimsSet.size === 0){
          assert.fail();
          // assert(!applyElims);
          // yield [[this, 'revertElims'], elimsAll];
          // return null;
        }

        const elimsFinal = elimsIntersect(elimsSet);
        if(elimsFinal.size === 0) continue;

        if(window.z)debugger;

        for(const [tile, vals] of elimsFinal){
          for(const val of vals){
            if(elimsHave(elimsAll, tile, val))
              continue;

            yield [elimVal, tile, val];
          }
        }

        if(this.solved) break;
        if(vals.size !== 1) continue;

        for(const rels of relsArr)
          for(const tile of rels)
            tiles.add(tile);
      }
    }

    if(!applyElims)
      yield [[this, 'revertElims'], elimsAll];

    return elimsAll;
  }

  *applyElims(elims){
    for(const [tile, vals] of elims){
      const {vals: valsSet} = tile;
      const size = valsSet.size;

      for(const val of vals){
        assert(valsSet.has(val));
        valsSet.delete(val);
      }

      assert(size !== 0);

      if((size === 1) !== (valsSet.size === 1))
        this.unsolvedNum += size === 1 ? 1 : -1;
    }

    if(STEP_BY_STEP)
      yield O.yield();
  }

  *revertElims(elims){
    if(SORT_VALS){
      for(const [tile, vals] of elims){
        const {vals: valsSet} = tile;
        const valsArr = [...valsSet];
        const size = valsSet.size;
        assert(size !== 0);

        for(const val of vals){
          assert(!valsSet.has(val));
          valsArr.push(val);
        }

        valsSet.clear();

        for(const val of O.sortAsc(valsArr))
          valsSet.add(val);

        if((size === 1) !== (valsSet.size === 1))
          this.unsolvedNum += size === 1 ? 1 : -1;
      }
    }else{
      for(const [tile, vals] of elims){
        const {vals: valsSet} = tile;
        const size = valsSet.size;
        assert(size !== 0);

        for(const val of vals){
          assert(!valsSet.has(val));
          valsSet.add(val);
        }

        if((size === 1) !== (valsSet.size === 1))
          this.unsolvedNum += size === 1 ? 1 : -1;
      }
    }

    if(STEP_BY_STEP)
      yield O.yield();
  }

  *elimVal(tile, val){
    const elims = newElims();
    addElim(elims, tile, val);
    return O.tco([this, 'applyElims'], elims);
  }
}

const newElims = () => {
  return new Map();
};

const addElim = (elims, tile, val, check=1) => {
  if(!elims.has(tile))
    elims.set(tile, new Set());

  const vals = elims.get(tile);

  if(check)
    assert(!vals.has(val));

  vals.add(val);
  return elims;
};

const removeElim = (elims, tile, val, check=1) => {
  if(!elims.has(tile)){
    assert(!check);
    return elims;
  }

  const vals = elims.get(tile);

  if(check)
    assert(vals.has(val));

  if(vals.size === 1) elims.delete(tile);
  else vals.delete(val);

  return elims;
};

const elimsUnion = elimsIterable => {
  const elimsNew = newElims();

  for(const elims of elimsIterable)
    for(const [tile, vals] of elims)
      for(const val of vals)
        addElim(elimsNew, tile, val, 0);

  return elimsNew;
};

const elimsIntersect = elimsIterable => {
  const elimsNew = newElims();

  for(const elims1 of elimsIterable){
    for(const [tile, vals] of elims1){
      valsLoop: for(const val of vals){
        for(const elims2 of elimsIterable)
          if(!elimsHave(elims2, tile, val))
            continue valsLoop;

        addElim(elimsNew, tile, val);
      }
    }

    return elimsNew;
  }

  return elimsNew;
};

const elimsHave = (elims, tile, val) => {
  if(!elims.has(tile)) return 0;
  return elims.get(tile).has(val);
};

module.exports = CSPBase;