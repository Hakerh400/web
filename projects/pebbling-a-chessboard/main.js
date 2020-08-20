'use strict';

const Grid = require('./grid');

const {min, max, floor, ceil} = Math;

const SIZE = 20;

const {g} = O.ceCanvas(1);

const cols = {
  bg: '#ffffff',
  peb: '#808080',
  mark: '#ff0000',
};

const grid = new Grid();

const main = () => {
  grid.set(0, 0, 1);
  grid.set(1, 0, 1);
  grid.set(0, 1, 1);

  render();
  aels();
};

const aels = () => {
  O.ael('mousedown', evt => {
    const x = floor(evt.clientX / SIZE);
    const y = floor(evt.clientY / SIZE);

    if(!grid.get(x, y)) return;
    if(grid.get(x + 1, y) || grid.get(x, y + 1)) return;

    grid.set(x, y, 0);
    grid.set(x + 1, y, 1);
    grid.set(x, y + 1, 1);

    render();
  });

  O.ael('resize', evt => {
    g.resize(O.iw, O.ih);
    render();
  });
};

const render = () => {
  const {iw, ih} = O;

  g.resetTransform();
  g.fillStyle = cols.bg;
  g.fillRect(0, 0, iw, ih);

  const w = ceil(iw / SIZE);
  const h = ceil(ih / SIZE);

  g.scale(SIZE);
  g.fillStyle = cols.peb;

  for(let y = 0; y !== h; y++){
    for(let x = 0; x !== w; x++){
      if(!grid.get(x, y)) continue;
      g.fillRect(x, y, 1, 1);
    }
  }

  g.beginPath();
  for(let x = 0; x !== w; x++){
    g.moveTo(x, 0);
    g.lineTo(x, h);
  }
  for(let y = 0; y !== h; y++){
    g.moveTo(0, y);
    g.lineTo(w, y);
  }
  g.stroke();

  g.globalAlpha = .2;
  g.fillStyle = cols.mark;
  g.fillRect(0, 0, 2, 1);
  g.fillRect(0, 1, 1, 1);
  g.globalAlpha = 1;
};

main();