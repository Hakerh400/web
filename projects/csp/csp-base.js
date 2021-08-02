'use strict';

const assert = require('assert');

class CSPBase{
  constructor(grid, unsolved){
    this.grid = grid;

    this.stack = [new StackFrame(
      new Map(),
      unsolved,
      0,
      1,
    )];
  }

  get isSolved(){
    const {stack} = this;
    if(stack.length !== 1) return 0;

    return stack[0].isSolved;
  }

  check(tile){ O.virtual('check'); }

  tick(){
    assert(!this.isSolved);

    const {stack} = this;
    const frame = O.last(stack);
    const [tile, vals] = O.fst(frame.unsolved);
    const valsNum = vals.size;

    assert(valsNum !== 0);

    if(frame.valIndex === 0 && tile === frame.firstTile){
      __TODO__
    }

    if(frame.valIndex === valsNum - 1){
      const val = O.uni(vals);

      frame.unsolved.delete(tile);
      frame.solved.set(tile, val);
      frame.firstTile = null;

      if(!this.check(tile))
        this.rollback();

      return;
    }
    
    const val = [...vals][frame.valIndex];
  }

  rollback(){
    assert(!this.isSolved);

    const {stack} = this;
    assert(stack.length >= 1);

    const frame = stack.pop();
    const prev = O.last(stack);
  }
}

class StackFrame{
  constructor(solved, unsolved, depth, rec){
    this.solved = solved;
    this.unsolved = unsolved;
    this.depth = depth;
    this.rec = rec;

    this.firstTile = null;
    this.valIndex = 0;
    this.recSolved = null;
    this.recElims = null;
  }

  get isSolved(){
    return this.unsolved.size === 0;
  }
}

module.exports = CSPBase;