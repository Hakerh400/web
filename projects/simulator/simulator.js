'use strict';

class Simulator{
  iw = null;
  ih = null;

  constructor(){
    const g = this.g = O.ceCanvas();

    this.aels();
    this.resurface();
  }

  aels(){
    O.ael('resize', () => {
      this.resurface();
    });
  }

  resurface(){
    const iw = this.iw = O.iw;
    const ih = this.ih = O.ih;
    const {g} = this;
  }
}

module.exports = Simulator;