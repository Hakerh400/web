'use strict';

const Tree = require('./tree');

const {min, max, floor, ceil, atan2} = Math;
const {pi, pih, pi2} = O;

const DEPTH_MAX = 50;

const main = async () => {
  const img = await new Promise((res, rej) => {
    const img = new Image();

    img.onload = () => {
      const canvas = O.doc.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const g = canvas.getContext('2d');
      g.drawImage(img, 0, 0);
      const imgd = new O.ImageData(g);
      res(imgd);
    };

    img.onerror = rej;
    img.src = O.urlTime('/projects/test/1.png');
  });

  const {g, w, h, wh, hh} = O.ceCanvas();
  const imgd = new O.ImageData(g);

  const radius = O.hypot(wh, hh) + 5;
  const tree = new Tree();

  const black = new Uint8ClampedArray([0, 0, 0]);
  const col = new Uint8ClampedArray(3);

  const grid = new O.Grid(w, h, () => null);
  const map = new Map();

  for(let stage = 0; stage !== 2; stage++){
    imgd.iter((x, y) => {
      const dist = O.dist(x, y, wh, hh);
      if(dist > radius) return black;

      const angle = atan2(hh - y, wh - x) + pi;
      const depth = O.bound(floor(radius / (radius - dist) ** .7) - 8, 0, DEPTH_MAX);
      const id = angle / pi2;

      const c = tree.get(id, depth);
      if(!map.has(c)) map.set(c, [0, 0, 0, 0]);

      const info = map.get(c);

      if(stage === 0){
        img.get(x, y, col);
        info[0] += col[0];
        info[1] += col[1];
        info[2] += col[2];
        info[3]++;
        return;
      }

      const n = info[3];
      if(n !== 1){
        info[0] = info[0] / n + .5 | 0;
        info[1] = info[1] / n + .5 | 0;
        info[2] = info[2] / n + .5 | 0;
        info[3] = 1;
      }

      return info;
    });
  }

  imgd.put();
};

main();