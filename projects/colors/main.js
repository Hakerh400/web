'use strict';

const assert = require('assert');
const colors = require('.');

const {g} = O.ceCanvas();

let iw, ih, iwh, ihh;

let n = 1;

const main = () => {
  aels();
  onResize();
};

const aels = () => {
  O.ael('keydown', onKeyDown);
  O.ael('resize', onResize);
};

const onKeyDown = evt => {
  const {ctrlKey, shiftKey, altKey, code} = evt;
  const flags = (ctrlKey << 2) | (shiftKey << 1) | altKey;

  if(flags === 0){
    if(code === 'ArrowLeft'){
      if(n === 1) return;
      n--;
      render();
      return;
    }

    if(code === 'ArrowRight'){
      n++;
      render();
      return;
    }

    return;
  }
};

const onResize = () => {
  const {canvas} = g;

  iw = O.iw;
  ih = O.ih;
  iwh = iw / 2;
  ihh = ih / 2;

  canvas.width = iw;
  canvas.height = ih;

  render();
};

const render = () => {
  const cols = colors.get(n);
  const dx = iw / n;

  for(let i = 0; i !== n; i++){
    g.fillStyle = cols[i];
    g.fillRect(dx * i, 0, dx, ih);
  }
};

main();