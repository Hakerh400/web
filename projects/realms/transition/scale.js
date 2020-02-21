'use strict';

const Transition = require('./transition');

class Scale extends Transition{
  constructor(scale1, scale2, pivot=null, intp){
    super(intp);

    this.scale1 = scale1;
    this.scale2 = scale2;
    this.pivot = pivot;
  }

  apply(g, k, cs){
    const {scale1, scale2, pivot} = this;

    const k2 = this.intp(k);
    const k1 = 1 - k2;
    const scale = scale1 * k1 + scale2 * k2;

    if(pivot === null){
      g.scale(scale, scale);
      return;
    }

    const [x, y] = this.pivot.getCoords(cs);

    g.translate(x, y);
    g.scale(scale, scale);
    g.translate(-x, -y);
  }
}

module.exports = Scale;