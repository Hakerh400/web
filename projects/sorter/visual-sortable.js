'use strict';

const Sortable = require('./sortable');

class VisualSortable extends Sortable{
  constructor(sorter){
    super(sorter);

    this.g = sorter.g;
  }
}

module.exports = VisualSortable;