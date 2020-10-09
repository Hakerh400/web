'use strict';

const O = require('../omikron');
const Tile = require('./tile');
const DiscreteRay = require('./discrete-ray');
const Vector = require('./vector');

class Grid extends O.EventEmitter{
  #d = Grid.obj();

  #updatedTiles = new Set();
  #updatedAdjTiles = new Set();

  updateSym = Symbol();

  constructor(reng){
    super();

    this.reng = reng;
  }

  static obj(){
    const obj = O.obj();
    obj.len = 0;
    return obj;
  }

  tick(){
    this.emit('tick');

    this.updateSym = Symbol();

    const updatedPrev = this.#updatedTiles;
    const updatedAdjPrev = this.#updatedAdjTiles;

    this.#updatedTiles = new Set();
    this.#updatedAdjTiles = new Set();

    for(const tile of updatedPrev)
      tile.emit('update', 1);

    for(const tile of updatedAdjPrev)
      if(!updatedPrev.has(tile))
        tile.emit('update', 0);
  }

  update(x, y, z){
    const d = this.get(x, y, z);
    if(this.#updatedTiles.has(d)) return;

    this.#updatedTiles.add(d);
    this.adj(x, y, z, d => { this.#updatedAdjTiles.add(d); });
  }

  has(x, y, z){
    const d = this.#d;
    return y in d && z in d[y] && x in d[y][z];
  }

  gen(x, y, z){
    const d = this.#d;

    const tile = new Tile(this, x, y, z);
    this.set(x, y, z, tile);
    this.emit('gen', tile, x, y, z);

    return tile;
  }

  get(x, y, z){
    const d = this.#d;
    if(!this.has(x, y, z)) return this.gen(x, y, z);
    return d[y][z][x];
  }

  set(x, y, z, tile){
    const d = this.#d;
    if(!(y in d)) d[y] = Grid.obj(), d.len++;
    if(!(z in d[y])) d[y][z] = Grid.obj(), d[y].len++;
    if(!(x in d[y][z])) d[y][z].len++;
    d[y][z][x] = tile;
  }

  getf(x, y, z){
    return this.get(Math.floor(x), Math.floor(y), Math.floor(z));
  }

  adj(x, y, z, f){
    return f(this.get(x, y - 1, z), x, y - 1, z) ||
      f(this.get(x, y, z - 1), x, y, z - 1) ||
      f(this.get(x - 1, y, z), x - 1, y, z) ||
      f(this.get(x + 1, y, z), x + 1, y, z) ||
      f(this.get(x, y, z + 1), x, y, z + 1) ||
      f(this.get(x, y + 1, z), x, y + 1, z);
  }

  adjc(x, y, z, f){
    for(const yy = y - 1; yy !== y + 1; yy++)
      for(const zz = z - 1; zz !== z + 1; zz++)
        for(const xx = x - 1; xx !== x + 1; xx++)
          if(xx !== x && yy !== y && zz !== z && f(xx, yy, zz, this.get(xx, yy, zz)))
            return 1;
    return 0;
  }

  trace(ray, maxDist=null, findOpaque=1, findAny=1){
    let dPrev = this.getv(ray);
    let i = 0;

    while(1){
      const d = this.getv(ray.move());

      if(findAny ? d.nempty : findOpaque && d.has.opaque){
        ray.nav(ray.dir);
        return d;
      }

      if(maxDist !== null && ++i === maxDist) break;

      dPrev = d;
    }

    return null;
  }

  prune(){
    const d = this.#d;

    for(const z in d){
      const dz = d[z];

      for(const y in dz){
        const dy = dz[y];

        for(const x in dy){
          if(dy[x].empty){
            delete dy[x];
            dy.len--;
          }
        }

        if(dy.len === 0){
          delete dz[y];
          dz.len--;
        }
      }

      if(dz.len === 0){
        delete d[z];
        d.len--;
      }
    }

    return this;
  }

  updatev(v){ return this.update(v.x, v.y, v.z); }
  hasv(v){ return this.has(v.x, v.y, v.z); }
  genv(v){ return this.gen(v.x, v.y, v.z); }
  getv(v){ return this.get(v.x, v.y, v.z); }
  setv(v, tile){ return this.set(v.x, v.y, v.z, tile); }
  getfv(v){ return this.getf(v.x, v.y, v.z); }
  adjv(v, f){ return this.adj(v.x, v.y, v.z, f); }
  adjcv(v, f){ return this.adjc(v.x, v.y, v.z, f); }
};

module.exports = Grid;