'use strict';

const VisualSorter = require('./visual-sorter');
const Image = require('./image');

const {g} = O.ceCanvas();
const {canvas} = g;

const main = async () => {
  const sorter = new VisualSorter(g);

  O.ael('resize', () => {
    canvas.width = O.iw;
    canvas.height = O.ih;
  });

  const render = () => {
    sorter.render();
    O.raf(render);
  };

  render();

  const imgs = await O.caa(10, i => {
    return new Promise((res, rej) => {
      const label = String(i + 1).padStart(3, '0');
      const img = new window.Image();

      img.onload = () => {
        res(new Image(sorter, img, label));
      };

      img.onerror = rej;

      img.src = O.urlTime(O.localPath(`images/${label}.png`));
    });
  });

  for(const img of imgs)
    sorter.insert(img);

  const sorted = await sorter.getArr();

  g.clearRect(0, 0, O.iw, O.ih);
  log(sorted.map(a => a.label).join(' '));
};

main();