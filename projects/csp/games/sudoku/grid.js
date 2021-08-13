'use strict';

const assert = require('assert');
const GridBase = require('../../grid');
const Tiles = require('./tiles');

class Grid extends GridBase{
  constructor(w, h){
    super();

    assert(w === h);

    this.w = w;
    this.h = h;
    this.size = w;

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
          const tile = new Tiles.Square(this, x, y);
          squaresRow.push(tile);
          this.addTile(tile);
        }

        if(x < w){
          const tile = new Tiles.Line(this, x, y, 0);
          hlinesRow.push(tile);
          this.addTile(tile);
        }

        if(y < h){
          const tile = new Tiles.Line(this, x, y, 1);
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
    const {csp, w, h, err} = this;
    const {gs} = g;

    g.fillStyle = '#e6e6e6';
    g.fillRect(0, 0, w, h);

    this.iter((x, y, d) => {
      g.save();
      g.translate(x, y);

      if(d !== null && !d.err)
        d.render(g);

      g.restore();
    });

    g.globalCompositeOperation = 'darken';

    this.iter((x, y, d, h, v) => {
      g.save();
      g.translate(x, y);

      if(h !== null && !h.err)
        h.render(g);

      if(v !== null && !v.err)
        v.render(g);
      
      g.restore();
    });

    g.globalCompositeOperation = 'source-over';

    if(err !== null){
      for(const tile of this.errTiles){
        g.save();
        g.translate(tile.x, tile.y);
        tile.render(g);
        g.restore();
      }

      const {fontSize} = g;
      const fontSizeNew = fontSize / 2;

      g.font(fontSizeNew);
      g.fillStyle = '#800';
      g.fillText(csp.cnstrs[err], w / 2, -.5);

      g.font(fontSize);
    }
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

module.exports = Grid;