'use strict';

game.defaultW = 4;
game.defaultH = 4;

let px = 0;
let py = 0;

game.draw = (x, y, d, g) => {
  const {w, h} = game;

  const target = y * w + x + 1;
  const val = d[0];

  g.fillStyle = val ?
    val === target ? '#00ff00' : '#eee4da' :
    '#ccc0b3';

  g.fillRect(x, y, 1, 1);

  if(val){
    g.fillStyle = '#000000';
    game.g.scaleFont(.75);
    g.fillText(val, x + .5, y + .5);
  }
};

game.export = (x, y, d, bs) => {
  bs.write(d[0], 1e3);
};

game.import = (x, y, d, bs) => {
  d[0] = bs.read(1e3);

  if(d[0] === 0){
    px = x;
    py = y;
  }
};

game.generate = () => {
  const {w, h} = game;
  game.iterate((x, y, d) => d[0] = y * w + x + 1);

  px = w - 1;
  py = h - 1;
  
  for(let i = O.rand(1e3, 2e3); i !== -1; i--)
    move(O.rand(4));
};

game.kb.dir = (dir, dx, dy) => {
  move(dir);
};

const move = dir => {
  const {w, h} = game;

  if(dir === 0){
    if(py === 0) return;
    const d = game.get(px, py--);
    const d1 = game.get(px, py);
    d[0] = d1[0];
    d1[0] = 0;
    return;
  }

  if(dir === 1){
    if(px === 0) return;
    const d = game.get(px--, py);
    const d1 = game.get(px, py);
    d[0] = d1[0];
    d1[0] = 0;
    return;
  }

  if(dir === 2){
    if(py === h - 1) return;
    const d = game.get(px, py++);
    const d1 = game.get(px, py);
    d[0] = d1[0];
    d1[0] = 0;
    return;
  }

  if(dir === 3){
    if(px === w - 1) return;
    const d = game.get(px++, py);
    const d1 = game.get(px, py);
    d[0] = d1[0];
    d1[0] = 0;
    return;
  }
};