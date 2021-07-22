'use strict';

const assert = require('assert');

class Trajectory{
  constructor(ps, rad){
    const diam = rad * 2;
    const len = this.len = ps.length;

    const has = i => {
      return i >= 0 && i < len;
    };

    this.ps = ps;

    const adjs = [];

    for(let i = 0; i !== len; i++){
      const [x, y] = ps[i];

      const calc = dir => {
        const n = O.bisect(n => {
          const j = dir === 0 ? i - n : i + n;

          if(j === i) return 0;
          if(!has(j)) return 1;

          const [x1, y1] = ps[j];
          return O.dist(x, y, x1, y1) >= diam;
        });

        /*if(i === 6 && dir === 1){
          const f = a => Math.floor(a * 1e3) / 1e3;

          log(i);
          log(i + n);
          log(i+n-1, [x, y, ps[i+n-1][0], ps[i+n-1][1],O.dist(x, y, ps[i+n-1][0], ps[i+n-1][1])].map(f));
          log(i+n, [x, y, ps[i+n][0], ps[i+n][1],O.dist(x, y, ps[i+n][0], ps[i+n][1])].map(f));
          log();

          debugger;
        }
        if(i === 1193 && dir === 0){
          const f = a => Math.floor(a * 1e3) / 1e3;

          log(i);
          log(i - n);
          log(i-n+1, [x, y, ps[i-n+1][0], ps[i-n+1][1],O.dist(x, y, ps[i-n+1][0], ps[i-n+1][1])].map(f));
          log(i-n, [x, y, ps[i-n][0], ps[i-n][1],O.dist(x, y, ps[i-n][0], ps[i-n][1])].map(f));
          log();
          
          debugger;
        }*/

        const j = dir === 0 ? i - n : i + n;

        if(!has(j)) return null;
        return j;
      };

      const prev = calc(0);
      const next = calc(1);

      adjs.push([prev, next]);
    }

    for(let i = 0; i !== len; i++){
      const [prev, next] = adjs[i];

      if(prev !== null)
        adjs[prev][1] = i;

      if(next !== null)
        adjs[next][0] = i;
    }

    /*for(let i = 0; i !== len; i++){
      const [prev, next] = adjs[i];

      if(prev !== null)
        assert(adjs[prev][1] === i);

      if(next !== null)
        assert(adjs[next][0] === i);
    }*/

    this.adjs = adjs;
  }

  has(i){
    return i >= 0 && i < this.len;
  }
}

module.exports = Trajectory;