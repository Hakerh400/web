'use strict';

const {tanh} = Math;

const w = 150;
const h = 75;
const s = 10;

const [wh, hh] = [w, h].map(a => a / 2);

const EXPAND_PROB = .8;
const COL_BASE = .1;
const COL_MUL = .1;

const cols = {
  bg: 'darkgray',
  void: 'black',
};

const shapeCols = [
  [0, 255, 0],
  [255, 255, 0],
];

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

    const col = O.dist(x + .5, y + .5, wh, hh) < h / 4 ?
      shapeCols[1] :
      shapeCols[0];
    
    const shape = new Shape(col);

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

  grid.iter((x, y, d) => {
    const d1 = grid.get(x, y - 1);
    const d2 = grid.get(x - 1, y);

    if(d1 === null || d1.shape !== d.shape){
      g.beginPath();
      g.moveTo(x + 1, y);
      g.lineTo(x, y);
      g.stroke();
    }

    if(d2 === null || d2.shape !== d.shape){
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x, y + 1);
      g.stroke();
    }
  });

  g.beginPath();
  g.rect(0, 0, w, h);
  g.stroke();
};

main();