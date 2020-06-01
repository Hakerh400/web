'use strict';

game.levels = 1;

game.draw = (x, y, d, g) => {
  g.fillStyle = ['#00ffff', '#008000', '#00ff00'][d[0]];
  g.fillRect(x, y, 1, 1);
};

game.export = (x, y, d, bs) => {
  bs.write(d[0], 2);
};

game.import = (x, y, d, bs) => {
  d[0] = bs.read(2);
  if(d[0] === 1 && !game.arr[0]){
    game.arr[0] = 1;
    game.arr[1] = x;
    game.arr[2] = y;
  }
};

game.kb.dir = (dir, dx, dy) => {
  if(dir === 0) return;
  if(game.arr[0]){
    var x = game.arr[1];
    var y = game.arr[2];
    var shape = game.shape(x, y, (x, y, d) => d[0] === 1);
    var canMove = shape.every(([x, y, d]) => {
      d = game.get(x + dx, y + dy);
      return !(d === null || d[0] === 2);
    });
    if(canMove){
      shape.forEach(([x, y, d]) => d[0] = 0);
      shape.forEach(([x, y, d]) => game.get(x += dx, y += dy)[0] = 1);
      if(shape.length !== 4 && dir === 2) spawnTetromino(shape);
      game.arr[1] = x + dx;
      game.arr[2] = y + dy;
    }else if(dir === 2 && shape.length === 4){
      shape.forEach(([x, y, d]) => {
        d[0] = 2;
      });
      checkRows(shape);
      game.arr[0] = 0;
    }
  }else if(dir === 2){
    spawnTetromino(null);
  }
};

function spawnTetromino(shape){
  var n = 0;
  if(!game.arr[0]){
    var [x, y, d] = game.randTile((x, y, d) => !(y || d[0]));
    if(d === null) return;
    n = 1;
    shape = [[x, 0, d]];
    game.arr[0] = 1;
    game.arr[1] = x;
    game.arr[2] = 0;
  }
  var [x, y, d] = game.randElem(n ? shape : shape.filter(([x, y, d]) => game.get(x, 1)[0] === 1));
  var num = game.shape(x, 0, (x, y, d) => !(y || d[0])).length;
  num = Math.min(num, 4 - (shape.length - n));
  var x1 = O.bound(x + game.rand(3) - 1, 0, game.w - 1);
  if(game.get(x1, 1)[0] !== 1) x1 = x;
  do{
    if(x !== null && (x1 === null || game.rand(2))){
      game.get(x, 0)[0] = 1;
      if(x !== 0) x--;
      else x = null;
    }else{
      game.get(x1, 0)[0] = 1;
      if(x1 !== game.w - 1) x1++;
      else x1 = null;
    }
  }while(--num && game.rand(2));
}

function checkRows(shape){
  var shapes = [shape];

  while(1){
    var found = 0;
    shapes.forEach(shape => {
      var ys = [];
      shape.forEach(([x, y, d]) => !ys.includes(y) && ys.push(y));
      ys = ys.filter(y => {
        for(var x = 0; x < game.w; x++){
          if(game.get(x, y)[0] !== 2)
            return 0;
        }
        return 1;
      });
      if(ys.length === 0) return;
      found = 1;
      ys.forEach(y => {
        for(var x = 0; x < game.w; x++){
          game.get(x, y)[0] = 0;
        }
      });
    });
    if(!found) break;
    found = 0;
    shapes = [];
    while(1){
      shape = null;
      var id1 = game.getId();
      var floating, yy;
      loop: for(var y = game.h - 1; y >= 0; y--){
        for(var x = 0; x < game.w; x++){
          var d = game.get(x, y);
          if(d[0] !== 2 || d.id1 === id1) continue;
          var id2 = game.getId();
          floating = y !== game.h - 1;
          shape = game.shape(x, y, (x, y, d) => {
            if(d[0] !== 2) return 0;
            d.id1 = id1;
            d.id2 = id2;
            if(y === game.h - 1) floating = 0;
            return 1;
          });
          if(!floating){
            shape = null;
            continue;
          }
          yy = game.h;
          shape.forEach(([x, y, d]) => {
            var dy = 0;
            while(1){
              var d1 = game.get(x, y + dy + 1);
              if(d1 === null || (d1[0] !== 0 && d1.id2 !== id2)) break;
              dy++;
            }
            if(dy < yy) yy = dy;
          });
          break loop;
        }
      }
      if(shape === null) break;
      found = 1;
      shapes.push(shape);
      shape.forEach(([x, y, d]) => d[0] = 0);
      shape.forEach(obj => game.get(obj[0], obj[1] += yy)[0] = 2);
    }
    if(!found) break;
  }
}