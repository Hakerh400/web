'use strict';

const Transition = require('./transition');

const {pi, pi2, pi3} = O;

class Rotation extends Transition{
  constructor(angle1, angle2, pivot=null, intp){
    super(intp);

    this.pivot = pivot;
    this.angle1 = angle1;
    this.angle2 = angle2;
  }

  apply(g, k, cs){
    const {angle1, angle2, pivot} = this;
    
    const k2 = this.intp(k);
    const angle = angle1 + ((((((angle2 - angle1) % pi2) + pi3) % pi2) - pi) * k2) % pi2;

    if(pivot === null){
      g.rotate(angle);
      return;
    }

    const [x, y] = this.pivot.getCoords(cs);

    g.translate(x, y);
    g.rotate(angle);
    g.translate(-x, -y);
  }
}

module.exports = Rotation;