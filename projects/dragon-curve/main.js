'use strict';

const LINES_NUM = 1e5;

const {w, h, g, g: {canvas}} = O.ceCanvas();
const [wh, hh] = [w, h].map(a => a >> 1);

const {abs, sin, cos} = Math;

setTimeout(main);

function main(){
  g.clearRect(0, 0, w, h);

  let str = '0';

  while(str.length < LINES_NUM){
    let a = 1;
    str = str.replace(/(?:)/g, () => a ^= 1);
  }

  const buf = new Uint8Array(str.split(''));
  const s = 512;
  const sh = s / 2;

  draw(buf, wh, hh);

  g.globalCompositeOperation = 'destination-over';
  g.drawImage(canvas, 0, -s);
  g.drawImage(canvas, 0, -s * 2);
  g.drawImage(canvas, 0, s);
  g.drawImage(canvas, -s, 0);
  g.drawImage(canvas, -s * 2, 0);
  g.drawImage(canvas, s * 2, 0);
  g.drawImage(canvas, sh, sh);
  g.drawImage(canvas, -sh, -sh);
  g.drawImage(canvas, -s, 0);
  g.drawImage(canvas, s, 0);

  const imgd1 = g.getImageData(0, 0, w, h);
  const imgd2 = g.getImageData(0, 0, w, h);
  const d1 = imgd1.data;
  const d2 = imgd2.data;

  const dataSize = d1.length;
  let cx = wh;
  let cy = hh;

  O.ael('mousemove', evt => {
    cx = evt.clientX;
    cy = evt.clientY;
  });

  const render = () => {
    for(let i = 0, yy = 0; yy !== h; yy++){
      for(let xx = 0; xx !== w; xx++, i += 4){
        const dx = xx - cx;
        const dy = yy - cy;
        const ds = dx * dx + dy * dy;

        const angle = -1e4 / ds;
        const s = sin(angle);
        const c = cos(angle);

        const x = cx + dx * c - dy * s | 0;
        if(x < 0 || x >= w) continue;

        const y = cy + dx * s + dy * c | 0;
        if(y < 0 || y >= h) continue;

        const j = x + y * w << 2;
        d2[i] = d1[j];
        d2[i + 1] = d1[j + 1];
        d2[i + 2] = d1[j + 2];
      }
    }

    g.putImageData(imgd2, 0, 0);

    O.raf(render);
  };

  O.raf(render);
}

function draw(buf, xStart, yStart){
  const col = new Uint8Array(3);

  for(let i = 0; i !== 4; i++){
    let x = xStart;
    let y = yStart;
    let dir = i * O.pih;

    for(let j = 0; j != LINES_NUM; j++){
      g.beginPath();
      g.strokeStyle = O.Color.from(O.hsv(j / LINES_NUM, col));
      g.moveTo(x, y);
      x += cos(dir);
      y += sin(dir);
      g.lineTo(x, y);
      g.stroke();

      dir += buf[j] ? -O.pih : O.pih;
    }
  }
}