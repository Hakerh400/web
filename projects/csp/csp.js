'use strict';

const assert = require('assert');
const fnum = require('./fnum');
const flags = require('./flags');

const STEP_BY_STEP = flags.debug;
const SORT_VALS = STEP_BY_STEP;

class CSP{
  static cnstrs = null;

  relsTemp = null;
  solutions = null;
  stepsNum = 0;
  gen = 0;

  constructor(grid){
    this.grid = grid;
    grid.csp = this;
  }

  check(tile, addInfo=0){ O.virtual('check'); }

  get ctor(){ return this.constructor; }
  get cnstrs(){ return this.ctor.cnstrs; }

  get unsolvedNum(){
    return this.grid.unsolvedNum;
  }

  set unsolvedNum(n){
    this.grid.unsolvedNum = n;
  }

  getRels(tile){
    const rels = new Set();
    this.relsTemp = rels;

    const ok = this.check(tile);
    this.relsTemp = null;

    if(!ok) return null;

    rels.delete(tile);
    return rels;
  }

  get solved(){
    return this.unsolvedNum === 0;
  }

  createSolution(){
    const sol = [...this.tiles].map(a => a.val);
    this.solutions.push(sol);
  }

  /*tick(){
    const {solver} = this;
    const result = solver.next();

    if(result.done)
      return result.value;

    return null;
  }*/

  solve(gen=0){
    const {grid} = this;
    const depth = gen ? O.N : 0;

    this.solutions = [];
    this.stepsNum = 0;
    this.gen = gen;

    if(gen) grid.shuffle();
    grid.updateUnsolvedNum();

    const tiles = new Set(grid.tiles);
    const solver = O.recg([this, 'solveIter'], tiles, depth);

    while(1){
      const {value, done} = solver.next();
      if(!done) continue;

      this.solutions = null;
      return value;
    }
  }

  generate(){
    return this.solve(1);
  }

  *solveIter(tiles, depth){
    this.tiles = tiles;

    depth--;

    while(!this.solved){
      depth++;

      const elims = yield [[this, 'solveIterWithDepth'], tiles, depth, 1];

      if(elims === null)
        return 0;
    }

    // log(`Depth: ${depth}`);
    // log(`Steps: ${fnum(this.stepsNum)}`);

    return 1;
  }

  *solveIterWithDepth(tiles, depth, applyElims=0){
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

        if(SORT_VALS)
          O.sortAsc(valsArr);

        const elimsSet = new Set();
        const relsArr = [];

        for(const val of valsArr){
          tile.vals = new Set([val]);
          const rels = this.getRels(tile);
          tile.vals = vals;

          if(rels === null){
            if(vals.size === 1){
              yield [[this, 'revertElims'], elimsAll];
              return null;
            }

            yield [elimVal, tile, val];

            const valsNew = new Set(vals);
            valsNew.delete(val);

            this.vals = valsNew;
            const result = this.check(tile);
            this.vals = vals;

            if(!result){
              yield [[this, 'revertElims'], elimsAll];
              return null;
            }

            continue;
          }

          const tileElims = newElims();

          for(const v of vals){
            if(v === val) continue;
            addElim(tileElims, tile, v);
          }

          if(this.solved || this.unsolvedNum === 1 && tileElims.size !== 0){
            const {solved} = this;

            if(!solved){
              yield [[this, 'applyElims'], tileElims];
              assert(this.solved);
              // log(this.stepsNum);
              // return O.ret(1);
            }

            this.createSolution();

            if(this.gen)
              return O.ret(1);

            if(solutions.length !== 1){
              const [sol1, sol2] = solutions;

              for(let i = 0; i !== sol1.length; i++)
                if(sol1[i] !== sol2[i])
                  return O.ret(2);

              solutions.pop();
            }

            elimsSet.add(tileElims);

            if(!solved)
              yield [[this, 'revertElims'], tileElims];

            break;
          }

          if(depth === 0){
            elimsSet.add(tileElims);
            relsArr.push(rels);
            // yield [[this, 'revertElims'], tileElims];
            continue;
          }

          yield [[this, 'applyElims'], tileElims];

          const elimsNew = yield [[this, 'solveIterWithDepth'], rels, depth - 1];

          yield [[this, 'revertElims'], tileElims];

          if(elimsNew === null){
            if(vals.size === 1){
              yield [[this, 'revertElims'], elimsAll];
              return null;
            }

            yield [elimVal, tile, val];

            continue;
          }

          elimsSet.add(elimsUnion([tileElims, elimsNew]));
        }

        assert(elimsSet.size !== 0);

        const elimsFinal = elimsIntersect(elimsSet);
        if(elimsFinal.size === 0) continue;

        for(const [tile, vals] of elimsFinal){
          for(const val of vals){
            if(elimsHave(elimsAll, tile, val))
              continue;

            yield [elimVal, tile, val];
          }
        }

        if(this.solved) break;
        // if(vals.size !== 1) continue;

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

    this.stepsNum++;

    if(STEP_BY_STEP)
      yield O.yield();
  }

  *revertElims(elims){
    /*if(SORT_VALS){
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
    }else{*/
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
    /*}*/

    this.stepsNum++;

    if(STEP_BY_STEP)
      yield O.yield();
  }

  *elimVal(tile, val){
    const elims = newElims();
    addElim(elims, tile, val);
    return O.tco([this, 'applyElims'], elims);
  }

  setErr(cnstrIndex, tiles=null){
    const {ctor, grid} = this;

    assert(grid.err === null);

    grid.err = cnstrIndex;

    if(tiles !== null)
      for(const tile of O.undupeIter(tiles))
        tile.err = 1;
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

module.exports = CSP;