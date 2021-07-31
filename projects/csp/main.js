'use strict';

const CSP = require('./csp');
const Placeholder = require('./placeholder');

const tileSize = 40;
const fontSize = tileSize * .6;

const w = 5;
const h = 1;

const grid = new O.Grid(w, h, () => O.obj());

const {g} = O.ceCanvas(1);

let iw, ih;
let iwh, ihh;

const main = () => {
  grid.iter((x, y, d) => {
    d.n = x + 1;
  });

  aels();
  onResize();
};

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

    g.fillStyle = 'white';
    g.fillRect(0, 0, 1, 1);

    g.fillStyle = 'black';
    g.fillText(d.n, .5, .5);

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