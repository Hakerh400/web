'use strict';

class Trajectory{
  constructor(ps, rad){
    const diam = rad * 2;
    const len = this.len = ps.length;

    const has = i => {
      return i >= 0 && i < len;
    };

    this.ps = ps;

    this.adjs = ps.map(([x, y], i) => {
      const calc = dir => {
        const n = O.bisect(n => {
          const j = dir === 0 ? i - n : i + n;

          if(j === i) return 0;
          if(!has(j)) return 1;

          const [x1, y1] = ps[j];
          return O.dist(x, y, x1, y1) > diam;
        });

        const j = dir === 0 ? i - n : i + n;

        if(!has(j)) return null;
        return j;
      };

      const prev = calc(0);
      const next = calc(1);

      return [prev, next];
    });
  }

  has(i){
    return i >= 0 && i < this.len;
  }
}

module.exports = Trajectory;