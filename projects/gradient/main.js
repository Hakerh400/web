'use strict';

const FACTOR = 1 / 256;

const {g, w, h, w1, h1, wh, hh} = O.ceCanvas();

const main = () => {
  const d = new O.ImageData(g);
  const c = O.Buffer.alloc(3);
  
  const m = new O.Grid(w, h, (x, y) => {
    if(x !== 0) return null;

    const k = y / h;
    d.set(x, y, O.hsv(k, c));

    return k;
  });

  for(let x = 1; x !== w; x++){
    for(let y = 0; y !== h; y++){
      let s = m.get(x - 1, y);
      let n = 1;

      if(y !== 0){
        s += m.get(x - 1, y - 1);
        n++;
      }

      if(y !== h1){
        s += m.get(x - 1, y + 1);
        n++;
      }

      const k = O.bound(s / n + O.randDiam(FACTOR), 0, 1);

      m.set(x, y, k);
      d.set(x, y, O.hsv(k, c));
    }
  }

  d.put();
};

main();