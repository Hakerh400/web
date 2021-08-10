'use strict';

const assert = require('assert');
const Grid = require('./grid');
const Tile = require('./tile-sudoku');

class GridSudoku extends Grid{
  constructor(w, h){
    super();

    assert(w === h);

    this.w = w;
    this.h = h;

    const squareVals = O.ca(w, i => i + 1);
    const lineVals = [0, 1];

    const squares = [];
    const hlines = [];
    const vlines = [];

    for(let y = 0; y <= h; y++){
      const squaresRow = [];
      const hlinesRow = [];
      const vlinesRow = y < h ? [] : null;

      squares.push(squaresRow);
      hlines.push(hlinesRow);
      if(y < h) vlines.push(vlinesRow);

      for(let x = 0; x <= w; x++){
        if(x < w && y < h){
          const tile = new Tile.Square(this, x, y, new Set(squareVals));
          squaresRow.push(tile);
          this.addTile(tile);
        }

        if(x < w){
          const tile = new Tile.HLine(this, x, y, new Set(lineVals));
          hlinesRow.push(tile);
          this.addTile(tile);
        }

        if(y < h){
          const tile = new Tile.VLine(this, x, y, new Set(lineVals));
          vlinesRow.push(tile);
          this.addTile(tile);
        }
      }
    }

    this.squares = squares;
    this.hlines = hlines;
    this.vlines = vlines;
  }

  render(g){
    const {w, h} = this;
    const {gs} = g;

    this.iter((x, y, d) => {
      g.save();
      g.translate(x, y);

      if(d !== null) d.render(g);

      g.restore();
    });

    g.globalCompositeOperation = 'darken';

    this.iter((x, y, d, h, v) => {
      g.save();
      g.translate(x, y);

      if(h !== null) h.render(g);
      if(v !== null) v.render(g);
      
      g.restore();
    });

    g.globalCompositeOperation = 'source-over';
  }

  has(x, y){
    if(x < 0 || x >= this.w) return 0;
    if(y < 0 || y >= this.h) return 0;
    return 1;
  }

  getSquare(x, y){
    if(!this.has(x, y)) return null;
    return this.getTile(this.squares[y][x]);
  }

  getHLine(x, y){
    if(x < 0 || x >= this.w) return null;
    if(y < 0 || y >  this.h) return null;
    return this.getTile(this.hlines[y][x]);
  }

  getVLine(x, y){
    if(x < 0 || x >  this.w) return null;
    if(y < 0 || y >= this.h) return null;
    return this.getTile(this.vlines[y][x]);
  }

  iter(func){
    const {w, h} = this;

    for(let y = 0; y <= h; y++){
      for(let x = 0; x <= w; x++){
        const d = this.getSquare(x, y);
        const h = this.getHLine(x, y);
        const v = this.getVLine(x, y);

        func(x, y, d, h, v);
      }
    }
  }
}

module.exports = GridSudoku;