'use strict';

const World = require('./world');
const Tile = require('./tile');
const Entity = require('./entity');
const Trait = require('./trait');

const w = 9;
const h = 9;
const s = 40;

const cols = {
  bg: [169, 169, 169],
};

for(const key of O.keys(cols))
  cols[key] = O.Color.from(cols[key]).toString();

const {g} = O.ceCanvas(1);

const world = new World(w, h);
const {grid} = world;

let iw, ih;

const main = () => {
  grid.iter((x, y, d) => {
    if(x === 0 && y === 0)
      new Entity.Player(d);
  });

  O.ael('resize', onResize);
  O.ael('keydown', onKeydown);

  onResize();
  render();
};

const onResize = evt => {
  ({iw, ih} = O);

  g.resize(iw, ih);
  g.font(24);
};

const onKeydown = evt => {
  world.emit('keydown', evt);
};

const render = () => {
  world.tick();

  g.resetTransform();
  g.fillStyle = cols.bg;
  g.fillRect(0, 0, iw, ih);

  g.translate(iw / 2, ih / 2);
  g.scale(s);
  g.translate(-w / 2, -h / 2);

  grid.iter((x, y, d) => {
    g.save();
    g.translate(x, y);
    d.render(g);
    g.restore();
  });

  g.beginPath();
  for(let i = 0; i <= w; i++){
    g.moveTo(i, 0);
    g.lineTo(i, h);
  }
  for(let i = 0; i <= h; i++){
    g.moveTo(0, i);
    g.lineTo(w, i);
  }
  g.stroke();

  O.raf(render);
};

main();