'use strict';

const assert = require('assert');

class CSP{
  constructor(unsolved){
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
    const {solved, unsolved, depth, rec, firstTile} = frame;
    const [tile, vals] = O.fst(unsolved);
    const valsNum = vals.size;

    assert(valsNum !== 0);

    if(tile === firstTile){
      __TODO__
    }

    if(valsNum === 1){
      const val = O.uni(vals);

      unsolved.delete(tile);
      solved.set(tile, val);
      frame.firstTile = null;

      if(!this.check(tile))
        this.rollback();

      return;
    }
  }

  rollback(){
    assert(!this.isSolved);

    const {stack} = this;
    assert(stack.length >= 1);

    const frame = stack.pop();
    const prev = O.last(stack);
    const {solved, unsolved, depth, rec, firstTile} = frame;
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

module.exports = CSP;