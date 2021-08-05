'use strict';

const assert = require('assert');
const Tile = require('./tile');

const n = 2;
const n2 = n ** 2;

class TileSudoku extends Tile{
  render(g){
    const {x, y, vals} = this;
    const p = (x / n | 0) + (y / n | 0) & 1;

    g.fillStyle = p ? '#aaa' : '#fff';
    g.fillRect(0, 0, 1, 1);

    if(vals.size === 1){
      g.fillStyle = 'black';
      g.fillText(O.the(vals), .5, .5);
      return;
    }

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
}

module.exports = TileSudoku;