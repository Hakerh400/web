'use strict';

const Transition = require('./transition');

class Translation extends Transition{
  constructor(tile1, tile2, intp){
    super(intp);

    this.tile1 = tile1;
    this.tile2 = tile2;
  }

  apply(g, k, cs){
    const k2 = this.intp(k);
    const k1 = 1 - k2;

    const [x1, y1] = cs(this.tile1);
    const [x2, y2] = cs(this.tile2);

    g.translate(x1 * k1 + x2 * k2, y1 * k1 + y2 * k2);
  }
}

module.exports = Translation;