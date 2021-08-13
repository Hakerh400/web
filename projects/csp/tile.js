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

  get isSquare(){ return 0; }
  get isLine(){ return 0; }

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

class Square extends Tile{
  get isSquare(){ return 1; }
}

class Line extends Tile{
  constructor(grid, x, y, type){
    super(grid, x, y);
    this.type = type;
  }

  get isLine(){ return 1; }

  get hor(){ return this.type === 0; }
  get vert(){ return this.type === 1; }

  initVals(){
    return new Set([0, 1]);
  }

  getAdjSquares(){
    const {grid, x, y, hor} = this;

    const x1 = x - !hor;
    const y1 = y - hor;

    return [
      grid.getSquare(x1, y1),
      grid.getSquare(x, y),
    ];
  }
}

module.exports = Object.assign(Tile, {
  Square,
  Line,
});