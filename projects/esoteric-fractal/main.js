'use strict';

const {sin, cos, log2, floor, ceil} = Math;

const {g, w, h, wh, hh} = O.ceCanvas();

let k = null;

const main = () => {
  render();
};

const cols = O.obj();

const func = arg => {
  if(arg === null)
    arg = [null, 0]

  const [dir, k] = arg;

  if(arg !== null && !(k in cols))
    cols[k] = O.Color.from(O.hsv(k)).toString();

  g.fillStyle = cols[k];
  g.beginPath();
  g.arc(0, 0, .5, 0, O.pi2);
  g.fill();
  g.stroke();

  const kNew = (k + .05) % 1;

  const args = O.ca(4, i => {
    return [i, kNew];
  });

  if(dir !== null)
    args[dir + 2 & 3] = null;

  return args;
};

const render = () => {
  k = (sin(O.now / 5e3) + 1) / 2;

  g.fillStyle = '#fff';
  g.fillRect(0, 0, w, h);

  const draw = (x, y, w, h, depth=0, arg=null) => {
    const wh = w / 2;
    const hh = h / 2;

    g.translate(x + wh, y + hh);
    g.scale(wh, hh);
    g.lineWidth = 1 / wh;

    const args = func(arg);

    g.resetTransform();

    if(w < 1 || h < 1) return;

    const depthNew = depth + 1;
    if(args[0] !== null) draw(x, y, wh, hh, depthNew, args[0]);
    if(args[1] !== null) draw(x + wh, y, wh, hh, depthNew, args[1]);
    if(args[2] !== null) draw(x + wh, y + hh, wh, hh, depthNew, args[2]);
    if(args[3] !== null) draw(x, y + hh, wh, hh, depthNew, args[3]);
  };

  draw((w - h) / 2, 0, h, h);

  // O.raf(render);
};

main();