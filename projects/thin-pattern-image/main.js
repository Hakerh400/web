'use strict';

const {tanh} = Math;

const {imgd, w, h} = await new Promise((res, rej) => {
  const img = new Image();

  img.onload = () => {
    const {width: w, height: h} = img;
    const canvas = O.doc.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    const g = canvas.getContext('2d');
    g.drawImage(img, 0, 0);

    const imgd = new O.ImageData(g);

    res({imgd, w, h});
  };

  img.onerror = rej;

  img.src = O.urlTime(`${O.baseURL}/projects/test/1.png`);
});

const s = 1;

const [wh, hh] = [w, h].map(a => a / 2);

const EXPAND_PROB = .8;
const COL_BASE = .1;
const COL_MUL = .1;

const cols = {
  bg: 'darkgray',
  void: 'black',
};

const aux = new Uint8ClampedArray(3);

const {
  g,
  w: iw, h: ih,
  wh: iwh, hh: ihh,
} = O.ceCanvas(1);

const grid = new O.Grid(w, h);

const main = () => {
  initGrid();
  render();
};

const initGrid = () => {
  const coll = new O.Collection();

  grid.iter((x, y) => {
    const d = new Tile(x, y);

    coll.add(d);
    grid.set(x, y, d);
  });

  while(!coll.empty){
    const d = coll.get();
    const {x, y} = d;
    const pending = new O.Collection([d]);

    imgd.get(x, y, aux);
    const shape = new Shape([...aux]);

    while(!pending.empty){
      const d = pending.get();
      if(d.shape !== null) continue;

      const {x, y} = d;
      let adj = 0;

      grid.adj(x, y, (x, y, d) => {
        if(d === null) return;
        if(d.shape === shape) adj++;
      });

      if(adj > 1) continue;

      shape.add(d);
      if(!O.randp(EXPAND_PROB)) break;

      grid.adj(x, y, (x, y, d) => {
        if(d === null) return;
        if(d.shape !== null) return;
        pending.addm(d);
      });
    }
  }
};

class Shape{
  #col = null;
  tiles = new Set();

  constructor(baseCol, tiles=null){
    this.baseCol = baseCol;

    if(tiles !== null)
      this.addAll(tiles);
  }

  get size(){ return this.tiles.size; }

  add(tile){
    this.tiles.add(tile);
    tile.shape = this;
    return this;
  }

  addAll(tiles){
    for(const tile of tiles)
      this.add(tile);

    return this;
  }

  get col(){
    if(this.#col === null){
      const fac = tanh(this.size * COL_MUL + COL_BASE);

      const col = Array.from(this.baseCol, a => {
        return a * fac;
      });

      this.#col = O.Color.from(col);
    }

    return this.#col;
  }
}

class Tile{
  constructor(x, y, shape=null){
    this.x = x;
    this.y = y;
    this.shape = shape;
  }

  get col(){
    return this.shape.col;
  }
}

const render = () => {
  g.resetTransform();
  g.fillStyle = cols.bg;
  g.fillRect(0, 0, iw, ih);

  g.translate(iwh, ihh);
  g.scale(s);
  g.translate(-wh, -hh);

  grid.iter((x, y, d) => {
    g.fillStyle = d.col;
    g.fillRect(x, y, 1, 1);
  });

  g.beginPath();
  g.rect(0, 0, w, h);
  g.stroke();
};

main();