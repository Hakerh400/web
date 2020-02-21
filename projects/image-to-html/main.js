'use strict';

const WIDTH = 100;
const HEIGHT = 50;
const BG_COL = '#f8f9fa';

const main = async () => {
  const g = await loadImg('/projects/test/img.png');
  const {canvas} = g;
  const {width: w, height: h} = canvas;

  const imgd = new O.ImageData(g);
  const grid = new O.Grid(WIDTH, HEIGHT, () => [0, 0, 0]);

  const dx = w / WIDTH;
  const dy = h / HEIGHT;
  const factor = dx * dy;

  imgd.iter((x, y, r, g, b) => {
    const xx = x / dx | 0;
    const yy = y / dy | 0;
    const d = grid.get(xx, yy);

    d[0] += r;
    d[1] += g;
    d[2] += b;
  });

  const pre = O.ce(O.body, 'pre');
  pre.style.fontSize = '14px';

  let html = '';

  grid.iter((x, y, d) => {
    if(x === 0 && y !== 0){
      O.ceBr(pre);
      html += '\n ';
    }

    const r = d[0] = d[0] / factor + .5 | 0;
    const g = d[1] = d[1] / factor + .5 | 0;
    const b = d[2] = d[2] / factor + .5 | 0;
    const col = new O.Color(r, g, b);

    const span = O.ce(pre, 'span');
    span.style.background = col;
    span.innerText = ' ';

    html += `<span style=background:${col}> </span>`;
  });

  log(html);
};

const loadImg = pth => new Promise((res, rej) => {
  const img = new Image();

  img.onload = () => {
    const canvas = O.doc.createElement('canvas');
    const {width: w, height: h} = img;

    canvas.width = w;
    canvas.height = h;

    const g = canvas.getContext('2d');

    g.fillStyle = BG_COL;
    g.fillRect(0, 0, w, h);
    g.drawImage(img, 0, 0);

    res(g);
  };

  img.onerror = rej;
  img.src = pth;
});

const error = err => {
  O.error(err);
};

main().catch(error);