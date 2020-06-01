'use strict';

game.levels = 2;

game.draw = (x, y, d, g) => {
  if(d[2]){
    g.fillStyle = '#808080';
    g.fillRect(x, y, 1, 1);
    return;
  }
  g.fillStyle = '#00ffff';
  g.fillRect(x, y, 1, 1);
  if(d[1]){
    g.fillStyle = '#ffff00';
    g.beginPath();
    g.arc(x + .5, y + .5, .3, 0, O.pi2);
    g.fill();
    g.stroke();
    return;
  }
  if(d[0]){
    if(d[0] & 16) g.fillStyle = '#009000';
    else g.fillStyle = '#00ff00';
    game.tube(x, y, d[0] & 15);
  }
};

game.export = (x, y, d, bs) => {
  if(d[2]) return bs.write(1, 1);
  bs.write(0, 1);
  if(d[1]) return bs.write(1, 1);
  bs.write(0, 1);
  bs.write(d[0], 31);
};

game.import = (x, y, d, bs) => {
  if(bs.read(1)) return d[2] = 1;
  if(bs.read(1)) return d[1] = 1;
  d[0] = bs.read(31);
  if(d[0] & 16){
    game.arr[0] = x;
    game.arr[1] = y;
  }
  if([1, 2, 4, 8, 16].includes(d[0])){
    game.arr[2] = x;
    game.arr[3] = y;
  }
};

game.kb.dir = (dir, dx, dy) => {
  var x1 = game.arr[0];
  var y1 = game.arr[1];
  var d1 = game.get(x1, y1);
  var x2 = x1 + dx;
  var y2 = y1 + dy;
  var d2 = game.get(x2, y2);
  if(d2 === null || ![0, 1, 2, 4, 8].includes(d2[0] & 15) || d2[2]) return;
  game.arr[0] = x2;
  game.arr[1] = y2;
  if(d2[1]){
    d1[0] |= 1 << dir;
    d1[0] &= ~16;
    d2[0] |= 1 << (dir + 2 & 3);
    d2[0] |= 16;
  }else{
    if(d1[0] & 15){
      moveTail();
      d1[0] |= 1 << dir;
      d1[0] &= ~16;
      d2[0] |= 1 << (dir + 2 & 3);
      d2[0] |= 16;
    }else{
      d1[0] = 0;
      d2[0] = 16;
      game.arr[2] = x2;
      game.arr[3] = y2;
    }
  }
  if(d2[1]){
    d2[1] = 0;
    spawnGem();
  }
};

function moveTail(){
  var x1 = game.arr[2];
  var y1 = game.arr[3];
  var d1 = game.get(x1, y1);
  if(d1[0] & 16) return;
  var dir = [1, 2, 4, 8].indexOf(d1[0] & 15);
  var dx = dir === 1 ? -1 : dir === 3 ? 1 : 0;
  var dy = dir === 0 ? -1 : dir === 2 ? 1 : 0;
  var x2 = x1 + dx;
  var y2 = y1 + dy;
  var d2 = game.get(x2, y2);
  game.arr[2] = x2;
  game.arr[3] = y2;
  d1[0] = 0;
  d2[0] &= ~(1 << (dir + 2 & 3));
}

function spawnGem(){
  var [x, y, d] = game.randTile((x, y, d) => {
    return !(d[0] || d[1] || d[2]);
  });
  if(d !== null){
    d[1] = 1;
  }
}