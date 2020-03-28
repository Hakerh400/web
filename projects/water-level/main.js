'use strict';

const {min, max, abs, round} = Math;

const UPDATE_RADIUS = 3;

const cols = {
  bg: '#fff',
  fluid: '#08f',
};

const {g, w, h, wh, hh, w1, h1} = O.ceCanvas(1);

const verts = O.ca(2, () => O.ca(w, () => hh));
let vertsIndex = 0;

let clicked = 0;
let cx, cy;

const main = () => {
  aels();
  render();
};

const aels = () => {
  O.ael('mousedown', evt => {
    if(evt.button !== 0) return;
    updateCoords(evt);
  });

  O.ael('mouseup', evt => {
    if(evt.button !== 0) return;
    clicked = 0;
  });

  O.ael('mousemove', evt => {
    if(evt.button !== 0) return;
    if(clicked) updateCoords(evt);
  });
};

const render = () => {
  if(clicked) updateVerts(cx, cy, cx, cy);

  g.fillStyle = cols.bg;
  g.fillRect(0, 0, w, h);

  const rad = UPDATE_RADIUS;
  const diam = rad * 2 + 1;
  const xx = w + rad;

  g.fillStyle = cols.fluid;

  for(let i = 0; i !== 10; i++){
    const vs1 = verts[vertsIndex ^ (i & 1)];
    const vs2 = verts[vertsIndex ^ (~i & 1)];

    let sum = 0;
    let num = 0;

    for(let x = 0; x !== xx; x++){
      if(x >= diam){
        sum -= vs1[x - diam];
        num--;
      }

      if(x <= w1){
        const y = vs1[x];
        if(i !== 0) g.fillRect(x, h1 - y, 1, y);
        sum += y;
        num++;
      }

      if(x >= rad){
        vs2[x - rad] = sum / num;
      }
    }
  }

  vertsIndex ^= 1;

  O.raf(render);
};

const updateCoords = evt => {
  const xx = evt.clientX;
  const yy = h1 - evt.clientY;

  if(!clicked){
    clicked = 1;
    updateVerts(xx, yy, xx, yy);
  }else{
    let x1 = cx;
    let y1 = cy;
    let x2 = xx;
    let y2 = yy;

    if(x1 > x2){
      let t;
      t = x1; x1 = x2; x2 = t;
      t = y1; y1 = y2; y2 = t;
    }

    updateVerts(x1, y1, x2, y2);
  }

  cx = xx;
  cy = yy;
};

const updateVerts = (x1, y1, x2, y2) => {
  if(x1 < 0) x1 = 0;
  else if(x1 > w1) x1 = w1;
  if(x2 < 0) x2 = 0;
  else if(x2 > w1) x2 = w1;

  const vs = verts[vertsIndex];
  const dx = x2 - x1 + 1;

  for(let i = 0; i !== dx; i++){
    const k = i / dx;
    const k1 = 1 - k;

    vs[x1 + i] = y1 * k1 + y2 * k;
  }
};

main();