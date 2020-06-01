'use strict';

game.levels = 1;

game.draw = (x, y, d, g) => {
  g.fillStyle = ['#00ffff', '#00ff80'][(x / 3 ^ y / 3) & 1];
  g.fillRect(x, y, 1, 1);
  if(d[0]){
    g.fillStyle = ['#000000', '#0000ff'][d[1]];
    g.fillText(d[0], x + .5, y + .5);
  }
};

game.export = (x, y, d, bs) => {
  if(d[0]){
    bs.write(d[0], 9);
    bs.write(d[1], 1);
  }else{
    bs.write(0, 9);
  }
};

game.import = (x, y, d, bs) => {
  if(d[0] = bs.read(9)){
    d[1] = bs.read(1);
  }else{
    d[1] = 1;
  }
};

game.kb.digit = (digit => {
  var x = game.cx;
  var y = game.cy;
  var d = game.get(x, y);
  if(d === null || !d[1]) return;
  if(d[0] === digit) d[0] = 0;
  else d[0] = digit;
});