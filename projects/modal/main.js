'use strict';

const assert = require('assert');
const modal = require('.');

const main = () => {
  let open = 0;

  modal.div.innerText = 'abc';

  O.ael('mousedown', () => {
    if(open ^= 1) modal.open();
    else modal.close();
  });
};

main();