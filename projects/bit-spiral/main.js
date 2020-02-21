'use strict';

const {g, w, h, whn: wh, hhn: hh} = O.ceCanvas();

const dirs = [
  [0, -1], [1, -1], [1, 0], [1, 1],
  [0, 1], [-1, 1], [-1, 0], [-1, -1],
];

const main = () => {
  const imgd = new O.ImageData(g);

  const c0 = new O.Color(50, 50, 50);
  const c1 = new O.Color(255, 100, 0);

  const gen = bitGen();
  const grid = new O.Map2D();

  let remaining = w * h;
  let [x, y] = [wh, hh];
  let dir = 0;

  while(remaining !== 0){
    const bit = gen.next().value;
    grid.set(x, y, bit);
    
    if(x >= 0 && y >= 0 && x < w && y < h){
      imgd.set(x, y, bit ? c1 : c0);
      remaining--;
    }

    while(1){
      const [dx, dy] = dirs[dir];
      const x1 = x + dx;
      const y1 = y + dy;

      if(!grid.has(x1, y1)){
        x = x1;
        y = y1;
        break;
      }

      dir = dir - 1 & 7;
    }

    dir = dir + 3 & 7;
  }

  imgd.put();
};

const bitGen = function*(){
  let size = 1;
  let limit = 2;
  let num = 0;

  while(1){
    let n = num;

    for(let i = 0; i !== size; i++){
      yield n & 1;
      n >>= 1;
    }

    if(++num === limit){
      size++;
      limit <<= 1;
      num = 0;
    }
  }
};

main();