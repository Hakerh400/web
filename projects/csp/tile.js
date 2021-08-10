'use strict';

const assert = require('assert');

class Tile{
  constructor(grid, x, y, vals){
    this.grid = grid;
    this.x = x;
    this.y = y;
    this.vals = vals;
  }

  get csp(){ return this.grid.csp; }
  get wrap(){ return 0; }

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
    const {vals} = this;
    assert(vals.has(val));
    if(vals.size === 1) return;

    vals.clear();
    vals.add(val);

    this.grid.unsolvedNum--;
  }
}

module.exports = Tile;