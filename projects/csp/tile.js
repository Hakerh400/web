'use strict';

const assert = require('assert');
const TileBase = require('./tile-base');

class Tile extends TileBase{
  render(g){
    const {x, y, vals} = this;
    const p = (x / 3 | 0) + (y / 3 | 0) & 1;

    g.fillStyle = p ? '#aaa' : '#fff';
    g.fillRect(0, 0, 1, 1);

    if(vals.size === 1){
      g.fillStyle = 'black';
      g.fillText(O.the(vals), .5, .5);
      return;
    }

    return;

    const {fontSize} = g;

    g.font(fontSize / 3);
    g.fillStyle = 'black';

    for(const val of vals){
      const i = val - 1;
      const x = i % 3;
      const y = i / 3 | 0;

      g.fillText(
        val,
        x / 3 + 1 / 6,
        y / 3 + 1 / 6,
      );
    }

    g.font(fontSize);
  }
}

module.exports = Tile;