'use strict';

const Line = require('./line');
const Point = require('./point');

class Polygon{
  constructor(points){
    this.points = points;
  }

  draw(g){
    g.beginPath();

    for(const point of this)
      g.lineTo(point.x, point.y);

    g.closePath();
    g.fill();
    g.stroke();
  }

  get len(){
    return this.points.length;
  }

  get lines(){
    const {points, len} = this;
    const lines = [];
    if(len === 0) return lines;

    for(let i = 1; i !== len; i++)
      lines.push(new Line(points[i - 1], points[i]));

    lines.push(new Line(points[len - 1], points[0]));

    return lines;
  }

  [Symbol.iterator](){
    return this.points[Symbol.iterator]();
  }
}

module.exports = Polygon;