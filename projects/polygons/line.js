'use strict';

const Point = require('./point');

class Line{
  constructor(p1, p2){
    this.p1 = p1;
    this.p2 = p2;
  }

  draw(g){
    g.beginPath();
    g.lineTo(this.p1.x, this.p1.y);
    g.lineTo(this.p2.x, this.p2.y);
    g.fill();
    g.stroke();
  }

  *[Symbol.iterator](){
    yield this.p1;
    yield this.p2;
  }
}

module.exports = Line;