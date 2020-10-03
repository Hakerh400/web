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

  const imgs = O.shuffle(O.ca(5, i => {
    const label = String(i + 1);

    const w = 300;
    const h = 300;

    const canvas = O.doc.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    const g = canvas.getContext('2d');

    g.fillStyle = 'white';
    g.fillRect(0, 0, w, h);

    g.textBaseline = 'middle';
    g.textAlign = 'center';
    g.font = '100px arial';

    g.fillStyle = 'black';
    g.fillText(label, w / 2, h / 2);

    return new Image(sorter, g.canvas, label);
  }));

  for(const img of imgs)
    sorter.insert(img);

  const sorted = await sorter.getArr();

  g.clearRect(0, 0, O.iw, O.ih);
  log(sorted.map(a => a.label).join(' '));
};

main();