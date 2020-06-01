'use strict';

game.levels = 10;

game.draw = (x, y, d, g) => {
  if(d[3]){
    g.fillStyle = '#808080';
    g.fillRect(x, y, 1, 1);
    return;
  }
  if(d[2]) g.fillStyle = '#0000ff';
  else g.fillStyle = '#00ffff';
  g.fillRect(x, y, 1, 1);
  if(d[1]){
    g.fillStyle = '#ffff00';
    g.beginPath();
    g.rect(x + .25, y + .25, .5, .5);
    g.fill();
    g.stroke();
    return;
  }
  if(d[0]){
    g.fillStyle = '#ff0000';
    g.beginPath();
    g.moveTo(x + .5, y + .2);
    g.lineTo(x + .8, y + .5);
    g.lineTo(x + .5, y + .8);
    g.lineTo(x + .2, y + .5);
    g.closePath();
    g.fill();
    g.stroke();
  }
};

game.export = (x, y, d, bs) => {
  if(d[3]) return bs.write(1, 1);
  bs.write(0, 1);
  bs.write(d[2], 1);
  if(d[1]) return bs.write(1, 1);
  bs.write(0, 1);
  bs.write(d[0], 1);
};

game.import = (x, y, d, bs) => {
  if(bs.read(1)) return d[3] = 1;
  d[2] = bs.read(1);
  if(bs.read(1)) return d[1] = 1;
  if(bs.read(1)){
    d[0] = 1;
    game.arr[0] = x;
    game.arr[1] = y;
  }
};

game.kb.dir = (dir, dx, dy) => {
  var {0: x, 1: y} = game.arr;
  move(x, y, x + dx, y + dy, x + (dx << 1), y + (dy << 1));
};

function move(x1, y1, x2, y2, x3, y3){
  var d1 = game.get(x1, y1);
  var d2 = game.get(x2, y2);
  if(d2 === null || d2[3]) return;
  if(d2[1] === 0){
    d1[0] = 0;
    d2[0] = 1;
  }else{
    var d3 = game.get(x3, y3);
    if(d3 === null || d3[1] || d3[3]) return;
    d1[0] = 0;
    d2[0] = 1;
    d2[1] = 0;
    d3[1] = 1;
  }
  game.arr[0] = x2;
  game.arr[1] = y2;
}