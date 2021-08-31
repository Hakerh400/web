'use strict';

const assert = require('assert');

const {floor, ceil, round} = Math;

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

  initVals(g){
    return new Set();
  }

  render(g){ O.virtual('render'); }

  get unknown(){ return this.val === null; }

  nav(dir){
    const {x, y, wrap} = this;
    return this.grid.nav1(x, y, dir, wrap);
  }

  get solved(){
    return this.vals.size === 1;
  }

  get val(){
    const val = O.the(this.vals);
    if(val !== null) return val;

    const {relsTemp} = this.grid.csp;

    if(relsTemp !== null)
      relsTemp.add(this);

    return null;
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
  shapeSize;
  isShapeComplete;

  get isSquare(){ return 1; }

  *iterRow(){
    const {grid} = this;
    const {w} = grid;
    const {y} = this;

    for(let i = 0; i !== w; i++)
      yield grid.getSquare(i, y);
  }

  *iterCol(){
    const {grid} = this;
    const {h} = grid;
    const {x} = this;

    for(let i = 0; i !== h; i++)
      yield grid.getSquare(x, i);
  }

  *iterShape(){
    const {grid} = this;
    const stack = [this];
    const seen = new Set(stack);

    let isShapeComplete = 1;

    while(stack.length !== 0){
      const tile = stack.pop();
      const {x, y} = tile;

      yield tile;

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
          isShapeComplete = 0;
          continue;
        }

        if(val === 1) continue;

        const tile = grid.getSquare(x1, y1);
        if(tile === null || seen.has(tile)) continue;

        seen.add(tile);
        stack.push(tile);
      }
    }

    this.isShapeComplete = isShapeComplete;
    this.shapeSize = seen.size;
  }

  *getRelIters(){
    yield this.iterRow();
    yield this.iterCol();
    yield this.iterShape();
  }

  *iterRelsRaw(){
    for(const iter of tile.getRelIters())
      yield* iter;
  }

  iterRels(){
    return O.undupeIter(this.iterRelsRaw());
  }

  *iterLines(){
    const {grid, x, y} = this;

    yield grid.getHLine(x, y);
    yield grid.getVLine(x + 1, y);
    yield grid.getHLine(x, y + 1);
    yield grid.getVLine(x, y);
  }

  *iterFullLines(){
    for(const line of this.iterLines())
      if(line.full) yield line;
  }

  getLinesCntBounds(){
    let full = 0;
    let unknown = 0;

    for(const line of this.iterLines()){
      const {val} = line;
      if(val === 0) continue;

      if(val === 1){
        full++;
        continue;
      }

      unknown++;
    }

    return [full, full + unknown];
  }
}

class NumberSquare extends Square{
  get isSquare(){ return 1; }

  render(g){
    const {x, y, vals} = this;

    if(vals.size === 1){
      g.fillStyle = this.err ? 'red' : 'black';
      g.fillText(O.the(vals), .5, .5);
      return;
    }

    /*const n = ceil(this.grid.size ** .5);
    const {fontSize} = g;

    g.font(fontSize / n);
    g.fillStyle = this.err ? 'red' : 'black';

    for(const val of vals){
      const i = val - 1;
      const x = i % n;
      const y = i / n | 0;

      g.fillText(
        val,
        (x + .5) / n,
        (y + .5) / n,
      );
    }

    g.font(fontSize);*/
  }
}

class Line extends Tile{
  pathLines;
  isLoop;

  constructor(grid, x, y, type){
    super(grid, x, y);
    this.type = type;
  }

  get isLine(){ return 1; }

  get hor(){ return this.type === 0; }
  get vert(){ return this.type === 1; }

  get full(){ return this.val === 1; }
  get empty(){ return this.val === 0; }

  initVals(){
    return new Set([0, 1]);
  }

  *iterAdjS2(){
    const {grid, x, y, hor} = this;

    const x1 = x - !hor;
    const y1 = y - hor;

    yield grid.getSquare(x1, y1);
    yield grid.getSquare(x, y);
  }

  *iterBranches(){
    const {grid, x, y} = this;

    if(this.hor){
      yield [
        grid.getHLine(x - 1, y),
        grid.getVLine(x, y - 1),
        grid.getVLine(x, y),
      ];

      yield [
        grid.getHLine(x + 1, y),
        grid.getVLine(x + 1, y - 1),
        grid.getVLine(x + 1, y),
      ];

      return;
    }

    yield [
      grid.getVLine(x, y - 1),
      grid.getHLine(x - 1, y),
      grid.getHLine(x, y),
    ];

    yield [
      grid.getVLine(x, y + 1),
      grid.getHLine(x - 1, y + 1),
      grid.getHLine(x, y + 1),
    ];
  }

  *iterFullBranches(all=0){
    branchesLoop: for(const lines of this.iterBranches()){
      const fullLines = [];

      for(const line of lines){
        if(line === null) continue;

        const {val} = line;

        if(val === null){
          if(all) continue;

          yield null;
          continue branchesLoop;
        }

        if(val === 0) continue;

        fullLines.push(line);
      }

      yield fullLines;
    }
  }

  getDangling(){
    const {grid, x, y, val} = this;

    if(val === null)
      return null;

    const targetNum = val ^ 1;

    for(const fullLines of this.iterFullBranches()){
      if(fullLines === null) continue;
      if(fullLines.length !== targetNum) continue;

      if(val === 1)
        fullLines.push(this);

      return fullLines;
    }

    return null;
  }

  getBranching(){
    const {val} = this;

    if(val !== 1)
      return null;

    for(const fullLines of this.iterFullBranches(1)){
      assert(fullLines !== null);
      if(fullLines.length !== 2) continue;

      if(val === 1)
        fullLines.push(this);

      return fullLines;
    }

    return null;
  }

  *iterPath(){
    assert(this.full);

    const pathLines = new Set([this]);

    this.isLoop = 0;
    this.pathLines = pathLines;

    yield this;

    for(let dir of [0, 1]){
      let line = null;
      let next = this;

      while(1){
        line = next;
        next = null;

        const branch = O.elemAt(line.iterBranches(), dir);

        for(const line of branch){
          if(line === null) continue;
          if(!line.full) continue;

          assert(next === null);
          next = line;
        }

        if(next === null) break;

        if(next === this){
          this.isLoop = 1;
          return;
        }

        yield next;
        pathLines.add(next);

        const {x, y} = line;
        const {x: x1, y: y1} = next;

        if(dir === 0){
          if(x1 === x && y1 === y) dir = 1;
          continue;
        }

        if(line.hor){
          if(x1 === x + 1 && y1 === y - 1) dir = 0;
          continue;
        }

        if(x1 === x - 1 && y1 === y + 1) dir = 0;
      }
    }
  }

  isClosed(){
    O.execIter(this.iterPath());
    return this.isLoop;
  }
}

class SimpleLine extends Line{
  render(g){
    const {hor, val} = this;

    const t = g.gs * (val !== 0 ? 1 : 0);
    const s = t * 2;

    g.fillStyle = this.err ? 'red' :
      val === 0 ? '#cfcfcf' :
      val === 1 ? '#000000' : '#cfcf00';

    const x = 0;
    const y = 0;
    const w = hor ? 1 : 0;
    const h = hor ? 0 : 1;

    g.fillRect(
      x - t,
      y - t,
      w + s,
      h + s,
    );
  }
}

module.exports = Object.assign(Tile, {
  Square,
  NumberSquare,
  Line,
  SimpleLine,
});