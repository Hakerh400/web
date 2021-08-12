'use strict';

const assert = require('assert');

class Tile{
  #err = 0;

  constructor(grid, x, y){
    this.grid = grid;
    this.x = x;
    this.y = y;
    this.vals = this.initVals();
  }

  get csp(){ return this.grid.csp; }
  get wrap(){ return 0; }

  initVals(g){ O.virtual('initVals'); }
  render(g){ O.virtual('render'); }

  nav(dir){
    const {x, y, wrap} = this;
    return this.grid.nav1(x, y, dir, wrap);
  }

  get isSolved(){
    return this.vals.size === 1;
  }

  get val(){
    return O.the(this.vals);
  }

  set val(val){
    if(val === null){
      if(this.val !== null)
        this.vals = this.initVals();

      return;
    }

    const {vals} = this;
    assert(vals.has(val));
    if(vals.size === 1) return;

    vals.clear();
    vals.add(val);

    this.grid.unsolvedNum--;
  }

  setVal(val){
    this.val = null;
    this.val = val;
  }

  get err(){
    return this.#err;
  }

  set err(err){
    const {grid} = this;

    err = err ? 1 : 0;
    assert(err !== this.#err);

    this.#err = err;

    if(err) grid.addErrTile(this);
    else grid.removeErrTile(this);
  }

  shuffle(){
    this.vals = O.shuffleSet(this.vals);
  }
}

module.exports = Tile;