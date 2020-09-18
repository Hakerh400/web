'use strict';

class Sortable extends O.AsyncComparable{
  constructor(sorter){
    super();
    this.sorter = sorter;
  }
}

module.exports = Sortable;