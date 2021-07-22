'use strict';

const Element = require('../element');
const ButtonOk = require('./btn-ok');

class Modal extends Element.Region{
  constructor(parent){
    super(parent.purge());
  }

  css(){ return 'modal'; }
}

Modal.ButtonOk = ButtonOk;

module.exports = Modal;