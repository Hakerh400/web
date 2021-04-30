'use strict';

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

const grid = new O.Grid(w, h, () => new Tile());

let {iw, ih} = O;

const main = () => {
  grid.iter((x, y, d) => {
    
  });

  O.ael('resize', onResize);
  onResize();

  render();
};

const onResize = evt => {
  ({iw, ih} = O);
  
  g.resize(iw, ih);
  g.font(24);
};

const render = () => {
  g.resetTransform();
  g.fillStyle = cols.bg;
  g.fillRect(0, 0, iw, ih);

  g.translate(iw / 2, ih / 2);
  g.scale(s);
  g.translate(-w / 2, -h / 2);

  grid.iter((x, y, d) => {
    g.fillStyle = 'black';
    g.fillText(d.entsNum, x + .5, y + .5);
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