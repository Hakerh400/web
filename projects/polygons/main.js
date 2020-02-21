'use strict';

const Polygon = require('./polygon');
const Line = require('./line');
const Point = require('./point');

const {sin, cos} = Math;

const {w, h, g} = O.ceCanvas();
const [wh, hh] = [w, h].map(a => a / 2);

setTimeout(main);

function main(){
  const poly = new Polygon(O.ca(100, (i, k, n) => {
    const angle = -k * O.pi2;
    const x = wh + cos(angle) * O.randf(w / 4, w / 2);
    const y = hh + sin(angle) * O.randf(h / 4, h / 2);

    return new Point(x, y);
  }));

  const points = O.ca(5e3, i => {
    const x = O.randf(w);
    const y = O.randf(h);

    return new Point(x, y);
  });

  g.fillStyle = '#4af';
  poly.draw(g);

  for(const point of points){
    if(inside(poly, point)) g.fillStyle = '#f00';
    else g.fillStyle = '#0f0';
    point.draw(g);
  }
}

function side(line, p){
  const [x1, y1] = line.p1;
  const [x2, y2] = line.p2;
  const [x, y] = p;

  return neg((y - y1) * (x2 - x1) - (x - x1) * (y2 - y1));
}

function sameSide(line, p1, p2){
  return eq(side(line, p1), side(line, p2));
}

function oppositeSide(line, p1, p2){
  return neq(side(line, p1), side(line, p2));
}

function intersects(line1, line2){
  return oppositeSide(line1, line2.p1, line2.p2) & oppositeSide(line2, line1.p1, line1.p2);
}

function inside(poly, p){
  const mainLine = new Line(p, new Point(Infinity, p.y));
  let inside = 1;

  for(const line of poly.lines)
    inside ^= intersects(mainLine, line);

  return inside;
}

function neg(num){
  return num < 0;
}

function eq(b1, b2){
  return b1 ^ b2 ^ 1;
}

function neq(b1, b2){
  return b1 ^ b2;
}