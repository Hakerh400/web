'use strict';

const assert = require('assert');
const CSPBase = require('./csp-base');

class CSP extends CSPBase{
  getRels(tile, val){
    const {grid} = this;
    const {x, y} = tile;
    const rels = new Set();

    const check = (x, y) => {
      const tile1 = grid.get(x, y);
      if(tile1 === tile) return 1;

      rels.add(tile1);
      return tile1.val !== val;
    };

    for(let i = 0; i !== 9; i++){
      if(!check(i, y)) return null;
      if(!check(x, i)) return null;
    }

    const x1 = x - x % 3;
    const y1 = y - y % 3;

    for(let i = 0; i !== 3; i++)
      for(let j = 0; j !== 3; j++)
        if(!check(x1 + i, y1 + j))
          return null;

    return rels;
  }
}

module.exports = CSP;