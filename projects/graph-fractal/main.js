'use strict';

const cols = [
  0b100,
  0b010,
  0b001,
  0b110,
];

const main = () => {
  const {g, w, h} = O.ceCanvas();
  const imgd = new O.ImageData(g);

  const col = new Uint8ClampedArray(3);

  imgd.iter((x, y) => {
    let red = 0;
    let green = 0;
    let blue = 0;

    let x1 = 0;
    let y1 = 0;
    let x2 = w;
    let y2 = h;

    for(let mask = 256; mask !== 0; mask >>= 1){
      const xm = (x1 + x2) / 2;
      const ym = (y1 + y2) / 2;
      const xb = x > xm;
      const yb = y > ym;

      const index = (yb << 1) | xb;
      const c = cols[index];

      if(c & 4) red |= mask;
      if(c & 2) green |= mask;
      if(c & 1) blue |= mask;

      if(xb) x1 = xm;
      else x2 = xm;
      if(yb) y1 = ym;
      else y2 = ym;
    }

    col[0] = red - 1;
    col[1] = green - 1;
    col[2] = blue - 1;

    return col;
  });

  imgd.put();
};

main();