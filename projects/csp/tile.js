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

  getDangling(){
    const {grid, x, y} = this;

    let danglingLine = null;

    const checkDangling = coords => {
      let fullLinesNum = 0;
      let fullLine = null;

      for(let i = 0; i !== coords.length; i += 3){
        const x = coords[i];
        const y = coords[i + 1];
        const vert = coords[i + 2];

        const line = vert ?
          grid.getVLine(x, y) : grid.getHLine(x, y);

        if(line === null) continue;

        const {val} = line;
        if(val === null) return 0;
        if(val === 0) continue;

        fullLinesNum++;
        fullLine = line;
      }

      if(fullLinesNum === 1){
        danglingLine = fullLine;
        return 1;
      }

      return 0;
    };

    if(this.hor){
      if(checkDangling([
        x - 1, y, 0,
        x, y - 1, 1,
        x, y, 1,
      ])) return danglingLine;

      if(checkDangling([
        x + 1, y, 0,
        x + 1, y - 1, 1,
        x + 1, y, 1,
      ])) return danglingLine;
    }else{
      if(checkDangling([
        x, y - 1, 1,
        x - 1, y, 0,
        x, y, 0,
      ])) return danglingLine;

      if(checkDangling([
        x, y + 1, 1,
        x - 1, y + 1, 0,
        x, y + 1, 0,
      ])) return danglingLine;
    }

    return null;
  }
}

module.exports = Object.assign(Tile, {
  Square,
  Line,
});