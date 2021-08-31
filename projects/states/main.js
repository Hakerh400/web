'use strict';

const assert = require('assert');

const cols = {
  bg: 'darkgray',
};

const {g} = O.ceCanvas(1);

let iw, ih;
let iwh, ihh;

const main = () => {
  aels();
  onResize();
};

const aels = () => {
  O.ael('resize', onResize);
};

const onResize = evt => {
  iw = O.iw;
  ih = O.ih;
  iwh = iw / 2;
  ihh = ih / 2;

  g.resize(iw, ih);

  render();
};

const render = () => {
  g.clearCanvas(cols.bg);
};

main();