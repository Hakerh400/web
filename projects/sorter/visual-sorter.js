'use strict';

const Sorter = require('./sorter');

class VisualSorter extends Sorter{
  renderFunc = null;

  constructor(g){
    super();

    this.g = g;
  }

  render(){
    const {renderFunc} = this;
    if(renderFunc === null) return;

    renderFunc();
  }
}

module.exports = VisualSorter;