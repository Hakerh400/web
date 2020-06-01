'use strict';

game.levels = 1;

game.draw = (x, y, d, g) => {
  g.fillStyle = d[0] < cols.length ? cols[d[0]] : '#3e3933';
  g.fillRect(x, y, 1, 1);
  if(d[0]){
    g.fillStyle = d[0] < 3 ? '#000000' : '#ffffff';
    var str = (1 << d[0]).toString();
    if(str.length !== 1) g.scaleFont(g.g.measureText('11').width / g.g.measureText(str).width);
    g.fillText(str, x + .5, y + .5);
    if(str.length !== 1) g.scaleFont(1);
  }
};

game.export = (x, y, d, bs) => {
  bs.write(d[0], 30);
};

game.import = (x, y, d, bs) => {
  d[0] = bs.read(30);
};

game.kb.dir = (dir, dx, dy) => {
  var {w, h} = game;
  var mode = dir & 1;
  var aa = mode ? h : w;
  var bb = mode ? w : h;
  var db = dir & 2 ? -1 : 1;
  var bb1 = db === 1 ? -1 : bb;
  var b01 = dir & 2 ? bb - 1 : 0;
  var b02 = dir & 2 ? -1 : bb;
  for(var a = 0; a < aa; a++){
    var b = bb1;
    var d = null;
    for(var b1 = b01; b1 !== b02; b1 += db){
      var d1 = mode ? game.get(b1, a) : game.get(a, b1);
      if(!d1[0]) continue;
      var val = d1[0];
      d1[0] = 0;
      if(d === null || val !== d[0]){
        b += db;
        d = mode ? game.get(b, a) : game.get(a, b);
        if(d[0] !== val){
          d[0] = val;
        }
      }else{
        d[0]++;
      }
    }
  }
  if(game.updated){
    spawnTile();
  }
};

function spawnTile(){
  var [x, y, d] = game.randTile((x, y, d) => !d[0]);
  if(d === null) return;
  d[0] = game.random() > .9 ? 2 : 1;
}

var cols = [
  '#ccc0b3',
  '#eee4da',
  '#ede0c8',
  '#f2b179',
  '#f59563',
  '#f67c5f',
  '#f65e3b',
  '#edcf72',
  '#edcc61',
  '#edc850',
  '#edc53f',
  '#edc22e',
];