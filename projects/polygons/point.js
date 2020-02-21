'use strict';

class Point{
  constructor(x, y){
    this.x = x;
    this.y = y;
  }

  draw(g){
    g.beginPath();
    g.arc(this.x, this.y, 3, 0, O.pi2);
    g.fill();
    g.stroke();
  }

  *[Symbol.iterator](){
    yield this.x;
    yield this.y;
  }
}

module.exports = Point;