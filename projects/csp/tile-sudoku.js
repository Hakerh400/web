'use strict';

const assert = require('assert');
const TileBase = require('./tile');
const flags = require('./flags');

const RENDER_SMALL_VALS = flags.debug;

const n = 2;
const n2 = n ** 2;

class Tile extends TileBase{
  get isSquare(){ return 0; }
  get isLine(){ return 0; }
}

class Square extends Tile{
  constructor(grid, x, y){
    const vals = new Set(O.ca(grid.size, i => i + 1));
    super(grid, x, y, vals);
  }

  render(g){
    const {x, y, vals} = this;

    g.fillStyle = '#e6e6e6';
    g.fillRect(0, 0, 1, 1);

    if(vals.size === 1){
      g.fillStyle = 'black';
      g.fillText(O.the(vals), .5, .5);
      return;
    }

    if(!RENDER_SMALL_VALS)
      return;

    const {fontSize} = g;

    g.font(fontSize / n);
    g.fillStyle = 'black';

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

    g.font(fontSize);
  }

  get isSquare(){ return 1; }
}

class Line extends Tile{
  constructor(grid, x, y){
    const vals = new Set([0, 1]);
    super(grid, x, y, vals);
  }

  get isLine(){ return 1; }
  get isHLine(){ return 0; }
  get isVLine(){ return 0; }

  render(g){
    const hor = this.isHLine;
    const {val} = this;

    const t = g.gs * (val !== 0 ? 1 : 0);
    const s = t * 2;

    g.fillStyle = val === 0 ? '#cfcfcf' :
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

  getAdjSquares(){
    const {grid, x, y} = this;
    const hor = this.isHLine;

    const x1 = x - !hor;
    const y1 = y - hor;

    return [
      grid.getSquare(x1, y1),
      grid.getSquare(x, y),
    ];
  }
}

class HLine extends Line{
  get isHLine(){ return 1; }
}

class VLine extends Line{
  get isVLine(){ return 1; }
}

module.exports = Object.assign(Tile, {
  Square,
  Line,
  HLine,
  VLine,
});