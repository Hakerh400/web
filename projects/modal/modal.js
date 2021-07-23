'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const DOM = require('./dom');

const cwd = __dirname;
await O.addStyle(path.join(cwd, 'modal.css'), 0);

const div = O.ce(O.body, 'div', 'top modal-outer fade-in-out');
const dom = new DOM(div);

const open = () => {
  dom.openModal();
};

const close = cb => {
  dom.closeModal(cb);
};

module.exports = {
  div: div.children[0],

  open,
  close,
};