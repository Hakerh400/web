'use strict';

class RealmGenerator{
  constructor(realm, wgen, key){
    this.realm = realm;
    this.wgen = wgen;
    this.grid = wgen.grid;
    this.key = key;

    this.generated = new Set();
    this.generating = null;
    this.allocated = null;

    this.first = 1;
  }

  defaultTile(tile){}
  gen(tile){ O.virtual('gen'); }

  get size(){ return this.allocated.size; }

  startGen(){
    this.generating = new Set();
  }

  endGen(){
    for(const tile of this.generating)
      this.generated.add(tile);

    this.generating = null;
    if(this.first) this.first = 0;
  }

  startAlloc(tile=null){
    this.allocated = new Set();
    if(tile !== null) this.add(tile);
  }

  add(tile){
    this.generating.add(tile);
    this.allocated.add(tile);
  }

  maintains(tile){
    const {cache} = this.wgen;
    return cache.has(tile) && cache.get(tile) === this;
  }

  adj(tile, dir, num){
    if(this.allocated === null){
      const adj = tile.adjRaw(dir, num);

      if(adj === null) return null;
      if(this.generated.has(adj)) return null;
      if(!this.maintains(adj)) return null;

      return adj;
    }else{
      const adj = tile.adj(dir, num);

      if(this.allocated.has(adj)) return adj;
      if(this.generated.has(adj)) return null;
      if(!this.maintains(adj)) return null;

      return adj;
    }
  }

  randAdj(tile){
    return this.adj(tile, this.grid.rand(tile.adjsNum));
  }

  endAlloc(data=O.obj()){
    const tiles = this.allocated;
    this.allocated = null;
    return Object.assign(data, {tiles});
  }

  allocPath(tile, len){
    const {grid} = this;
    this.startAlloc(tile);

    const path = [tile];

    for(let i = 0; i !== len; i++){
      const next = this.randAdj(tile);
      if(next === null) continue;

      this.add(next);
      path.push(next);
      tile = next;
    }

    return this.endAlloc({path});
  }

  allocIsland(tile, size){
    const {grid} = this;
    this.startAlloc();
    
    const visited = new Set();
    const queue = [tile];
    const queued = new Set(queue);

    this.add(tile);

    while(this.size < size){
      if(queue.length === 0) break;

      const tile = grid.randElem(queue, 1, 1);
      queued.delete(tile);
      visited.add(tile);

      for(let j = 0; j !== tile.adjsNum; j++){
        const next = this.adj(tile, j);
        if(next === null || visited.has(next) || queued.has(next)) continue;

        queue.push(next);
        queued.add(next);
        this.add(next);
      }
    }

    return this.endAlloc();
  }

  allocRect(tile, w, h){
    const {grid} = this;
    this.startAlloc();

    const w1 = w >> 1;
    const h1 = h >> 1;
    const w2 = w - w1 - 1;
    const h2 = h - h1 - 1;

    const set = new Set();

    let full = 1;
    let overlaps = 0;

    const add = tile => {
      if(set.has(tile)) overlpas = 1;
      else set.add(tile);
      this.add(tile);
    };

    const row = tile => {
      let tile1 = tile;
      add(tile1);

      for(let x = 0; x !== w1; x++){
        tile1 = this.adj(tile1, 3, 4);
        if(tile1 === null) { full = 0; break; }
        add(tile1);
      }

      tile1 = tile;

      for(let x = 0; x !== w2; x++){
        tile1 = this.adj(tile1, 1, 4);
        if(tile1 === null) { full = 0; break; }
        add(tile1);
      }
    };

    let tile1 = tile;
    row(tile1);

    for(let y = 0; y !== h1; y++){
      tile1 = this.adj(tile1, 0, 4);
      if(tile1 === null) { full = 0; break; }
      row(tile1);
    }

    tile1 = tile;

    for(let y = 0; y !== h2; y++){
      tile1 = this.adj(tile1, 2, 4);
      if(tile1 === null) { full = 0; break; }
      row(tile1);
    }

    return this.endAlloc({full, overlaps});
  }
}

module.exports = RealmGenerator;