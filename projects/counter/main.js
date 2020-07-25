'use strict';

const {g, w, h, wh, hh} = O.ceCanvas();

let count = 0;

const main = () => {
  g.font = '300px arial';
  g.textBaseline = 'middle';
  g.textAlign = 'center';
  g.fillStyle = '#000';

  O.ael('keydown', evt => {
    if(evt.code !== 'Space') return;
    count++;
  });

  O.raf(render);
};

const render = () => {
  g.clearRect(0, 0, w, h);
  g.fillText(count, wh, hh);
  
  O.raf(render);
};

main();