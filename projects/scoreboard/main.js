'use strict';

const assert = require('assert');
const Scoreboard = require('.');

const main = () => {
  const sb = new Scoreboard();

  const {body} = O;
  const pointsElem = O.ce(body, 'input');
  pointsElem.type = 'text';
  pointsElem.style.width = '500px';
  pointsElem.value = '1';

  O.ceBr(body, 2);
  const btn = O.ce(body, 'button');
  btn.innerText = 'Submit';

  O.ael(btn, 'click', evt => {
    const points = pointsElem.value | 0;
    sb.open(points);
  });
};

main();