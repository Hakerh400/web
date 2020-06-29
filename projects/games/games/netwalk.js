'use strict';

game.defaultW = 9;
game.defaultH = 9;

let offsetX = 0;
let offsetY = 0;

game.draw = (x, y, d, g) => {
  const d1 = d[1];

  g.fillStyle = d1 ?
    d1 > 1 ? '#404040' : '#808080' :
    '#c0c0c0';

  g.fillRect(x, y, 1, 1);

  g.fillStyle = d1 ?
    d[2] ? '#aaaa00' : '#008000' :
    d[2] ? '#ffff00' : '#00ff00';

  game.tube(x, y, d[0], .25, 1);
};

game.export = (x, y, d, bs) => {
  const {w, h} = game;

  if(x === 0 && y === 0){
    bs.write(offsetX, w - 1);
    bs.write(offsetY, h - 1);
  }

  bs.write(d[0], 15);
  bs.write(d[1], 1e3);
  bs.write(d[2], 1);
};

game.import = (x, y, d, bs) => {
  const {w, h} = game;

  if(x === 0 && y === 0){
    offsetX = bs.read(w - 1);
    offsetY = bs.read(h - 1);
  }

  d[0] = bs.read(15);
  d[1] = bs.read(1e3);
  d[2] = bs.read(1);
};

game.generate = () => {
  var {w, h} = game;
  game.iterate((x, y, d) => d[0] = d[1] = d[2] = 0);
  var [x, y] = [w, h].map(a => a >> 1);
  var id = game.getId();
  var d = game.get(x, y);
  var queue = [[x, y, d]];
  d.id1 = id;
  while(queue.length !== 0){
    [x, y, d] = queue.splice(O.rand(queue.length), 1)[0];
    if(d[0]) continue;
    d.id = id;
    var dirs = [];
    var q = [];
    for(var dir = 0; dir < 4; dir++){
      var x1 = x + (dir === 1 ? -1 : dir === 3 ? 1 : 0);
      var y1 = y + (dir === 0 ? -1 : dir === 2 ? 1 : 0);
      if(x1 === -1) x1 = w - 1;
      else if(x1 === w) x1 = 0;
      if(y1 === -1) y1 = h - 1;
      else if(y1 === h) y1 = 0;
      var d1 = game.get(x1, y1);
      var ddir1 = 1 << dir;
      var ddir2 = 1 << (dir + 2 & 3);
      if(d1.id === id && (d1[0] || d1.id1 === id)){
        if((d[0] | ddir1) === 15 || (d1[0] | ddir2) === 15) continue;
        dirs.push([d1, dir]);
      }else{
        q.push([x1, y1, d1]);
      }
    }
    if(d.id1 === id || dirs.length !== 0) queue.push(...q);
    if(dirs.length !== 0){
      var [d1, dir] = dirs[O.rand(dirs.length)];
      d[0] |= 1 << dir;
      d1[0] |= 1 << (dir + 2 & 3);
    }else{
      queue.push([x, y, d]);
    }
  }
  game.iterate((x, y, d) => {
    d[0] = ((d[0] | (d[0] << 4)) >> O.rand(4)) & 15;
  });
};

game.mouse.lmb = (x, y, d) => {
  if(d[1]) return;
  d[0] = ((d[0] | (d[0] << 4)) >> 1) & 15;
};

game.mouse.rmb = (x, y, d) => {
  if(d[1] === 0) d[1] = 1;
  else if(d[1] === 1) d[1] = 0;
};

game.kb.KeyR = () => {
  game.iterate((a, y, d) => d[1] = 0);
};

game.kb.KeyS = () => {
  game.iterate((x, y, d) => d[1] !== 0 && d[1] !== 1e3 && d[1]++);
};

game.kb.KeyX = () => {
  let n = 0;

  game.iterate((x, y, d) => d[1] >= 2 && (n = 1));
  if(n) game.iterate((x, y, d) => d[1] !== 0 && d[1]--);
};

game.kb.Enter = () => {
  game.iterate((x, y, d) => d[1] >= 2 && d[1]--);
};

game.kb.KeyQ = () => {
  const {w, h} = game;
  const {cx, cy} = game;
  const d = game.get(cx, cy);

  game.iterate((x, y, d) => d[2] = 0);
  if(d === null) return;

  const stack = [[cx, cy, d]];

  while(stack.length !== 0){
    const [x, y, d] = stack.pop();
    if(d[2]) continue;

    d[2] = 1;

    if(d[0] & 1){
      const y1 = y === 0 ? h - 1 : y - 1;
      const d1 = game.get(x, y1);
      if(!d1[2] && (d1[0] & 4)) stack.push([x, y1, d1]);
    }

    if(d[0] & 2){
      const x1 = x === 0 ? w - 1 : x - 1;
      const d1 = game.get(x1, y);
      if(!d1[2] && (d1[0] & 8)) stack.push([x1, y, d1]);
    }

    if(d[0] & 4){
      const y1 = y === h - 1 ? 0 : y + 1;
      const d1 = game.get(x, y1);
      if(!d1[2] && (d1[0] & 1)) stack.push([x, y1, d1]);
    }

    if(d[0] & 8){
      const x1 = x === w - 1 ? 0 : x + 1;
      const d1 = game.get(x1, y);
      if(!d1[2] && (d1[0] & 2)) stack.push([x1, y, d1]);
    }
  }
};

const scroll = (dx, dy) => {
  const {w, h} = game;
  const map = new Map();

  offsetX = ((offsetX + dx) % w + w) % w;
  offsetY = ((offsetY + dy) % h + h) % h;

  game.iterate((x, y, d) => {
    const x1 = ((x + dx) % w + w) % w;
    const y1 = ((y + dy) % h + h) % h;
    const d1 = game.get(x1, y1);

    map.set(d1, [d[0], d[1], d[2]]);
  });

  game.iterate((x, y, d) => {
    const d1 = map.get(d);

    d[0] = d1[0];
    d[1] = d1[1];
    d[2] = d1[2];
  });
};

game.kb.dir = (dir, dx, dy) => {
  scroll(-dx, -dy);
};

game.kb.Space = () => {
  scroll(-offsetX, -offsetY);
};