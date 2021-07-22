'use strict';

const Element = require('../element');
const Form = require('../form');

class ButtonOK extends Form.ButtonConfirm{
  constructor(parent, label=null){
    if(label === null)
      label = LS.labels.forms.buttons.ok;

    super(parent, label);
  }

  css(){ return 'btn-ok'; }
}

module.exports = ButtonOK;