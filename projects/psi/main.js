'use strict';

const h1 = O.ce(O.body, 'h1');
h1.innerText = 'Loading...';

const RenderEngine = require('./render-engine');

const main = async () => {
  await O.addStyle('style.css');

  const div = O.ceDiv(O.body, 'canvas-container');
  div.style.opacity = '0';

  const reng = new RenderEngine(div, O.iw, O.ih);

  await reng.init();
  await reng.play();

  h1.remove();
  div.style.opacity = '1';
};

main();