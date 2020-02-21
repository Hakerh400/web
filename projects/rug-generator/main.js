'use strict';

const {min, max, ceil} = Math;

main();

function main(){
  if(O.isBrowser & 0){
    const refresh = () => {
      const url = location.href;

      location.href = url.replace(/\bseed=(?:[^\&]|$)*|$/, a => {
        const seed = O.rand(2 ** 30);
        const c = a.length === 0 ? url.includes('?') ? '&' : '?' : '';

        return `${c}seed=${seed}`;
      });
    };

    const seed = O.urlParam('seed');
    if(seed === null) return refresh();

    O.enhanceRNG();
    O.randSeed(seed);

    O.ael('keydown', evt => {
      switch(evt.code){
        case 'F5':
          O.pd(evt);
          refresh();
          break;
      }
    });
  }

  const {g, w, h, wh, hh, w1, h1} = O.ceCanvas();
  genRug(g, 1);
}

function genRug(g, rec=0){
  const {canvas} = g;
  const w = canvas.width;
  const h = canvas.height;
  const rect = {x: 0, y: 0, w, h};

  const size = max(w, h);
  const sizeMin = max(size / 1920 * 50 + .5 | 0, 2);
  const sizeMax = max(size / 1920 * 300 + .5 | 0, 2);

  g.globalCompositeOperation = 'destination-over';
  g.clearRect(0, 0, w, h);

  while(1){
    const {x, y, w, h} = rect;
    const wh = ceil(w / 2);
    const hh = ceil(h / 2);
    if(x > w * 2 && y > h * 2 || w <= 0 || h <= 0) break;

    const sx = min(O.rand(sizeMin, sizeMax), wh);
    const sy = min(O.rand(sizeMin, sizeMax), hh);
    const sxh = sx >> 1;
    const syh = sy >> 1;
    const sx1 = sx - 1;
    const sy1 = sy - 1;

    const canvas = O.ce('canvas');
    canvas.width = sx;
    canvas.height = sy;

    genTile: {
      const g1 = canvas.getContext('2d');

      if(sx <= 3 || sy <= 3){
        g1.fillStyle = O.Color.rand();
        g1.fillRect(0, 0, sx, sy);
        break genTile;
      }

      if(rec) genRug(g1, rec - 1);

      const imgd = g1.getImageData(0, 0, sx, sy);
      const d = imgd.data;

      const xx = O.rand(256);
      const yy = O.rand(256);

      for(let y = 0; y !== sy; y++){
        const i = x + y * sx << 2;
        const xEnd = y <= syh ? y * sx / sy : -1;

        for(let x = 0; x !== sx; x++){
          d[i + 3] = 255;
          if(x > xEnd) continue;

          d[i + 0] = (xx + x) & 255;
          d[i + 1] = (yy + y) & 255;
          d[i + 2] = (xx + yy ^ x + y) & 255;
        }
      }

      g1.putImageData(imgd, 0, 0);

      g1.globalCompositeOperation = 'destination-over';
      g1.scale(1, -1);
      g1.drawImage(canvas, 0, 0, sxh, syh, 0, -syh - 1, sxh, -syh - 1);
      g1.rotate(-O.pih);
      g1.drawImage(canvas, 0, 0, sx, sy, 0, 0, sy, sx);
      g1.scale(-1, -1);
      g1.drawImage(canvas, 0, 0, sx, sy, -sy, -sx, sy, sx);

      g1.resetTransform();
      g1.rotate(.05);
      g1.drawImage(canvas, -2, -2);

      g1.resetTransform();
      g1.translate(sx + 2, sy + 2);
      g1.rotate(.05);
      g1.drawImage(canvas, 0, 0, sx, sy, 0, 0, -sx, -sy);
    }

    const nx = max(w / sx | 0, 2);
    const ny = max(h / sy | 0, 2);
    const scaleX = w / (sx * nx);
    const scaleY = h / (sy * ny);

    g.translate(x, y);
    g.scale(scaleX, scaleY);

    for(let y = 0; y !== ny; y++){
      const yy = y * sy;

      if(y === 0 || y === ny - 1){
        for(let x = 0; x !== nx; x++)
          g.drawImage(canvas, x * sx, yy);

        continue;
      }

      g.drawImage(canvas, 0, yy);
      g.drawImage(canvas, (nx - 1) * sx, yy);
    }

    g.resetTransform();

    const ssx = sx * scaleX;
    const ssy = sy * scaleY;

    rect.x += ssx;
    rect.y += ssy;
    rect.w -= ssx << 1;
    rect.h -= ssy << 1;
  }

  g.fillStyle = '#000';
  g.fillRect(0, 0, w, h);
}