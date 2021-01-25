'use strict';

const w = 9;
const h = 9;
const s = 40;

const cols = {
  bg: 'darkgray',
  void: 'black',
};

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
    const pending = new O.Collection([d]);
    const shape = new Shape();

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
      if(O.randp(.1)) break;

      grid.adj(x, y, (x, y, d) => {
        if(d === null) return;
        if(d.shape !== null) return;
        pending.addm(d);
      });
    }
  }
};

class Shape{
  col = O.Color.rand(1);
  tiles = new Set();

  constructor(tiles=null){
    if(tiles !== null)
      this.addAll(tiles);
  }

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

  get size(){ return this.tiles.size; }
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
  g.translate(-w / 2, -h / 2);

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