'use strict';

class Button{
  tr = null;

  constructor(label, w, h, selected){
    this.label = label;
    this.w = w;
    this.h = h;
    this.selected = selected;
  }
}

module.exports = Button;