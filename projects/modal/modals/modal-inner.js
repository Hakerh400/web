'use strict';

const Element = require('../element');

class ModalInner extends Element.Div{
  css(){ return 'modal-inner'; }
}

module.exports = ModalInner;