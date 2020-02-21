'use strict';

const DraggableCanvas = require('.');

const {min, max, abs, floor} = Math;

const main = () => {
  O.body.classList.add('has-canvas');

  const dc = new DraggableCanvas(O.body);
  const {g} = dc;

  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = '16px arial';

  dc.setResizable(1);
  dc.show();

  dc.renderFunc = (x1, y1, x2, y2) => {
    x1 = floor(x1 / 40) * 40;
    y1 = floor(y1 / 40) * 40;

    for(let y = y1 - 40; y < y2 + 40; y += 40){
      for(let x = x1 - 40; x < x2 + 40; x += 40){
        g.fillStyle = floor((x + y) / 40) & 1 ? '#ddd' : '#eee';
        g.fillRect(x - 15, y - 15, 30, 30);

        g.fillStyle = 'black';
        g.fillText(max(abs(x), abs(y)) / 40, floor(x / 40) * 40, floor(y / 40) * 40);
      }
    }
  };
};

main();