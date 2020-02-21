'use strict';

const {floor} = Math;

class Tile{
  #adjs = O.ca(this.adjsNum, () => null);
  objs = new Set();
  has = O.obj();

  constructor(grid){
    this.grid = grid;

    this.removed = 0;
  }

  get adjsNum(){ O.virtual('adjsNum'); }
  draw(g, t, k){ O.virtual('draw'); }
  border(g){ O.virtual('border'); }
  gen(){ O.virtual('gen'); }

  get len(){ return this.objs.size; }
  get fst(){ return O.fst(this.objs); }
  get empty(){ return this.objs.size === 0; }
  get nempty(){ return this.objs.size !== 0; }
  get sngl(){ return this.objs.size === 1; }
  get mult(){ return this.objs.size > 1; }
  get free(){ return !this.has.occupying; }
  get nfree(){ return this.has.occupying; }

  *get(trait){
    for(const obj of this.objs)
      if(obj.is[trait])
        yield obj;
  }

  *getm(traits){
    main: for(const obj of this.objs){
      for(const trait of traits)
        if(!obj.is[trait])
          continue main;

      yield obj;
    }
  }

  *getc(ctor){
    for(const obj of this.objs)
      if(obj.constructor === ctor)
        yield obj;
  }

  hasCtor(ctor){
    for(const obj of this.objs)
      if(obj.constructor === ctor)
        return 1;

    return 0;
  }

  hasAdj(dir, dmax=null){
    const {adjsNum} = this;
    const adjs = this.#adjs;

    if(dmax !== null && dmax !== adjsNum) dir = floor((dir + .5) / dmax * adjsNum);
    if(dir < 0) dir = dir % adjsNum + adjsNum;
    else if(dir >= adjsNum) dir %= adjsNum;

    const tile = adjs[dir];
    return tile !== null && !tile.removed;
  }

  adjRaw(dir, dmax=null){
    const {adjsNum} = this;
    const adjs = this.#adjs;

    if(dmax !== null && dmax !== adjsNum) dir = floor((dir + .5) / dmax * adjsNum);
    if(dir < 0) dir = dir % adjsNum + adjsNum;
    else if(dir >= adjsNum) dir %= adjsNum;

    const tile = adjs[dir];
    return tile !== null && !tile.removed ? tile : null;
  }

  adj(dir, dmax=null){
    const {adjsNum} = this;
    const adjs = this.#adjs;

    if(dmax !== null && dmax !== adjsNum) dir = floor((dir + .5) / dmax * adjsNum);
    if(dir < 0) dir = dir % adjsNum + adjsNum;
    else if(dir >= adjsNum) dir %= adjsNum;

    const tile = adjs[dir];
    if(tile === null || tile.removed) return this.gen(dir);
    return tile;
  }

  setAdj(dir, dmax, tile=null){
    const {adjsNum} = this;
    const adjs = this.#adjs;

    if(tile === null){
      tile = dmax;
      dmax = null;
    }

    if(dmax !== null && dmax !== adjsNum) dir = floor((dir + .5) / dmax * adjsNum);
    if(dir < 0) dir = dir % adjsNum + adjsNum;
    else if(dir >= adjsNum) dir %= adjsNum;

    adjs[dir] = tile;
  }

  adjDir(tile){
    if(tile.removed) return -1;
    return this.#adjs.indexOf(tile);
  }

  invDir(dir){
    const {adjsNum} = this;

    dir += adjsNum >> 1;
    if(dir < 0) dir = dir % adjsNum + adjsNum;
    else if(dir >= adjsNum) dir %= adjsNum;

    return dir;
  }

  addObj(obj){
    const {objs, has} = this;

    objs.add(obj);

    for(const trait in obj.is){
      if(trait in has) has[trait]++;
      else has[trait] = 1;
    }

    return this.update();
  }

  removeObj(obj){
    const {objs, has} = this;

    objs.delete(obj);

    for(const trait in obj.is)
      has[trait]--;

    return this.update();
  }

  update(){
    const {updates} = this.grid;

    updates.add(this);
    
    for(const tile of this.#adjs)
      if(tile !== null)
        updates.add(tile);

    return this;
  }

  reset(){
    this.purge();
    this.grid.emit('reset', this);
    
    return this;
  }

  purge(){
    for(const obj of this.objs)
      obj.remove();

    return this;
  }

  findPath(maxLen, func){
    const tile = this;
    const {rand} = this.grid;

    const result = func(null, tile, []);

    if(result === 1) return [];
    if(result === 0 || maxLen === 0) return null;

    const visited = new Set([tile]);
    const queue = [[tile, []]];

    while(queue.length !== 0){
      const [tile, path] = queue.shift();
      const {adjsNum} = tile;

      const start = rand(adjsNum);
      let first = 1;

      for(let i = start;; ++i === adjsNum && (i = 0)){
        if(i === start){
          if(first) first = 0;
          else break;
        }

        const newTile = tile.adj(i);
        if(visited.has(newTile)) continue;

        const newPath = path.concat(i);
        const result = func(tile, newTile, newPath);

        if(result === 1) return newPath;
        if(result === 0 || newPath.length === maxLen) continue;

        visited.add(newTile);
        queue.push([newTile, newPath]);
      }
    }

    return null;
  }

  remove(){
    this.purge();
    this.removed = 1;
    this.grid.emit('remove', this);
  }
}

O.alias(Tile.prototype, 'findPath', 'iter');

module.exports = Tile;