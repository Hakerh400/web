'use strict';

const Diagram = require('./diagram');

const main = () => {
  const {g: {canvas}} = O.ceCanvas();
  const diag = new Diagram(canvas);

  diag.snapToWindow = 1;
  diag.start();
};

main();