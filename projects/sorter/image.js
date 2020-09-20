'use strict';

const Sortable = require('./sortable');

class Image extends Sortable{
  constructor(sorter, val){
    super(sorter);

    this.val = val;
  }

  async cmp(other){
    // log('---> CMP ' + (await this.toString()) + ' ' + (await other.toString()));
    return this.val - other.val || 1;
  }

  toStr(){
    return String(this.val);
  }
}

module.exports = Image;