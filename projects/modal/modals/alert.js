'use strict';

const Element = require('../element');
const Modal = require('./modal');
const ButtonOk = require('./btn-ok');

class Alert extends Modal{
  constructor(parent, msg){
    super(parent);

    this.left = new Element.Left(this);
    this.right = new Element.Right(this);

    this.msg = new Element.Span(this.left, msg);
    this.btn = new ButtonOk(this.right);
    this.btn.on('click', () => O.glob.dom.closeModal());
  }

  css(){ return 'alert'; }
}

module.exports = Alert;