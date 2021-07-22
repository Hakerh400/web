'use strict';

const Element = require('../element');

class ButtonConfirm extends Element.Button{
  constructor(parent, label=null){
    if(label === null)
      label = LS.labels.forms.buttons.confirm;

    super(parent, label);
  }

  css(){ return 'btn-confirm'; }
}

module.exports = ButtonConfirm;