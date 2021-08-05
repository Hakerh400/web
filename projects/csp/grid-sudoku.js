'use strict';

const assert = require('assert');
const Grid = require('./grid');

class GridSudoku extends Grid{
  constructor(w, h, func){
    super();

    this.w = w;
    this.h = h;

    const squares = [];

    for(let y = 0; y !== h; y++){
      const row = [];

      squares.push(row);

      for(let x = 0; x !== w; x++){
        const tile = func(this, x, y);

        row.push(tile);
        this.addTile(tile);
      }
    }

    this.squares = squares;
  }

  has(x, y){
    if(x < 0 || x >= this.w) return 0;
    if(y < 0 || y >= this.h) return 0;
    return 1;
  }

  get(x, y){
    if(!this.has(x, y)) return null;
    return this.squares[y][x];
  }

  iter(func){
    const {w, h, squares} = this;

    for(let y = 0; y !== h; y++){
      const row = squares[y];

      for(let x = 0; x !== w; x++){
        const d = row[x];
        func(d, x, y);
      }
    }
  }
}

module.exports = GridSudoku;