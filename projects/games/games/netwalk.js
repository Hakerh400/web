'use strict';

O.enhanceRNG();
O.randSeed(0);

const {pi2} = O;

game.defaultW = 9;
game.defaultH = 9;

let offsetX = 0;
let offsetY = 0;

const adj = (x, y, f) => {
  const {w, h} = game;
  let t;

  f(x, t = (y - 1 + h) % h, game.get(x, t), 0);
  f(t = (x - 1 + w) % w, y, game.get(t, y), 1);
  f(x, t = (y + 1 + h) % h, game.get(x, t), 2);
  f(t = (x + 1 + w) % w, y, game.get(t, y), 3);
};

game.draw = (x, y, d, g) => {
  const d1 = d[1];
  const d2 = d[2];
  const d3 = d[3];

  g.fillStyle = d3 ? '#ff0000' : d1 ?
    d1 > 1 ? '#404040' : '#808080' :
    '#c0c0c0';

  g.fillRect(x, y, 1, 1);

  g.fillStyle = d1 ?
    d2 ? '#aaaa00' : '#008000' :
    d2 ? '#ffff00' : '#00ff00';

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
  bs.write(d[3], 1);
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
  d[3] = bs.read(1);
};

game.generate = () => {
  const {w, h, grid} = game;

  game.iterate((x, y, d) => {
    d[0] = d[1] = d[2] = d[3] = 0;
  });

  if(w === 1 && h === 1) return;

  const pending = new O.Set2D();

  const addAdj = (x, y) => {
    adj(x, y, (x, y, d, dir) => {
      if(pending.has(x, y)) return;
      if(d[0] !== 0) return;

      pending.add(x, y);
    });
  };

  {
    const x1 = O.rand(w);
    const y1 = O.rand(h);

    const dir = O.randElem(O.ca(4, i => i).filter(dir => {
      if((dir & 1) === 0 && h === 1) return 0;
      if((dir & 1) === 1 && w === 1) return 0;
      return 1;
    }));

    const x2 = (x1 + (dir === 1 ? -1 : dir === 3 ? 1 : 0) + w) % w;
    const y2 = (y1 + (dir === 0 ? -1 : dir === 2 ? 1 : 0) + h) % h;

    game.get(x1, y1)[0] = 1 << dir;
    game.get(x2, y2)[0] = 1 << (dir + 2 & 3);

    addAdj(x1, y1);
    addAdj(x2, y2);
  }

  while(pending.size !== 0){
    const [x, y] = O.randElem([...pending]);
    const d = game.get(x, y);
    const avail = [];
    let dir = 0;

    adj(x, y, (x, y, d, dir) => {
      if(d[0] === 0) return;
      if(d[0] === (15 ^ (1 << (dir + 2 & 3)))) return;

      avail.push([dir, d]);
    });

    if(avail.length === 0) continue;
    pending.delete(x, y);

    const [dir1, d1] = O.randElem(avail);

    d[0] |= 1 << dir1;
    d1[0] |= 1 << (dir1 + 2 & 3);

    addAdj(x, y);
  }

  game.iterate((x, y, d) => {  
    const n = O.rand(4);
    d[0] = ((d[0] << n) | (d[0] >> 4 - n)) & 15;
  });
};

game.mouse.lmb = (x, y, d) => {
  if(d[1]) return;
  d[0] = ((d[0] | (d[0] << 4)) >> 1) & 15;
};

game.mouse.rmb = (x, y, d) => {
  if(d[1] > 1) return;

  if(d[1] === 1){
    d[1] = 0;
    d[3] = 0;
    return;
  }

  d[1] = 1;

  adj(x, y, (x, y, d1, dir) => {
    if(!d1[1]) return;

    const a = (
      !(d[0] & (1 << dir)) ^
      !(d1[0] & (1 << (dir + 2 & 3)))
    );

    if(a) d[3] = 1;
  });
};

game.kb.KeyR = () => {
  game.iterate((x, y, d) => d[1] = 0);
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
  const skip = d === null || d[2];

  game.iterate((x, y, d) => d[2] = 0);
  if(skip) return;

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