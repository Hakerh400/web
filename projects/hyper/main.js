'use strict';

const {g, w, h, wh, hh} = O.ceCanvas();

const {min, max, exp, sin, cos, atan2} = Math;

setTimeout(main);

function main(){
  g.fillStyle = '#000';
  g.fillRect(0, 0, w, h);

  const s = min(w, h) * .9 / 2;
  g.lineWidth = 1 / s;
  g.translate(wh, hh);
  g.scale(s, s);

  g.fillStyle = '#fff';
  g.beginPath();
  g.arc(0, 0, 1, 0, O.pi2);
  g.fill();

  g.strokeStyle = '#f00';
  g.beginPath();
  for(let x = -100; x < 100; x++)
    draw(x, -1);
  g.stroke();
}

function draw(x, y){
  const r = O.hypot(x, y);
  const a = atan2(y, x);

  const e = exp(r);
  const r1 = (e - 1) / (e + 1);

  const x1 = cos(a) * r1;
  const y1 = sin(a) * r1;
  g.lineTo(x1, y1);
}