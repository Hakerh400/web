'use strict';

const {atan2} = Math;
const {pi, pih, pi2} = O;

const RADIUS = 10;
const EXPONENT = 1;

const main = () => {
  const {g, w, h, wh, hh} = O.ceCanvas();
  const imgd = new O.ImageData(g);

  const cs = O.ca(3, () => new Uint8ClampedArray(3));
  const [c1, c2, c3] = cs;

  imgd.iter((x, y) => {
    const dist = O.dist(x, y, wh, hh) / RADIUS;
    const angle = atan2(hh - y, wh - x) + pi2;
    const layer1 = dist | 0;
    const layer2 = layer1 + 1;

    const k = (dist % 1) ** EXPONENT;
    const k1 = 1 - k;

    calcCol(layer1, angle, c1);
    calcCol(layer2, angle, c2);

    c3[0] = c1[0] * k1 + c2[0] * k;
    c3[1] = c1[1] * k1 + c2[1] * k;
    c3[2] = c1[2] * k1 + c2[2] * k;

    return c3;
  });

  imgd.put();
};

const calcCol = (layer, angle, col) => {
  O.hsv((angle + layer ** 1.41) * layer / pi2, col);
};

main();