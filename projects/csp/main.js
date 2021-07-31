'use strict';

const CSP = require('./csp');
const TileBase = require('./tile');

const tileSize = 40;
const fontSize = tileSize * .6;

const w = 5;
const h = 1;

const grid = new O.Grid(w, h);

const {g} = O.ceCanvas(1);

let iw, ih;
let iwh, ihh;

const main = () => {
  const phs = new Map();

  grid.iter((x, y) => {
    const d = new Tile(grid, x, y);
    const vals = new Set(O.ca(5, i => i + 1));

    grid.set(x, y, d);
    phs.set(d, vals);
  });

  aels();
  onResize();
};

class Tile extends TileBase{
  constructor(grid, x, y, n=null){
    super(grid, x, y);
    this.n = n;
  }

  render(g){
    const {n} = this;

    g.fillStyle = 'white';
    g.fillRect(0, 0, 1, 1);

    if(n !== null){
      g.fillStyle = 'black';
      g.fillText(n, .5, .5);
    }
  }
}

const aels = () => {
  O.ael('resize', onResize);
};

const onResize = evt => {
  iw = O.iw;
  ih = O.ih;
  iwh = iw / 2;
  ihh = ih / 2;

  g.resize(iw, ih);
  g.font(fontSize);

  render();
};

const render = () => {
  g.clearCanvas('darkgray');

  g.translate(iwh, ihh);
  g.scale(tileSize);
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

  g.resetTransform();
};

main();