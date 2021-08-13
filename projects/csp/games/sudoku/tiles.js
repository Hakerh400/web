'use strict';

const assert = require('assert');
const Tile = require('../../tile');
const flags = require('../../flags');

const {floor, ceil, round} = Math;

const RENDER_SMALL_VALS = flags.debug;

class Square extends Tile.Square{
  initVals(){
    const {grid} = this;
    return new Set(O.ca(grid.size, i => i + 1))
  }

  render(g){
    const {x, y, vals} = this;

    if(vals.size === 1){
      g.fillStyle = this.err ? 'red' : 'black';
      g.fillText(O.the(vals), .5, .5);
      return;
    }

    if(!RENDER_SMALL_VALS)
      return;

    const n = ceil(this.grid.size ** .5);
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

    g.font(fontSize);
  }
}

class Line extends Tile.Line{
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

module.exports = {
  Square,
  Line,
};