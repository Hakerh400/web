'use strict';

const {
  PI, min, max, abs, floor,
  ceil, round, sqrt, sin, cos,
  atan, atan2, clz32,
} = Math;

class Set2D{
  static #sym = Symbol();
  #d = Set2D.obj();
  #size = 0;

  static obj(){
    const obj = O.obj();
    obj[Set2D.#sym] = 0;
    return obj;
  }

  constructor(iterable=null){
    if(iterable !== null)
      for(const [x, y] of iterable)
        this.add(x, y);
  }

  get size(){ return this.#size; }

  add(x, y){
    const d = this.#d;
    
    if(y in d){
      if(x in d[y]) return this;
    }else{
      d[y] = Set2D.obj();
    }
    
    d[y][x] = 1;
    d[y][Set2D.#sym]++;
    this.#size++;
    
    return this;
  }

  has(x, y){
    const d = this.#d;
    return y in d && x in d[y];
  }

  delete(x, y){
    const d = this.#d;

    if(!(y in d && x in d[y])) return 0;

    if(--d[y][Set2D.#sym] === 0) delete d[y];
    else delete d[y][x];

    this.#size--;
    return 1;
  }

  *[Symbol.iterator](){
    const d = this.#d;

    for(const y in d){
      const yn = y | 0;
      const row = d[y];
      for(const x in row) yield [x | 0, yn];
    }
  }
}

class AsyncMap2D{
  constructor(x=null, y=null, val=1){
    this.d = O.obj();

    if(x !== null)
      this.add(x, y, val);
  }

  reset(x=null, y=null, val=1){
    this.d = O.obj();

    if(x !== null)
      this.add(x, y, val);
  }

  empty(){
    this.reset();
  }

  clone(){
    const map = new O.Map2D();
    this.iter((x, y, d) => map.add(x, y, d));
    return map;
  }

  eq(map){
    if(this.some((x, y) => !map.has(x, y))) return 0;
    if(map.some((x, y) => !this.has(x, y))) return 0;
    return 1;
  }

  neq(map){
    return !this.eq(map);
  }

  get(x, y, defaultVal=null){
    if(!this.has(x, y)) return defaultVal;
    return this.d[y][x];
  }

  set(x, y, val=1){
    var {d} = this;

    if(!(y in d)) d[y] = O.obj();
    d[y][x] = val;

    return this;
  }

  add(x, y, val=1){
    return this.set(x, y, val);
  }

  remove(x, y){
    var {d} = this;

    if(!(y in d)) return;
    delete d[y][x];
  }

  delete(x, y){
    this.remove(x, y);
  }

  del(x, y){
    this.remove(x, y);
  }

  has(x, y){
    var {d} = this;

    if(!(y in d)) return 0;
    if(!(x in d[y])) return 0;
    return 1;
  }

  async iter(func){
    const {d} = this;

    for(let y in d)
      for(let x in d[y |= 0])
        await func(x |= 0, y, d[y][x]);
  }

  async iterate(func){
    await this.iter(func);
  }

  async some(func){
    const {d} = this;

    for(let y in d)
      for(let x in d[y |= 0])
        if(await func(x |= 0, y, d[y][x]))
          return;
  }

  async find(v, func){
    const {d} = this;

    for(let y in d){
      for(let x in d[y |= 0]){
        const val = d[y][x |= 0];

        if(await func(x, y, val)){
          v.x = x;
          v.y = y;

          return val;
        }
      }
    }

    return null;
  }

  getArr(){
    const arr = [];
    this.iter((x, y) => arr.push([x, y]));
    return arr;
  }

  *[Symbol.iterator](){
    const {d} = this;

    for(let y in d)
      for(let x in d[y |= 0])
        yield [x |= 0, y, d[y][x]];
  }
}

class Map3D{
  constructor(x=null, y=null, z=null, val=1){
    this.d = O.obj();

    if(x !== null)
      this.add(x, y, z, val);
  }

  get(x, y, z){
    if(!this.has(x, y, z)) return null;
    return this.d[z][y][x];
  }

  set(x, y, z, val=1){
    var {d} = this;

    if(!(z in d)) d[z] = O.obj();
    d = d[z];

    if(!(y in d)) d[y] = O.obj();
    d[y][x] = val;
  }

  add(x, y, z, val=1){
    this.set(x, y, z, val);
  }

  remove(x, y, z){
    var {d} = this;

    if(!(z in d)) return;
    d = d[z];

    if(!(y in d)) return;
    delete d[y][x];
  }

  delete(x, y, z){
    this.remove(x, y, z);
  }

  has(x, y, z){
    var {d} = this;

    if(!(z in d)) return 0;
    d = d[z];

    if(!(y in d)) return 0;
    return d[y][x];
  }

  getArr(){
    var {d} = this;

    var arr = [];

    O.keys(d).forEach(z => {
      z |= 0;
      O.keys(d = d[z]).forEach(y => {
        y |= 0;
        O.keys(d[y]).forEach(x => {
          x |= 0;
          arr.push([x, y, z]);
        });
      });
    });

    return arr;
  }
}

class MultidimensionalMap{
  constructor(){
    this.d = O.obj();
    this.end = Symbol('end');
  }

  has(arr, val){
    let {d} = this;

    for(const elem of arr){
      if(!(elem in d)) return 0;
      d = d[elem];
    }

    return this.end in d;
  }

  get(arr, val){
    let {d} = this;

    for(const elem of arr){
      if(!(elem in d)) return null;
      d = d[elem];
    }

    return this.end in d ? d[this.end] : null;
  }

  set(arr, val){
    let {d} = this;

    for(const elem of arr){
      if(!(elem in d)) d[elem] = O.obj();
      d = d[elem];
    }

    d[this.end] = val;
  }

  remove(arr){
    let {d} = this;

    for(const elem of arr){
      if(!(elem in d)) return;
      d = d[elem];
    }

    delete d[this.end];
  }

  delete(arr){
    this.remove(arr);
  }
}

class Color extends Uint8ClampedArray{
  static #g = null;

  constructor(r, g, b){
    super(3);

    this.set(r, g, b);
  }

  static getCtx(){
    const ctx = this.#g;
    if(ctx !== null) return ctx;

    if(!(O.isBrowser || O.isElectron))
      throw new TypeError('This functionality is available only in a browser or Electron');
    
    const g = document.createElement('canvas').getContext('2d');
    this.#g = g;

    return g;
  }

  static isColValid(col){
    col = String(col);
    const g = this.getCtx();

    g.fillStyle = '#000000';
    g.fillStyle = col;
    const c1 = g.fillStyle;

    g.fillStyle = '#000001';
    g.fillStyle = col;
    const c2 = g.fillStyle;

    return c1 === c2;
  }

  static isColNorm(col){
    col = String(col);
    if(!this.isColValid(col)) return 0;
    return this.colNorm(col) === col;
  }

  static col2rgb(col){
    col = String(col);
    if(!this.isColValid(col)) return null;
    const g = this.getCtx();

    const str = g.fillStyle;
    const rgb = O.Buffer.alloc(3);

    rgb[0] = parseInt(str.slice(1, 3), 16);
    rgb[1] = parseInt(str.slice(3, 5), 16);
    rgb[2] = parseInt(str.slice(5, 7), 16);

    return rgb;
  }

  static rgb2col(rgb){
    return `#${rgb[0].toString(16).padStart(2, '0')
      }${rgb[1].toString(16).padStart(2, '0')
      }${rgb[2].toString(16).padStart(2, '0')}`;
  }

  static colNorm(col){
    col = String(col);
    if(!this.isColValid(col)) return null;
    const g = this.getCtx();
    return g.fillStyle;
  }

  static from(rgb){
    return new O.Color(rgb[0], rgb[1], rgb[2]);
  }

  static hsv(k){
    return O.Color.from(O.hsv(k));
  }

  static rand(hsv=0){
    let rgb;

    if(!hsv) rgb = O.ca(3, () => O.rand(256));
    else rgb = O.hsv(O.randf(1));

    return O.Color.from(rgb);
  }

  clone(){
    return O.Color.from(this);
  }

  from(col){
    this[0] = col[0];
    this[1] = col[1];
    this[2] = col[2];
    this.updateStr();
  }

  set(r, g, b){
    this[0] = r;
    this[1] = g;
    this[2] = b;
    this.updateStr();
  }

  setR(r){
    this[0] = r;
    this.updateStr();
  }

  setG(g){
    this[1] = g;
    this.updateStr();
  }

  setB(b){
    this[2] = b;
    this.updateStr();
  }

  updateStr(){
    this.str = `#${[...this].map(byte => {
      return byte.toString(16).padStart(2, '0');
    }).join('')}`;
  }

  toString(){
    return this.str;
  }
}

class AsyncImageData{
  constructor(g=null, clear=0){
    this.g = null;

    this.w = null;
    this.h = null;

    this.imgd = null;
    this.d = null;

    if(g !== null) this.fetch(g, clear);
  }

  setG(g){
    if(g === this.g) return;

    this.g = g;
    this.w = g.canvas.width;
    this.h = g.canvas.height;
  }

  fetch(g=this.g, clear=0){
    if(g !== this.g) this.setG(g);

    this.imgd = g.getImageData(0, 0, this.w, this.h);
    this.d = this.imgd.data;

    if(clear){
      const d = this.d;
      const len = d.length;

      for(var i = 0; i < len; i++){
        d[i] = (i & 3) < 3 ? 0 : 255;
      }
    }
  }

  put(g=this.g){
    if(g !== this.g) this.setG(g);

    this.g.putImageData(this.imgd, 0, 0);
  }

  get(x, y, col, includeAlpha){
    const {w, h, d} = this;

    if(x < 0) x = 0;
    else if(x >= w) x = (w | 0) - 1 | 0
    if(y < 0) y = 0;
    else if(y >= h) y = (h | 0) - 1 | 0;

    const i = (x | 0) + (y | 0) * (w | 0) << 2;

    if(includeAlpha){
      col[0] = d[i | 0] | 0;
      col[1] = d[(i | 0) + 1 | 0] | 0;
      col[2] = d[(i | 0) + 2 | 0] | 0;
      col[3] = d[(i | 0) + 3 | 0] | 0;
    }else{
      col[0] = d[i | 0] | 0;
      col[1] = d[(i | 0) + 1 | 0] | 0;
      col[2] = d[(i | 0) + 2 | 0] | 0;
    }

    return col;
  }

  set(x, y, col, includeAlpha){
    const {w, h, d} = this;

    if(x < 0 || x >= w || y < 0 || y >= h)
      return;

    const i = (x | 0) + (y | 0) * (w | 0) << 2;

    if(includeAlpha){
      d[i | 0] = col[0] | 0;
      d[(i | 0) + 1 | 0] = col[1] | 0;
      d[(i | 0) + 2 | 0] = col[2] | 0;
      d[(i | 0) + 3 | 0] = col[3] | 0;
    }else{
      d[i | 0] = col[0] | 0;
      d[(i | 0) + 1 | 0] = col[1] | 0;
      d[(i | 0) + 2 | 0] = col[2] | 0;
    }
  }

  setRgb(x, y, r, g, b){
    const {w, h, d} = this;

    if(x < 0 || x >= w || y < 0 || y >= h)
      return;

    const i = (x | 0) + (y | 0) * (w | 0) << 2;

    d[i | 0] = r | 0;
    d[(i | 0) + 1 | 0] = g | 0;
    d[(i | 0) + 2 | 0] = b | 0;
  }

  async iter(func, includeAlpha=0){
    const {w, h, d} = this;

    if(includeAlpha){
      for(var y = 0, i = 0; y < h; y++){
        for(var x = 0; x < w; x++, i += 4){
          var col = await func(x | 0, y | 0, d[i | 0] | 0, d[(i | 0) + 1 | 0] | 0, d[(i | 0) + 2 | 0] | 0, d[(i | 0) + 3 | 0] | 0);

          if(col){
            d[i | 0] = col[0] | 0;
            d[(i | 0) + 1 | 0] = col[1] | 0;
            d[(i | 0) + 2 | 0] = col[2] | 0;
            d[(i | 0) + 3 | 0] = col[3] | 0;
          }
        }
      }
    }else{
      for(var y = 0, i = 0; y < h; y++){
        for(var x = 0; x < w; x++, i += 4){
          var col = await func(x | 0, y | 0, d[i | 0] | 0, d[(i | 0) + 1 | 0] | 0, d[(i | 0) + 2 | 0] | 0);

          if(col){
            d[i | 0] = col[0] | 0;
            d[(i | 0) + 1 | 0] = col[1] | 0;
            d[(i | 0) + 2 | 0] = col[2] | 0;
          }
        }
      }
    }
  }

  async iterate(func, includeAlpha){
    await this.iter(func, includeAlpha);
  }
}

class EventEmitter{
  #ls = O.obj();

  on(type, func){
    const ls = this.#ls;
    if(!(type in ls)) ls[type] = new Map();
    ls[type].set(func, 1);
    return this;
  }

  addEventListener(type, func){
    return this.on(type, func);
  }

  ael(type, func){
    return this.on(type, func);
  }

  once(type, func){
    const ls = this.#ls;
    if(!(type in ls)) ls[type] = new Map();
    ls[type].set(func, 0);
    return this;
  }

  removeListener(type, func){
    const ls = this.#ls;
    if(!(type in ls)) return;
    ls[type].delete(func);
    if(ls[type].size === 0) delete ls[type];
    return this;
  }

  rel(type, func){
    return this.removeListener(type, func);
  }

  removeAllListeners(type){
    delete this.ls[type];
    return this;
  }

  emit(type, ...args){
    const ls = this.#ls;
    if(!(type in ls)) return this;

    let val = null;

    for(const [func, repeat] of ls[type]){
      val = func(...args);
      if(!repeat) this.removeListener(type, func);
    }

    return val;
  }
}

class AsyncGrid{
  constructor(w, h, func=null, d=null){
    this.w = w;
    this.h = h;

    if(d === null){
      d = O.ca(h, y => {
        return O.ca(w, x =>{
          if(func === null) return null;
          return func(x, y);
        });
      });
    }

    this.d = d;
  }

  async iter(func){
    const {w, h} = this;

    for(let y = 0; y !== h; y++)
      for(let x = 0; x !== w; x++)
        await func(x, y, this.get(x, y));
  }

  async iterate(func){
    await this.iter(func);
  }

  async some(func){
    const {w, h} = this;

    for(let y = 0; y !== h; y++)
      for(let x = 0; x !== w; x++)
        if(await func(x, y, this.get(x, y)))
          return 1;

    return 0;
  }

  async find(v, func){
    const {w, h} = this;

    for(let y = 0; y !== h; y++){
      for(let x = 0; x !== w; x++){
        if(await func(x, y, this.get(x, y))){
          v.x = x;
          v.y = y;
          return 1;
        }
      }
    }

    return 0;
  }

  async count(func){
    const {w, h} = this;
    let num = 0;

    for(let y = 0; y !== h; y++)
      for(let x = 0; x !== w; x++)
        if(await func(x, y, this.get(x, y)))
          num++;

    return num;
  }

  async iterAdj(x, y, wrap, func=null){
    if(func === null){
      func = wrap;
      wrap = 0;
    }

    const queue = [x, y];
    const queued = new O.Map2D(x, y);
    const visited = new O.Map2D();

    while(queue.length !== 0){
      const x = queue.shift();
      const y = queue.shift();

      queued.remove(x, y);
      visited.add(x, y);

      await this.adj(x, y, wrap, async (x1, y1, d, dir, wrapped) => {
        if(d === null) return;
        if(queued.has(x1, y1)) return;
        if(visited.has(x1, y1)) return;

        if(await func(x1, y1, d, x, y, dir, wrapped)){
          queue.push(x1, y1);
          queued.add(x1, y1);
        }
      });
    }
  }

  async adj(x, y, wrap, func=null){
    const {w, h} = this;

    if(func === null){
      func = wrap;
      wrap = 0;
    }

    let wd = 0;

    return (
      (await func(x, (wd = wrap && y === 0) ? h - 1 : y - 1, this.get(x, y - 1, wrap), 0, wd)) ||
      (await func((wd = wrap && x === w - 1) ? 0 : x + 1, y, this.get(x + 1, y, wrap), 1, wd)) ||
      (await func(x, (wd = wrap && y === h - 1) ? 0 : y + 1, this.get(x, y + 1, wrap), 2, wd)) ||
      (await func((wd = wrap && x === 0) ? w - 1 : x - 1, y, this.get(x - 1, y, wrap), 3, wd))
    );
  }

  async adjc(x, y, wrap, func=null){
    const {w, h} = this;

    if(func === null){
      func = wrap;
      wrap = 0;
    }

    return (
      (await func(wrap && x === 0 ? w - 1 : x - 1, wrap && y === 0 ? h - 1 : y - 1, this.get(x - 1, y - 1, wrap), 0)) ||
      (await func(wrap && x === w - 1 ? 0 : x + 1, wrap && y === 0 ? h - 1 : y - 1, this.get(x + 1, y - 1, wrap), 1)) ||
      (await func(wrap && x === 0 ? w - 1 : x - 1, wrap && y === h - 1 ? 0 : y + 1, this.get(x - 1, y + 1, wrap), 2)) ||
      (await func(wrap && x === w - 1 ? 0 : x + 1, wrap && y === h - 1 ? 0 : y + 1, this.get(x + 1, y + 1, wrap), 3))
    );
  }

  async findAdj(x, y, wrap, func=null){
    const {w, h} = this;

    if(func === null){
      func = wrap;
      wrap = 0;
    }

    let dir = 0;
    let wd;

    const found = (
      (await func(x, (wd = wrap && y === 0) ? h - 1 : y - 1, this.get(x, y - 1, wrap), dir++, wd)) ||
      (await func((wd = wrap && x === w - 1) ? 0 : x + 1, y, this.get(x + 1, y, wrap), dir++, wd)) ||
      (await func(x, (wd = wrap && y === h - 1) ? 0 : y + 1, this.get(x, y + 1, wrap), dir++, wd)) ||
      (await func((wd = wrap && x === 0) ? w - 1 : x - 1, y, this.get(x - 1, y, wrap), dir++, wd))
    );

    if(!found) return -1;
    return dir - 1;
  }

  nav(v, dir, wrap=0){
    const {w, h} = this;

    switch(dir){
      case 0: v.y--; break;
      case 1: v.x++; break;
      case 2: v.y++; break;
      case 3: v.x--; break;
    }

    if(wrap){
      if(v.x === -1) v.x = w - 1;
      if(v.y === -1) v.y = h - 1;
      if(v.x === w) v.x = 0;
      if(v.y === h) v.y = 0;
    }

    return this.get(v.x, v.y, wrap);
  }

  async path(xs, ys, wrap=null, all=null, func=null){
    if(func === null){
      if(all === null){
        func = wrap;
        wrap = 0;
      }else{
        func = all;
      }
      all = 0;
    }

    const queue = [[xs, ys, [], new O.Map2D(xs, ys, 0), '']];
    const queued = O.obj();
    const visited = O.obj();

    let path = null;

    queued[''] = new O.Map2D(xs, ys);

    while(queue.length !== 0){
      const [x, y, pp, cp, sp] = queue.shift();
      const dirp = pp.length !== 0 ? O.last(pp) ^ 2 : -1;

      queued[sp].remove(x, y);

      if(!(sp in visited))
        visited[sp] = new O.Map2D(x, y);
      else
        visited[sp].add(x, y);

      if(await this.adj(x, y, wrap, async (x1, y1, d, dir, wrapped) => {
        if(dir === dirp) return;

        const start = x1 === xs && y1 === ys;

        if(!start){
          const len = cp.get(x1, y1);
          if(len !== null && ((len ^ pp.length) & 1)) return;
        }

        const p = pp.slice();
        const c = cp.clone();
        const s = all ? sp + dir : wrap && (pp.length & 1) ? '1' : '';

        p.push(dir);
        c.add(x1, y1, p.length);

        if(!start){
          if((s in queued) && queued[s].has(x1, y1)) return;
          if((s in visited) && visited[s].has(x1, y1)) return;
        }

        switch(await func(x1, y1, d, x, y, dir, wrapped, p, c, cp)){
          case 1:
            if(start) break;
            queue.push([x1, y1, p, c, s]);
            if(!(s in queued))
              queued[s] = new O.Map2D(x1, y1);
            else
              queued[s].add(x1, y1);
            break;

          case 2:
            path = p;
            return 1;
            break;
        }
      })) break;
    }

    return path;
  }

  async findPath(x, y, wrap, all, func){
    await this.path(x, y, wrap, all, func);
  }

  get(x, y, wrap=0, defaultVal=null){
    const {w, h} = this;

    if(!this.includes(x, y)){
      if(!wrap) return defaultVal;
      x = ((x % w) + w) % w;
      y = ((y % h) + h) % h;
    }

    return this.d[y][x];
  }

  set(x, y, val, wrap=0){
    const {w, h} = this;

    if(!this.includes(x, y)){
      if(!wrap) return;
      x = ((x % w) + w) % w;
      y = ((y % h) + h) % h;
    }

    this.d[y][x] = val;
  }

  has(x, y){
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  includes(x, y){
    return this.has(x, y);
  }
}

class EnhancedRenderingContext{
  constructor(g){
    this.g = g;
    this.canvas = g.canvas;

    this.w = this.canvas.width;
    this.h = this.canvas.height;

    this.s = 1;
    this.tx = 0;
    this.ty = 0;

    this.rtx = 0;
    this.rty = 0;
    this.rot = 0;
    this.rcos = 0;
    this.rsin = 0;

    this.fontSize = 32;
    this.fontScale = 1;
    this.fontFamily = 'Arial';
    this.fontModifiers = '';

    this.pointsQueue = [];
    this.arcsQueue = [];

    this.concaveMode = false;

    [
      'fillStyle',
      'strokeStyle',
      'globalAlpha',
      'textAlign',
      'textBaseline',
      'lineWidth',
      'globalCompositeOperation',
      'lineCap',
      'lineJoin',
    ].forEach(prop => {
      Object.defineProperty(this, prop, {
        set: val => g[prop] = val,
        get: () => g[prop],
      });
    });

    [
      'clearRect',
      'measureText',
    ].forEach(prop => this[prop] = g[prop].bind(g));

    this.fillStyle = 'white';
    this.strokeStyle = 'black';
    this.textBaseline = 'middle';
    this.textAlign = 'center';

    this.drawImage = g.drawImage.bind(g);

    this.clearCanvas();
  }

  resize(w, h){
    const {canvas, g} = this;

    const attribs = [
      'fillStyle',
      'strokeStyle',
      'globalAlpha',
      'textAlign',
      'textBaseline',
      'lineWidth',
      'globalCompositeOperation',
      'lineCap',
      'lineJoin',
    ];

    const values = attribs.map(a => g[a]);

    this.w = canvas.width = w;
    this.h = canvas.height = h;

    attribs.forEach((a, b) => g[a] = values[b]);
  }

  clearCanvas(col=null){
    var {canvas, g} = this;
    if(col !== null) g.fillStyle = col;
    g.fillRect(0, 0, canvas.width, canvas.height);
  }

  createLinearGradient(...params){
    return this.g.createLinearGradient(...params);
  }

  beginPath(){
    this.pointsQueue.length = 0;
    this.arcsQueue.length = 0;
  }

  closePath(){
    var q = this.pointsQueue;
    q.push(1, q[1], q[2]);
  }

  fill(){
    this.finishLine(true);
    this.g.fill();
  }

  stroke(){
    this.finishLine(false);
    this.g.stroke();
  }

  finishLine(fillMode){
    var {g} = this;
    var q = this.pointsQueue;
    var aq = this.arcsQueue;

    var x1 = q[1];
    var y1 = q[2];

    var i = 0;
    var j = 0;

    var concaveMode = this.concaveMode && !fillMode;
    var hasArcs = aq.length !== 0;

    if(concaveMode){
      var fillStyle = g.fillStyle;
      g.fillStyle = g.strokeStyle;
    }

    g.beginPath();

    do{
      if(j < aq.length && aq[j] === i){
        g.arc(aq[j + 1], aq[j + 2], aq[j + 3], aq[j + 4], aq[j + 5], aq[j + 6]);
        j += 7;
      }

      var type = q[i];

      var x2 = q[i + 1];
      var y2 = q[i + 2];

      if(fillMode){
        if(abs(x1 - x2) === 1) x2 = x1;
        if(abs(y1 - y2) === 1) y2 = y1;
      }

      if(!type){
        x1 = x2;
        y1 = y2;
        continue;
      }

      if(fillMode){
        g.lineTo(x2, y2);
      }else{
        var dx = y1 !== y2 ? .5 : 0;
        var dy = x1 !== x2 ? .5 : 0;

        g.moveTo(x1 + dx, y1 + dy);
        g.lineTo(x2 + dx, y2 + dy);

        if(concaveMode){
          if(x1 < x2 || y1 < y2)
            g.fillRect(x2, y2, 1, 1);
        }
      }

      x1 = x2;
      y1 = y2;
    }while((i += 3) < q.length);

    if(concaveMode)
      g.fillStyle = fillStyle;
  }

  resetTransform(resetScale=1){
    if(resetScale)
      this.s = 1;

    this.tx = 0;
    this.ty = 0;
    this.rot = 0;

    this.g.resetTransform();
  }

  scale(s){
    this.s *= s;
  }

  translate(x, y){
    this.tx += this.s * x;
    this.ty += this.s * y;
  }

  rotate(x, y, angle){
    this.rot = angle;

    if(angle){
      this.rtx = x;
      this.rty = y;
      this.rcos = cos(angle);
      this.rsin = -sin(angle);
    }
  }

  save(rot=0){
    this.sPrev = this.s;
    this.txPrev = this.tx;
    this.tyPrev = this.ty;

    if(rot){
      this.rtxPrev = this.rtx;
      this.rtyPrev = this.rty;
      this.rotPrev = this.rot;
      this.rcosPrev = this.rcos;
      this.rsinPrev = this.rsin;
    }
  }

  restore(rot=0){
    this.s = this.sPrev;
    this.tx = this.txPrev;
    this.ty = this.tyPrev;

    if(rot){
      this.rtx = this.rtxPrev;
      this.rty = this.rtyPrev;
      this.rot = this.rotPrev;
      this.rcos = this.rcosPrev;
      this.rsin = this.rsinPrev;
    }
  }

  rect(x, y, w, h){
    var s1 = 1 / this.s;

    this.moveTo(x, y);
    this.lineTo(x + w + s1, y);

    this.moveTo(x + w, y);
    this.lineTo(x + w, y + h + s1);

    this.moveTo(x + w + s1, y + h);
    this.lineTo(x, y + h);

    this.moveTo(x, y + h + s1);
    this.lineTo(x, y);
  }

  fillRect(x, y, w, h){
    if(this.rot){
      this.g.beginPath();
      this.rect(x, y, w, h);
      this.fill();
      return;
    }

    this.g.fillRect(round(x * this.s + this.tx), round(y * this.s + this.ty), round(w * this.s) + 1, round(h * this.s) + 1);
  }

  strokeRect(x, y, w, h){
    if(this.rot){
      this.g.beginPath();
      this.rect(x, y, w, h);
      this.stroke();
      return;
    }

    this.g.strokeRect(round(x * this.s + this.tx) + .5, round(y * this.s + this.ty) + .5, round(w * this.s) + 1, round(h * this.s) + 1);
  }

  moveTo(x, y){
    if(this.rot){
      var xx = x - this.rtx;
      var yy = y - this.rty;

      x = this.rtx + xx * this.rcos - yy * this.rsin;
      y = this.rty + yy * this.rcos + xx * this.rsin;
    }

    this.pointsQueue.push(0, round(x * this.s + this.tx), round(y * this.s + this.ty));
  }

  lineTo(x, y){
    if(this.rot){
      var xx = x - this.rtx;
      var yy = y - this.rty;

      x = this.rtx + xx * this.rcos - yy * this.rsin;
      y = this.rty + yy * this.rcos + xx * this.rsin;
    }

    this.pointsQueue.push(1, round(x * this.s + this.tx), round(y * this.s + this.ty));
  }

  arc(x, y, r, a1, a2, acw){
    if(this.rot){
      var xx = x - this.rtx;
      var yy = y - this.rty;

      x = this.rtx + xx * this.rcos - yy * this.rsin;
      y = this.rty + yy * this.rcos + xx * this.rsin;

      a1 = (a1 - this.rot) % O.pi2;
      a2 = (a2 - this.rot) % O.pi2;
    }

    var xx = x * this.s + this.tx + .5;
    var yy = y * this.s + this.ty + .5;
    var rr = r * this.s;
    this.arcsQueue.push(this.pointsQueue.length, xx, yy, rr, a1, a2, acw);

    xx += cos(a2) * rr;
    yy += sin(a2) * rr;
    this.pointsQueue.push(0, xx, yy);
  }

  fillText(text, x, y){
    if(this.rot){
      var xx = x - this.rtx;
      var yy = y - this.rty;

      x = this.rtx + xx * this.rcos - yy * this.rsin;
      y = this.rty + yy * this.rcos + xx * this.rsin;
    }

    this.g.fillText(text, round(x * this.s + this.tx) + 1, round(y * this.s + this.ty) + 1);
  }

  strokeText(text, x, y){
    if(this.rot){
      var xx = x - this.rtx;
      var yy = y - this.rty;

      x = this.rtx + xx * this.rcos - yy * this.rsin;
      y = this.rty + yy * this.rcos + xx * this.rsin;
    }

    this.g.strokeText(text, round(x * this.s + this.tx) + 1, round(y * this.s + this.ty) + 1);
  }

  updateFont(){
    var modifiers = this.fontModifiers;
    var strDelimiter = modifiers.length !== 0 ? ' ' : '';

    this.g.font = `${modifiers}${strDelimiter}${this.fontSize * this.fontScale}px "${this.fontFamily}"`;
  }

  font(size){
    this.fontSize = size;
    this.updateFont();
  }

  scaleFont(scale){
    this.fontScale = scale;
    this.updateFont();
  }

  setFontModifiers(modifiers){
    this.fontModifiers = modifiers;
    this.updateFont();
  }

  removeFontModifiers(){
    this.fontModifiers = '';
    this.updateFont();
  }

  drawTube(x, y, dirs, size, round=0){
    const g = this;

    const s1 = (1 - size) / 2;
    const s2 = 1 - s1;

    const radius = min(size, .5);

    const p1 = (1 - sqrt(radius * radius * 4 - size * size)) / 2;
    const p2 = 1 - p1;

    const phi1 = (1.9 - size / (radius * 4)) * O.pi;
    const phi2 = phi1 + O.pi2 - size / radius * O.pih;

    let foundArc = round;

    g.beginPath();

    drawingBlock: {
      if(round === 1){
        switch(dirs){
          case 0:
            g.arc(x + .5, y + .5, radius, 0, O.pi2);
            break;

          case 1:
            g.moveTo(x + s2, y + p1);
            g.lineTo(x + s2, y);
            g.lineTo(x + s1, y);
            g.lineTo(x + s1, y + p1);
            break;

          case 2:
            g.moveTo(x + p2, y + s2);
            g.lineTo(x + 1, y + s2);
            g.lineTo(x + 1, y + s1);
            g.lineTo(x + p2, y + s1);
            break;

          case 4:
            g.moveTo(x + s1, y + p2);
            g.lineTo(x + s1, y + 1);
            g.lineTo(x + s2, y + 1);
            g.lineTo(x + s2, y + p2);
            break;

          case 8:
            g.moveTo(x + p1, y + s1);
            g.lineTo(x, y + s1);
            g.lineTo(x, y + s2);
            g.lineTo(x + p1, y + s2);
            break;

          default:
            foundArc = 0;
            break;
        }

        if(foundArc)
          break drawingBlock;
      }

      g.moveTo(x + s1, y + s1);

      if(dirs & 1){
        g.lineTo(x + s1, y);
        g.lineTo(x + s2, y);
      }
      g.lineTo(x + s2, y + s1);

      if(dirs & 2){
        g.lineTo(x + 1, y + s1);
        g.lineTo(x + 1, y + s2);
      }
      g.lineTo(x + s2, y + s2);

      if(dirs & 4){
        g.lineTo(x + s2, y + 1);
        g.lineTo(x + s1, y + 1);
      }
      g.lineTo(x + s1, y + s2);

      if(dirs & 8){
        g.lineTo(x, y + s2);
        g.lineTo(x, y + s1);
      }
    }

    if(foundArc){
      if(dirs !== 0){
        const a = atan((.5 - p1) / (s2 - .5));
        const b = O.pi - a;
        const c = (dirs === 1 ? 0 : dirs === 2 ? 1 : dirs === 4 ? 2 : 3) * O.pih;

        g.arc(x + .5, y + .5, radius, c - b, c - a, 1);
        g.closePath();
      }

      g.fill();
      g.stroke();
    }else{
      g.closePath();
      g.fill();
      g.stroke();

      const col = g.strokeStyle;
      const s = 1 / g.s;

      g.strokeStyle = g.fillStyle;
      g.beginPath();

      if(dirs & 1){
        g.moveTo(x + s1 + s, y);
        g.lineTo(x + s2 - s, y);
      }

      if(dirs & 2){
        g.moveTo(x + 1, y + s1 + s);
        g.lineTo(x + 1, y + s2 - s);
      }

      if(dirs & 4){
        g.moveTo(x + s2 - s, y + 1);
        g.lineTo(x + s1 + s, y + 1);
      }

      if(dirs & 8){
        g.moveTo(x, y + s2);
        g.lineTo(x, y + s1 + s);
      }

      g.stroke();
      g.strokeStyle = col;
    }
  }
}

class Buffer extends Uint8Array{
  constructor(...params){
    if(params.length === 1 && typeof params[0] === 'string')
      params[0] = [...params[0]].map(a => O.cc(a));

    super(...params);
  }

  static alloc(size){
    return new O.Buffer(size);
  }

  static from(data, encoding='utf8', mode=0){
    if(data.length === 0)
      return O.Buffer.alloc(0);

    switch(encoding){
      case 'hex':
        data = data.match(/[0-9a-f]{2}/gi).map(a => parseInt(a, 16));
        return new O.Buffer(data);
        break;

      case 'base64':
        return O.base64.decode(data, mode);
        break;

      case 'utf8':
        return new O.Buffer(data);
        break;

      default:
        this.errEnc(encoding);
        break;
    }
  }

  static concat(arr){
    arr = arr.reduce((concatenated, buff) => {
      return [...concatenated, ...buff];
    }, []);

    return new O.Buffer(arr);
  }

  equals(buf){
    const len = this.length;
    if(buf.length !== len) return false;

    for(let i = 0; i !== len; i++)
      if(buf[i] !== this[i]) return false;

    return true;
  }

  readUInt32BE(offset){
    var val;

    val = this[offset] * 2 ** 24;
    val += this[offset + 1] * 2 ** 16;
    val += this[offset + 2] * 2 ** 8;
    val += this[offset + 3];

    return val;
  }

  writeUInt32BE(val, offset){
    this[offset] = val / 2 ** 24;
    this[offset + 1] = val / 2 ** 16;
    this[offset + 2] = val / 2 ** 8;
    this[offset + 3] = val;
  }

  writeInt32BE(val, offset){
    this[offset] = val >> 24;
    this[offset + 1] = val >> 16;
    this[offset + 2] = val >> 8;
    this[offset + 3] = val;
  }

  toString(encoding='utf8', mode=0){
    switch(encoding){
      case 'hex':
        return Array.from(this).map(a => a.toString(16).padStart(2, '0')).join('');
        break;

      case 'base64':
        return O.base64.encode(this, mode);
        break;

      case 'utf8':
        return Array.from(this).map(a => String.fromCharCode(a)).join('');
        break;

      default:
        this.errEnc(encoding);
        break;
    }
  }

  errEnc(encoding){
    throw new TypeError(`Unsupported encoding ${O.sf(encoding)}`);
  }
}

class AsyncIterable{
  static #kCont = Symbol('continue');
  static #kBreak = Symbol('break');

  get kCont(){ return Iterable.#kCont; }
  get kBreak(){ return Iterable.#kBreak; }

  get chNum(){ O.virtual('chNum'); }
  async getCh(index){ O.virtual('getCh'); }
  async setCh(index, val){ O.virtual('getCh'); }

  async getChNum(){ return this.chNum; }
  get chArr(){ return [...this]; }

  async traverse(func){
    const {kBreak} = this;
    const stack = [this];
    const flags = [0];

    while(stack.length !== 0){
      const elem = O.last(stack);

      if(O.last(flags)){
        stack.pop();
        flags.pop();

        const result = await func(elem, 1);
        if(result === kBreak) return 1;

        continue;
      }

      await func(elem, 0);
      O.setLast(flags, 1);

      const chNum = await elem.getChNum();

      for(let i = chNum - 1; i !== -1; i--){
        stack.push(await elem.getCh(i));
        flags.push(0);
      }
    }

    return 0;
  }

  async topDown(func){
    const {kCont, kBreak} = this;
    const stack = [this];
  
    while(stack.length !== 0){
      const elem = stack.pop();
  
      const result = await func(elem);
      if(result === kCont) continue;
      if(result === kBreak) return 1;
  
      const chNum = await elem.getChNum();
  
      for(let i = chNum - 1; i !== -1; i--)
        stack.push(await elem.getCh(i));
    }
  
    return 0;
  }

  async bottomUp(func){
    const {kBreak} = this;
    const stack = [this];
    const flags = [0];

    while(stack.length !== 0){
      const elem = O.last(stack);

      if(O.last(flags)){
        stack.pop();
        flags.pop();

        const result = await func(elem);
        if(result === kBreak) return 1;

        continue;
      }

      O.setLast(flags, 1);

      const chNum = await elem.getChNum();

      for(let i = chNum - 1; i !== -1; i--){
        stack.push(await elem.getCh(i));
        flags.push(0);
      }
    }

    return 0;
  }

  async *[Symbol.iterator](){
    const chNum = await this.getChNum();

    for(let i = 0; i !== chNum; i++)
      yield await this.getCh(i);
  }
}

class AsyncStringifiable extends AsyncIterable{
  static tabSize = 2;
  static #inc = Symbol('inc');
  static #dec = Symbol('dec');
  static #prefixPush = Symbol('prefixPush');
  static #prefixPop = Symbol('prefixPop');

  #tabSize = AsyncStringifiable.tabSize;
  #prefixes = [];

  get tabSize(){ return this.#tabSize; }
  set tabSize(tabSize){ this.#tabSize = tabSize; }

  get inc(){ return AsyncStringifiable.#inc; }
  get dec(){ return AsyncStringifiable.#dec; }
  get prefixPush(){ return AsyncStringifiable.#prefixPush; }
  get prefixPop(){ return AsyncStringifiable.#prefixPop; }

  async toStr(arg){ O.virtual('toStr'); }

  join(stack, arr, sep){
    arr.forEach((elem, index) => {
      if(index !== 0) stack.push(sep);
      stack.push(elem);
    });

    return stack;
  }

  async toJSON(){
    return await this.toString();
  }

  async toString(arg=O.obj()){
    const {tabSize, inc, dec, prefixPush, prefixPop} = this;
    const prefixes = this.#prefixes;

    const stack = [this];
    let str = '';
    let tab = 0;

    const push = (context, index, val) => {
      check: {
        if(typeof val === 'string') break check;
        if(typeof val === 'symbol') break check;
        if(val instanceof O.AsyncStringifiable) break check;

        throw new TypeError(`${
          context.constructor.name}: Invalid value pushed to the stack${
          index !== null ? ` (index ${
          index})` : ''}`);
      }

      stack.push(val);
    };

    const append = s => {
      const prefix = `${prefixes.join('')}${' '.repeat(tab)}`;

      s = s.replace(/\r\n|\r|\n/g, a => {
        return `${a}${prefix}`;
      });

      str += s;
    };

    while(stack.length !== 0){
      const elem = stack.pop();

      if(elem === inc){
        tab += tabSize;
        continue;
      }

      if(elem === dec){
        if(tab === 0)
          throw new TypeError('Indentation cannot be negative');

        tab -= tabSize;
        continue;
      }

      if(elem === prefixPush){
        const str = stack.pop();

        if(typeof str !== 'string')
          throw new TypeError('Prefix must be a string');

        prefixes.push(str);
        continue;
      }

      if(elem === prefixPop){
        prefixes.pop();
        continue;
      }

      if(typeof elem === 'string'){
        append(elem);
        continue;
      }

      const val = await elem.toStr(arg);

      if(!Array.isArray(val)){
        push(elem, null, val);
        continue;
      }

      for(let i = val.length - 1; i !== -1; i--)
        push(elem, i, val[i]);
    }

    if(tab !== 0)
      throw new TypeError('Unmatched indentation');

    return str;
  }
}

class AsyncComparable extends AsyncStringifiable{
  async cmp(obj){ O.virtual('cmp'); }
}

class AsyncPriorityQueue extends AsyncStringifiable{
  #arr = [null];

  get arr(){ return this.#arr.slice(1); }
  get len(){ return this.#arr.length - 1; }
  get isEmpty(){ return this.#arr.length === 1; }

  async push(elem){
    const arr = this.#arr;
    let i = arr.length;

    arr.push(elem);

    while(i !== 1){
      const j = i >> 1;

      if(await arr[i].cmp(arr[j]) >= 0) break;

      const t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;

      i = j;
    }

    return this;
  }

  async pop(){
    const arr = this.#arr;
    const first = this.top();
    const last = arr.pop();
    const len = arr.length;

    if(len !== 1){
      let i = 1;

      arr[1] = last;

      while(1){
        let j = i << 1;

        if(j >= len) break;
        if(j + 1 !== len && (await arr[j].cmp(arr[j + 1])) > 0) j++;
        if((await arr[j].cmp(arr[i])) >= 0) break;

        const t = arr[i];
        arr[i] = arr[j];
        arr[j] = t;

        i = j;
      }
    }

    return first;
  }

  top(){
    const arr = this.#arr;

    if(arr.length === 1)
      throw new TypeError('The queue is empty');

    return arr[1];
  }

  *[Symbol.iterator](){
    const arr = this.#arr;
    const len = arr.length;

    for(let i = 1; i !== len; i++)
      yield arr[i];
  }
}

class AsyncTreeNode extends AsyncStringifiable{
  #parent = null;
  #type = null;
  #left = null;
  #right = null;

  constructor(obj){
    super();
    this.obj = obj;
  }

  get parent(){ return this.#parent; }
  get type(){ return this.#type; }
  get left(){ return this.#left; }
  get right(){ return this.#right; }

  set left(node){
    this.#left = node;

    if(node !== null){
      node.#parent = this;
      node.#type = 0;
    }
  }

  set right(node){
    this.#right = node;

    if(node !== null){
      node.#parent = this;
      node.#type = 1;
    }
  }

  get(type){
    if(type === 0) return this.#left;
    return this.#right;
  }

  set(type, node){
    if(type === 0) this.left = node;
    else this.right = node;
  }

  detach(){
    this.#type = null;
    this.#parent = null;
  }

  get chNum(){ return (this.left !== null) + (this.right !== null); }
  getCh(i){ return this.i === 0 ? this.left : this.right; }

  toStr(){
    const f = a => a !== null ? a : '#';
    return ['(', this.obj, ', ', f(this.left), ', ', f(this.right), ')'];
  }
}

class AsyncTree extends AsyncStringifiable{
  root = null;

  toStr(){
    const {root} = this;
    return root !== null ? root : '#';
  }
}

class AsyncAVLNode extends AsyncTreeNode{
  #height = 1;

  get height(){
    return this.#height;
  }

  get bfac(){
    const {left, right} = this;

    return (
      (right !== null ? right.#height : 0) -
      (left !== null ? left.#height : 0)
    );
  }

  get left(){ return super.left; }
  get right(){ return super.right; }

  set left(node){
    super.left = node;
    this.updateHeight();
  }

  set right(node){
    super.right = node;
    this.updateHeight();
  }

  updateHeight(){
    const {left, right} = this;

    return this.#height = max(
      left !== null ? left.#height : 0,
      right !== null ? right.#height : 0,
    ) + 1;
  }

  async cmp(other){
    return await this.obj.cmp(other.obj);
  }

  get needsRebalancing(){
    this.updateHeight();
    return abs(this.bfac) === 2;
  }

  rebalance(){
    const {bfac} = this;
    const abfac = abs(bfac);
    if(abfac !== 2) O.assert.fail();

    const dir1 = bfac < 0 ? 0 : 1;
    const ch = this.get(dir1);
    const dir2 = ch.bfac < 0 ? 0 : 1;

    if(dir2 !== dir1)
      this.set(dir1, ch.rotate(dir2 ^ 1));

    return this.rotate(dir1 ^ 1);
  }

  rotate(dir){
    /*
      dir === 0 ---> left
      dir === 1 ---> right
    */

    const d0 = dir;
    const d1 = dir ^ 1;

    const a = this;
    const c = a.get(d1);
    const f = c.get(d0);

    a.set(d1, f);
    c.set(d0, a);

    return c;
  }
}

class AsyncAVLTree extends AsyncTree{
  async insert(obj){
    const {root} = this;
    const nodeNew = new O.AsyncAVLNode(obj);

    if(root === null){
      this.root = nodeNew;
      return;
    }

    let node = root;

    while(1){
      const dir = (await nodeNew.cmp(node)) <= 0 ? 0 : 1;
      const next = node.get(dir);

      if(next === null){
        node.set(dir, nodeNew);
        break;
      }

      node = next;
    }

    for(;node !== null; node = node.parent){
      if(node.needsRebalancing){
        this.rebalance(node);
        break;
      }
    }
  }

  async has(obj){
    return (await this.find(obj)) !== null;
  }

  async find(obj){
    let node = this.root;

    while(node !== null){
      if(node.obj === obj) return node;

      const dir = (await obj.cmp(node.obj)) <= 0 ? 0 : 1;
      node = node.get(dir);
    }

    return null;
  }

  async remove(obj){
    let node = await this.find(obj);
    if(node === null) O.assert.fail();

    const {left, right} = node;

    if(left !== null && right !== null){
      let pred = left;

      while(1){
        const {right} = pred;
        if(right === null) break;
        pred = right;
      }

      node.obj = pred.obj;
      node = pred;
    }

    this.replace(node.parent, node.type, node.left || node.right);

    for(;node !== null; node = node.parent)
      if(node.needsRebalancing)
        node = this.rebalance(node);
  }

  rebalance(node){
    const {parent, type} = node;
    const nodeNew = node.rebalance();

    this.replace(parent, type, nodeNew);

    return nodeNew;
  }

  replace(parent, type, nodeNew){
    if(parent === null){
      if(nodeNew !== null)
        nodeNew.detach();

      this.root = nodeNew;
    }else{
      parent.set(type, nodeNew);
    }
  }

  async traverse(func){
    for(const obj of this)
      await func(obj);
  }

  *[Symbol.iterator](){
    const {root} = this;
    if(root === null) return;

    const stack = [[this.root, 0]];

    while(stack.length !== 0){
      const frame = stack.pop();
      const [node, flag] = frame;

      if(flag === 0){
        const {left, right} = node;

        if(right !== null) stack.push([right, 0]);

        frame[1] = 1;
        stack.push(frame);

        if(left !== null) stack.push([left, 0]);

        continue;
      }

      yield node.obj;
    }
  }
}

class IO{
  constructor(input='', checksum=0, pad=0){
    let buf = O.Buffer.from(input);
    if(checksum) buf = IO.unlock(buf, 1);

    this.input = buf
    this.output = O.Buffer.alloc(1);

    this.pad = pad;

    this.inputIndex = pad ? 0 : 1;
    this.outputIndex = 0;
    this.byte = 0;
  }

  static name(){ return 'Standard'; }
  static isBit(){ return 0; }

  static lock(buf, sameBuf=0){
    if(!sameBuf) buf = O.Buffer.from(buf);

    const cs = O.sha256(buf);
    IO.xor(buf, cs, 1);
    buf = O.Buffer.concat([buf, cs]);

    return buf;
  }

  static unlock(buf, sameBuf=0){
    if(!sameBuf) buf = O.Buffer.from(buf);
    const err = () => { throw new TypeError('Invalid checksum'); };

    const len = buf.length;
    if(len < 32) err();

    const cs = O.Buffer.from(buf.slice(len - 32));

    buf = O.Buffer.from(buf.slice(0, len - 32));
    IO.xor(buf, cs, 1);

    if(!O.sha256(buf).equals(cs)) err();

    return buf;
  }

  static async unlocka(buf, sameBuf=0){
    if(!sameBuf) buf = O.Buffer.from(buf);
    const err = () => { throw new TypeError('Invalid checksum'); };

    const len = buf.length;
    if(len < 32) err();

    const cs = O.Buffer.from(buf.slice(len - 32));

    buf = O.Buffer.from(buf.slice(0, len - 32));
    await IO.xora(buf, cs, 1);

    if(!O.sha256(buf).equals(cs)) err();

    return buf;
  }

  static xor(buf, hash, sameBuf=0){
    if(!sameBuf) buf = O.Buffer.from(buf);
    const len = buf.length;

    for(let i = 0, j = 0; i !== len; i++, j++){
      buf[i] ^= hash[j];

      if(j === 32){
        hash = O.sha256(hash);
        j = -1;
      }
    }

    return buf;
  }

  static async xora(buf, hash, sameBuf=0){
    if(!sameBuf) buf = O.Buffer.from(buf);
    const len = buf.length;
    let cnt = 0;

    for(let i = 0, j = 0; i !== len; i++, j++){
      buf[i] ^= hash[j];

      if(j === 32){
        hash = O.sha256(hash);
        j = -1;
      }

      if(++cnt === 1e5){
        await O.waita(16);
        cnt = 0;
      }
    }

    return buf;
  }

  read(){
    const {input} = this;
    const i = this.inputIndex;

    if((i >> 4) >= input.length) return 0;
    this.inputIndex += this.pad ? 1 : 2;

    if((i & 1) === 0) return 1;
    return input[i >> 4] & (1 << ((i >> 1) & 7)) ? 1 : 0;
  }

  write(bit){
    this.byte |= bit << (this.outputIndex++ & 7);
    if((this.outputIndex & 7) === 0) this.addByte();
  }

  get hasMore(){
    return (this.inputIndex >> 4) < this.input.length;
  }

  addByte(){
    const len = this.outputIndex - 1 >> 3;

    if(len === this.output.length){
      const buf = O.Buffer.alloc(len);
      this.output = O.Buffer.concat([this.output, buf]);
    }

    this.output[len] = this.byte;
    this.byte = 0;
  }

  getOutput(checksum=0, encoding=null){
    if((this.outputIndex & 7) !== 0) this.addByte();

    const len = ceil(this.outputIndex / 8);
    let buf = O.Buffer.from(this.output.slice(0, len));
    if(checksum) buf = IO.lock(buf, 1);

    if(encoding !== null) buf = buf.toString(encoding);
    return buf;
  }
}

class Serializer extends IO{
  static #abuf = new ArrayBuffer(8);
  static #view = new DataView(this.#abuf);

  constructor(buf, checksum=0){
    super(buf, checksum);
  }

  write(num, max=1){
    num |= 0;
    max |= 0;
    if(max === 0) return;

    let mask = 1 << 31 - clz32(max);
    let limit = 1;

    while(mask !== 0){
      if(!limit || (max & mask)){
        let bit = num & mask ? 1 : 0;
        super.write(bit);
        if(!bit) limit = 0;
      }
      mask >>= 1;
    }

    return this;
  }

  read(max=1){
    max |= 0;
    if(max === 0) return 0;

    let mask = 1 << 31 - clz32(max);
    let limit = 1;
    let num = 0;

    while(mask !== 0){
      num <<= 1;
      if(!limit || (max & mask)){
        let bit = super.read();
        num |= bit;
        if(!bit) limit = 0;
      }
      mask >>= 1;
    }

    return num;
  }

  writeInt(num, signed=0){
    const snum = num;
    num = -~abs(num);

    while(num !== 1){
      super.write(1);
      super.write(num & 1);
      num >>= 1;
    }

    super.write(0);

    if(signed && snum !== 0)
      super.write(snum < 0);

    return this;
  }

  readInt(signed=1){
    let num = 0;
    let mask = 1;
    let len = 0;

    while(super.read()){
      if(super.read()) num |= mask;
      mask <<= 1;
    }

    num = ~-(num | mask);

    if(signed && num !== 0 && super.read())
      num = -num;

    return num;
  }

  writeUint(num){
    return this.writeInt(num, 0);
  }

  readUint(){
    return this.readInt(0);
  }

  writeFloat(f){
    const view = this.constructor.#view;
    view.setFloat32(0, f, 1);
    for(let i = 0; i !== 4; i++)
      this.write(view.getUint8(i), 255);
    return this;
  }

  readFloat(){
    const view = this.constructor.#view;
    for(let i = 0; i !== 4; i++)
      view.setUint8(i, this.read(255));
    return view.getFloat32(0, 1);
  }

  writeDouble(f){
    const view = this.constructor.#view;
    view.setFloat64(0, f, 1);
    for(let i = 0; i !== 8; i++)
      this.write(view.getUint8(i), 255);
    return this;
  }

  readDouble(){
    const view = this.constructor.#view;
    for(let i = 0; i !== 8; i++)
      view.setUint8(i, this.read(255));
    return view.getFloat64(0, 1);
  }

  writeBuf(buf){
    this.writeUint(buf.length);

    for(const byte of buf)
      this.write(byte, 255);

    return this;
  }

  readBuf(){
    const len = this.readUint();
    const buf = O.Buffer.alloc(len);

    for(let i = 0; i !== len; i++)
      buf[i] = this.read(255);

    return buf;
  }

  writeStr(str){
    return this.writeBuf(O.Buffer.from(str, 'utf8'));
  }

  readStr(){
    return this.readBuf().toString('utf8');
  }

  getOutput(checksum=0, encoding=null, trim=1){
    let buf = super.getOutput(checksum);
    let len = buf.length;

    if(trim && len !== 0 && buf[len - 1] === 0){
      let i = len - 1;
      for(; i !== -1; i--)
        if(buf[i] !== 0) break;
      buf = O.Buffer.from(buf.slice(0, i + 1));
    }

    if(encoding !== null) buf = buf.toString(encoding);
    return buf;
  }
}

class Serializable{
  ser(ser=new O.Serializer()){ O.virtual('ser'); }
  deser(ser){ O.virtual('deser'); }

  static deser(ser){ return new this().deser(ser); }
  reser(){ return this.deser(new O.Serializer(this.ser().getOutput())); }
}

class Semaphore{
  constructor(s=1){
    this.s = s;
    this.blocked = [];
  }

  init(s){
    this.s = s;
  }

  wait(){
    if(this.s > 0){
      this.s--;
      return Promise.resolve();
    }

    return new Promise(res => {
      this.blocked.push(res);
    });
  }

  signal(){
    const {blocked} = this;

    if(blocked.length === 0){
      this.s++;
      return;
    }

    setTimeout(blocked.shift());
  }
}

class AssertionError extends Error{
  constructor(){
    super();
    new Function('debugger')();
  }

  get name(){ return 'AssertionError'; }
}

const O = {
  global: null,
  isNode: null,
  isBrowser: null,
  isElectron: null,

  doc: document,
  head: document.head,
  body: document.body,

  pi: PI,
  pi2: PI * 2,
  pih: PI / 2,
  pi3: PI * 3,
  pi4: PI / 4,
  pi32: PI * 3 / 2,
  pi34: PI * 3 / 4,
  N: Infinity,

  get iw(){ return innerWidth; },
  get ih(){ return innerHeight; },

  static: Symbol('static'),
  project: null,
  storage: null,
  enhancedRNG: 0,
  fastSha256: 1,
  rseed: null,

  // Log

  log: null,
  displayBigIntsAsOrdinaryNumbers: 0,

  // Node modules

  nm: null,

  module: {
    cache: null,
    remaining: 0,
  },

  // URL

  baseURL: null,

  // Storage

  lst: null,
  sst: null,

  // Global data

  glob: Object.create(null),

  // Time simulation

  time: 0,
  animFrameCbs: [],

  // Symbols

  symbols: {
    enhanceRNG: Symbol('enhanceRNG'),
  },

  // Constructors

  ctors: {
    Set2D,
    AsyncMap2D,
    Map3D,
    Color,
    AsyncImageData,
    EventEmitter,
    AsyncGrid,
    MultidimensionalMap,
    EnhancedRenderingContext,
    Buffer,
    AsyncIterable,
    AsyncStringifiable,
    AsyncComparable,
    AsyncPriorityQueue,
    AsyncTreeNode,
    AsyncTree,
    AsyncAVLNode,
    AsyncAVLTree,
    IO,
    Serializer,
    Serializable,
    Semaphore,
    AssertionError,
  },

  init(loadProject=1){
    const CHROME_ONLY = 0;

    const {ctors} = O;
    Object.assign(O, ctors);

    O.glob = O.obj();

    const global = O.global = new Function('return this;')();
    const env = 'navigator' in global ? 'browser' : 'node';

    O.env = env;

    const isBrowser = O.isBrowser = env === 'browser';
    const isNode = O.isNode = env === 'node';
    const isElectron = O.isElectron = isBrowser && navigator.userAgent.includes('Electron');

    if(isBrowser){
      if(CHROME_ONLY && global.navigator.vendor !== 'Google Inc.')
        return O.error('Please use Chrome.');

      if(!isElectron){
        global.global = global;
        O.lst = window.localStorage;
        O.sst = window.sessionStorage;
      }

      let baseURL = O.href.match(/^[^\?]+/)[0];

      if(baseURL.endsWith('/'))
        baseURL = baseURL.slice(0, baseURL.length - 1);

      O.baseURL = baseURL;
    }

    if(isNode || isElectron){
      O.initNodeModules();
      O.Buffer = global.Buffer;
    }

    if(!global.isConsoleOverriden)
      O.overrideConsole();

    O.module.cache = O.obj();
    O.modulesPolyfill = O.modulesPolyfill();
    O.assert.fail = O.assertFail;

    // Syncify constructors
    {
      const header = O.ftext(`
        'use strict';

        const {
          PI, min, max, abs, floor,
          ceil, round, sqrt, sin, cos,
          atan, clz32,
        } = Math;
      `);

      for(const name of O.keys(ctors)){
        if(!name.startsWith('Async')) continue;

        const ctor = ctors[name];
        const nameNew = name.replace(/^Async/, '');
        const src = ctor.toString();

        const srcNew = src.
          replace(/^[^\r\n]+\bextends /, a => `${a}O.`).
          replace(/\bAsync([a-zA-z0-9]+)/g, (a, b) => b).
          replace(/\b(async|await)\b ?/g, '');

        const ctorNew = new Function(
          'O',
          `${header}\n\n${srcNew}\n\nreturn ${nameNew};`,
        )(O);

        ctors[nameNew] = ctorNew;
        O[nameNew] = ctorNew;
      }
    }

    if(loadProject){
      const mainProject = 'main';
      const project = O.project = O.urlParam('project');

      const loadProj = project => {
        O.project = project;

        if(!O.projectTest(O.project))
          return O.error(`Illegal project name ${JSON.stringify(O.ascii(O.project))}".`);

        O.req(`${O.baseURL}/projects/${O.project}/main`)//.catch(O.error);
      };

      if(O.project == null){
        O.rf(`/projects.txt`, (status, projects) => {
          if(status != 200) return O.error(`Failed to load projects list.`);

          projects = O.sortAsc(O.sanl(projects));

          if(projects.includes(mainProject))
            return loadProj(mainProject);

          O.title('Projects');

          projects.forEach((project, index, projects) => {
            O.ceLink(O.body, O.projectToName(project), `${O.baseURL}/?project=${project}`);
            if(index < projects.length - 1) O.ceBr(O.body);
          });
        });
      }else{
        loadProj(O.project);
      }
    }
  },

  initNodeModules(){
    O.nm = O.obj();
    const {nm} = O;

    [
      'fs',
      'path',
      'crypto',
      'zlib',
      'util',
      'http',
      'https',
      'net',
      'url',
      'events',
      'readline',
    ].forEach(name => {
      nm[name] = require(name);
    });
  },

  overrideConsole(){
    const {global, isNode, isElectron} = O;
    const nodeOrElectron = isNode || isElectron;

    let logOrig;

    if(O.isNode){
      const fs = require('fs');
      const fdOut = process.stdout.fd;

      logOrig = str => fs.writeSync(fdOut, `${str}\n`);
    }else{
      logOrig = console.log;
    }

    let indent = 0;

    const logFunc = (...args) => {
      if(args.length === 0){
        logOrig('');
        return;
      }

      const indentStr = ' '.repeat(indent << 1);

      if(nodeOrElectron){
        let str = O.inspect(args);

        str = O.sanl(str).map(line => {
          return `${indentStr}${line}`;
        }).join('\n');

        logOrig(str);
      }else{
        const as = indent !== 0 ? [indentStr, ...args] : args;
        logOrig(...as);
      }

      return O.last(args);
    };

    logFunc.inc = (...args) => {
      if(args.length !== 0) logFunc.apply(null, args);
      indent++;
      return O.last(args);
    };

    logFunc.dec = (...args) => {
      if(args.length !== 0) logFunc.apply(null, args);
      if(indent !== 0) indent--;
      return O.last(args);
    };

    logFunc.get = () => {
      return indent;
    };

    logFunc.set = i => {
      indent = i;
    };

    O.log = logFunc;
    global.log = logFunc;
    global.isConsoleOverriden = 1;

    const inspectOptions = nodeOrElectron ? require('util').inspect.defaultOptions : null;

    O.logf = (...args) => {
      if(!nodeOrElectron) return log(...args);

      const {depth} = inspectOptions;
      inspectOptions.depth = Number.MAX_SAFE_INTEGER;
      const result = log(...args);
      inspectOptions.depth = depth;

      return result;
    };

    O.logs = (...args) => {
      log(args.join(' '));
    };
  },

  logb(){
    log(`\n${'='.repeat(100)}\n`);
    if(O.isBrowser) log();
  },

  inspect(arr){
    if(!(O.isNode || O.isElectron))
      throw new TypeError('Function "inspect" is available only in Node.js and Electron');

    const {util} = O.nm;
    const fstStr = typeof arr[0] === 'string';

    let str = arr.map(val => {
      if(fstStr && typeof val === 'string') return val;
      return util.inspect(val);
    }).join(' ');

    if(O.displayBigIntsAsOrdinaryNumbers)
      str = str.replace(/\b(\d+)n\b/g, (a, b) => b);

    return str;
  },

  bion(val){
    O.displayBigIntsAsOrdinaryNumbers = val;
  },

  title(title){
    O.body.innerHTML = '';
    var h1 = O.ce(O.body, 'h1');
    O.ceText(h1, title);
  },

  error(err){
    if(O.isNode){
      process.exitCode = 1;

      if(typeof err === 'string')
        err = `ERROR: ${err}`;
      
      O.exit(err);
      return;
    }

    if(err instanceof Error) err = err.message;
    console.error(err);

    O.body.classList.remove('has-canvas');
    O.body.style.margin = '8px';
    O.body.style.background = '#ffffff';

    O.title('Error Occured');
    O.ceText(O.head, '');
    O.ceText(O.body, err);
    O.ceBr(O.body, 2);
    O.ceLink(O.body, 'Home Page', O.baseURL);
  },

  /*
    Project functions
  */

  upperCaseWords: ['fs', '2d', '3d'],

  projectToName(project){
    return project.split(/\-/g).map((word, index) => {
      if(O.shouldUpper(word)) word = word.toUpperCase();
      else if(index === 0) word = O.cap(word);

      return word;
    }).join(' ');
  },

  nameToProject(name){
    return name
      .replace(/\s./g, m => m[1].toUpperCase())
      .replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
  },

  shouldUpper(word){ return O.upperCaseWords.includes(word); },
  projectTest(project){ return /^[\!-\~]+$/.test(project); },

  /*
    URL functions
  */

  get href(){
    return window.location.href;
  },

  urlParam(param, defaultVal=null){
    var url = O.href;
    var match = url.match(new RegExp(`[\\?\\&]${param}=([^\\&]*)`));

    if(match === null){
      if(new RegExp(`[\\?\\&]${param}(?:\\&|$)`).test(url))
        match = '';
    }else{
      match = window.unescape(match[1]);
    }

    if(match === null) return defaultVal;
    return match;
  },

  /*
    DOM functions
  */

  ge(selector){
    return O.doc.getElementById(selector);
  },

  qs(parent, selector=null){
    if(selector === null){
      selector = parent;
      parent = O.doc;
    }

    return parent.querySelector(selector);
  },

  qsa(parent, selector=null){
    if(selector === null){
      selector = parent;
      parent = O.doc;
    }

    return parent.querySelectorAll(selector);
  },

  ce(parent, tag=null, classNames=null){
    if(tag === null) return O.doc.createElement(parent);

    const elem = O.doc.createElement(tag);

    if(parent !== null)
      parent.appendChild(elem);

    if(classNames !== null){
      if(typeof classNames === 'string')
        classNames = classNames.split(' ');

      classNames.forEach(className => {
        if(className === '')
          return;

        elem.classList.add(className);
      });
    }

    return elem;
  },

  ceDiv(parent, classNames){
    return O.ce(parent, 'div', classNames);
  },

  ceBr(parent, num=1){
    while(num--) O.ce(parent, 'br');
  },

  ceHr(parent, classNames){
    return O.ce(parent, 'hr', classNames);
  },

  ceText(parent, text){
    var t = O.doc.createTextNode(text);
    parent.appendChild(t);
    return t;
  },

  ceLink(parent, label, href, classNames){
    var link = O.ce(parent, 'a', classNames);
    link.href = href;
    if(!(label === null || label === '')) O.ceText(link, label);
    return link;
  },

  ceInput(parent, type, classNames){
    var input = O.ce(parent, 'input', classNames);
    input.type = type;
    if(type === 'text') input.autocomplete = 'off';
    return input;
  },

  ceRadio(parent, name, value, label=null, classNames){
    var radio = O.ceInput(parent, 'radio', classNames);
    radio.name = name;
    radio.value = value;
    if(!(label === null || label === '')) O.ceText(parent, label);
    return radio;
  },

  ceH(parent, type, text=null, classNames){
    var h = O.ce(parent, `h${type}`, classNames);
    if(!(text === null || text === '')) O.ceText(h, text);
    return h;
  },

  ceLabel(parent, text=null, classNames){
    var label = O.ce(parent, 'label', classNames);
    if(!(text === null || text === '')) O.ceText(label, text);
    return label;
  },

  ceCanvas(enhanced=0){
    O.body.classList.add('has-canvas');

    const w = O.iw;
    const h = O.ih;

    const canvas = O.ce(O.body, 'canvas');
    let g = canvas.getContext('2d');

    canvas.width = w;
    canvas.height = h;

    const {style} = canvas;
    style.position = 'absolute';
    style.left = '0px';
    style.top = '0px';

    g.fillStyle = 'white';
    g.strokeStyle = 'black';
    g.fillRect(0, 0, w, h);

    if(enhanced){
      g = new O.EnhancedRenderingContext(g);
    }else{
      g.textBaseline = 'middle';
      g.textAlign = 'center';
    }

    return {
      g, w, h,
      w1: w - 1,
      h1: h - 1,
      wh: w / 2,
      hh: h / 2,
      whn: w >> 1,
      hhn: h >> 1,
    };
  },

  addStyle(pth, local=1){
    if(local) pth = O.localPath(pth);
    const style = O.ce(O.head, 'style');
    
    return new Promise(res => {
      O.rf(pth, (a, b) => {
        style.innerHTML = b;
        res();
      });
    });
  },

  /*
    Request processing functions
  */

  urlTime(url){
    var char = url.indexOf('?') !== -1 ? '&' : '?';
    return `${url}${char}_=${O.now}`;
  },

  localPath(pth){
    return `${O.baseURL}/projects/${O.project}/${pth}`;
  },

  rf(file, isBinary, cb=null){
    if(cb === null){
      cb = isBinary;
      isBinary = 0;
    }

    var xhr = new window.XMLHttpRequest();

    if(isBinary){
      xhr.responseType = 'arraybuffer';
    }

    xhr.onreadystatechange = () => {
      if(xhr.readyState === 4){
        if(xhr.status === 200 && O.module.remaining !== 0)
          O.module.remaining--;

        if(isBinary)
          cb(xhr.status, O.Buffer.from(xhr.response));
        else
          cb(xhr.status, xhr.responseText);
      }
    };

    if(file.startsWith('/'))
      file = `${O.baseURL}${file}`;

    xhr.open('GET', O.urlTime(file));
    xhr.setRequestHeader('x-requested-with', 'XMLHttpRequest');
    xhr.send(null);
  },

  rfAsync(...args){
    return new Promise(res => {
      O.rf(...args, (status, code) => {
        if(status !== 200) return res(null);
        res(code);
      });
    });
  },

  rfLocal(file, isBinary, cb=null){
    if(cb === null){
      cb = isBinary;
      isBinary = 0;
    }

    O.rf(O.localPath(file), isBinary, cb);
  },

  async readFile(file){
    if(O.isNode || O.isElectron) return O.rfs(file, 1);
    return O.rfAsync(file);
  },

  async req(path){
    const {cache} = O.module;
    const pathOrig = path;

    let type = 0;
    let data = null;

    if(path in cache) return cache[path];

    if(/\.[^\/]+$/.test(path)){
      data = await O.rfAsync(path, path.endsWith('.hex'));
    }else if((data = await O.rfAsync(`${path}.js`)) !== null){
      type = 2;
      path += '.js';
      if(path in cache) return cache[path];
    }else if((data = await O.rfAsync(`${path}/index.js`)) !== null){
      type = 2;
      path += '/index.js';
      if(path in cache) return cache[path];
    }else if((data = await O.rfAsync(`${path}.json`)) !== null){
      type = 1;
      path += '.json';
      if(path in cache) return cache[path];
    }else if((data = await O.rfAsync(`${path}.txt`)) !== null){
      path += '.txt';
      if(path in cache) return cache[path];
    }else if((data = await O.rfAsync(`${path}.md`)) !== null){
      path += '.md';
      if(path in cache) return cache[path];
    }else if((data = await O.rfAsync(`${path}.glsl`)) !== null){
      path += '.glsl';
      if(path in cache) return cache[path];
    }else if((data = await O.rfAsync(`${path}.hex`, 1)) !== null){
      path += '.hex';
      if(path in cache) return cache[path];
    }else{
      throw new Error(`Cannot find ${O.sf(pathOrig)}`);
    }

    const pathMatch = path;
    path = path.split('/');
    path.pop();

    cache[pathOrig] = {};
    const module = {
      get exports(){ return cache[pathOrig]; },
      set exports(val){ cache[pathOrig] = val; }
    };

    switch(type){
      case 0: // Text
        module.exports = data;
        break;

      case 1: // JSON
        module.exports = JSON.parse(data);
        break;

      case 2: // JavaScript
        data = data.
          replace(/^const (?:O|debug) = require\(.+\s*/gm, '').
          replace(/ = require\(/g, ' = await require(');

        let func = null;

        const constructFunc = () => {
          return new Function(
            'window',
            'document',
            'Function',
            'O',
            'exports',
            'require',
            'module',
            '__filename',
            '__dirname',

            `return(async()=>{\n// ${pathOrig}\n\n${data}\n})();`,
          );
        };

        try{
          func = constructFunc();
        }catch(err){
          setTimeout(() => constructFunc());
          console.error(`Syntax error in ${O.sf(pathOrig)}`);
          throw err;
        }

        await func(
          window,
          document,
          Function,
          O,
          module.exports,
          require,
          module,
          pathMatch,
          path.join('/'),
        );
        break;
    }

    return module.exports;

    async function require(newPath){
      var resolvedPath;

      if(/^(?:\/|https?\:\/\/|[^\.][\s\S]*\/)/.test(newPath)){
        resolvedPath = newPath;
      }else if(newPath.startsWith('.')){
        var oldPath = path.slice();

        newPath.split('/').forEach(dir => {
          switch(dir){
            case '.': break;
            case '..': oldPath.pop(); break;
            default: oldPath.push(dir); break;
          }
        });

        resolvedPath = oldPath.join('/');
      }else{
        const mpf = O.modulesPolyfill;

        if(!O.has(mpf, newPath))
          throw new Error(`Unknown native module ${O.sf(newPath)}`);

        return mpf[newPath];
      }

      var exportedModule = await O.req(resolvedPath);

      return exportedModule;
    }
  },

  require(script, cb=O.nop){
    if(/\.js$/.test(script)){
      script = `/projects/${O.project}/${script}`;
    }else{
      script = `/projects/${script}/index.js`;
    }

    O.rf(script, false, (status, data) => {
      if(status !== 200)
        return O.error('Cannot load script.');

      var module = {
        exports: {}
      };

      var func = new Function('O', 'module', data);
      func(O, module);

      cb(module.exports);
    });
  },

  /*
    String functions
  */

  buff2ascii(buff){
    return [...buff].map(cc => {
      return O.sfcc(cc);
    }).join('');
  },

  ascii(str){
    return str.split('').map(char => {
      if(char >= ' ' && char <= '~') return char;
      return '?';
    }).join('');
  },

  sanl(str){
    return String(str).split(/\r\n|\r|\n/g);
  },

  sanll(str){
    return String(str).split(/\r\n\r\n|\r\r|\n\n/g);
  },

  pad(str, len, char='0'){
    str += '';
    if(str.length >= len) return str;
    return char.repeat(len - str.length) + str;
  },

  cap(str, lowerOthers=0){
    if(lowerOthers) str = str.toLowerCase();
    return `${str[0].toUpperCase()}${str.substring(1)}`;
  },

  gnum(noun, num){
    num = BigInt(num);

    if(num !== 1n){
      if(noun.endsWith('s')) noun += 'e';
      noun += 's';
    }

    const nstr = num !== 0n ? String(num) : 'no';

    return `${nstr} ${noun}`;
  },

  chars(start, len, arr=0){
    const cc = O.cc(start);

    if(typeof len === 'string')
      len = O.cc(len) - cc + 1;

    const array = O.ca(len, i => O.sfcc(cc + i));

    if(arr) return array;
    return array.join('');
  },

  ftext(str){
    let lines = O.sanl(str);
    if(lines.length !== 0 && /^\s*$/.test(lines[0])) lines.shift();
    if(lines.length !== 0 && /^\s*$/.test(O.last(lines))) lines.pop();

    const pad = lines
      .filter(line => line.trim().length !== 0)
      .reduce((pad, line, i) => min(pad, line.match(/^\s*/)[0].length), Infinity);

    return lines.map(line => line.slice(pad)).join('\n');
  },

  *exec(str, reg){
    while(1){
      const match = reg.exec(str);
      if(match === null) break;

      if(match[0].length === 0)
        throw new TypeError('Empty string match is not allowed');

      yield match;
    }
  },

  buf2bits(buf, pad=0){
    return Array.from(buf).map(byte => {
      const s = O.rev(byte.toString(2).padStart(8, '0'));
      return pad ? s.replace(/./g, a => `1${a}`) : s;
    }).join('');
  },

  str2bits(str, pad=0){
    return str.split('').map(char => {
      const s = O.rev(O.cc(char).toString(2).padStart(8, '0'));
      return pad ? s.replace(/./g, a => `1${a}`) : s;
    }).join('');
  },

  bits2buf(bits, pad=0){
    const reg = new RegExp(`[01]{${pad ? 16 : 8}}`, 'g');
    return O.Buffer.from(O.match(bits.replace(/[^01]/g, ''), reg).map(bits => {
      bits = pad ? O.match(bits, /[01]{2}/g).map(a => a[1]) : bits.split('');
      return parseInt(bits.reverse().join(''), 2);
    }));
  },

  bits2str(bits, pad=0){
    const reg = new RegExp(`[01]{${pad ? 16 : 8}}`, 'g');
    return O.match(bits.replace(/[^01]/g, ''), reg).map(bits => {
      bits = pad ? O.match(bits, /[01]{2}/g).map(a => a[1]) : bits.split('');
      return O.sfcc(parseInt(bits.reverse().join(''), 2));
    }).join('');
  },

  tokenize(str, tokens, firstMatch=1, throwOnError=0){
    const tlen = tokens.length;
    const len = tlen >> 1;
    const lastIndex = tlen - 1;

    const regs = [];
    const funcs = [];

    tokens.forEach((val, index) => {
      if((index & 1) === 1 || index === lastIndex){
        funcs.push(val);
        return;
      }

      const rstr = String(val);
      const reg = new RegExp(`^(?:${rstr.slice(1, rstr.length - 1)})`);
      regs.push(reg);
    });

    while(str !== ''){
      let match = null;
      let index = -1;

      for(let i = 0; i !== len; i++){
        const reg = regs[i];
        const m = str.match(reg);
        if(m === null) continue;

        if(m[0].length === 0)
          throw new TypeError('Empty string match is not allowed');

        if(firstMatch){
          match = [reg, m];
          index = i;
          break;
        }

        if(match === null || m[0].length > match[1][0].length){
          match = [reg, m];
          index = i;
        }
      }

      if(match === null){
        const i = str.search(/[\r\n]/);
        const s = i !== -1 ? str.slice(0, i) : str;

        if(throwOnError) throw new SyntaxError(`Invalid syntax near ${O.sf(s)}`);

        return O.last(funcs)(s, []);
      }

      const reg = match[0];
      const s = match[1][0];
      const groups = match[1].slice(1);
      funcs[index](s, groups);

      str = str.slice(s.length);
    }
  },

  indent(str, indent){ return `${' '.repeat(indent << 1)}${str}`; },
  setLineBreak(str, lineBreak){ return str.replace(/\r\n|\r|\n/g, lineBreak); },
  cr(str){ return O.setLineBreak(str, '\r'); },
  lf(str){ return O.setLineBreak(str, '\n'); },
  crlf(str){ return O.setLineBreak(str, '\r\n'); },
  rev(str){ return str.split('').reverse().join(''); },
  rept(arr, n){ return O.ca(arr.length * n, i => arr[i % arr.length]); },

  /*
    Array functions
  */

  ca(len, func=O.nop){
    const arr = [];

    for(let i = 0; i !== len; i++)
      arr.push(func(i, i / len, len));

    return arr;
  },

  async caa(len, func){
    const arr = [];

    for(let i = 0; i !== len; i++)
      arr.push(await func(i, i / len, len));

    return arr;
  },

  shuffle(arr){
    const len = arr.length;

    for(let i = 0; i !== len; i++){
      const j = i + O.rand(len - i);
      const t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }

    return arr;
  },

  flatten(arr){
    var a = [];

    arr = arr.slice();

    while(arr.length !== 0){
      var e = arr.shift();

      if(!O.isArr(e)){
        a.push(e);
        continue;
      }

      e.forEach((a, b) => arr.splice(b, 0, a));
    }

    return a;
  },

  arr2obj(arr, val=1){
    const obj = O.obj();
    for(const key of arr) obj[key] = val;
    return obj;
  },

  str2obj(str, val=1){
    const obj = O.obj();
    for(const char of str) obj[char] = val;
    return obj;
  },

  // For sets
  first(set, defaultVal=null){
    if(set.size === 0) return defaultVal;
    return set.keys().next().value;
  },

  // For arrays
  last(arr, defaultVal=null){
    if(arr.length === 0) return defaultVal;
    return arr[arr.length - 1];
  },

  setLast(arr, val){
    arr[arr.length - 1] = val;
    return arr;
  },

  fst(set, defaultVal){ return O.first(set, defaultVal); },
  isArr(val){ return Array.isArray(val); },

  /*
    Random number generator
  */

  enhanceRNG(sym){
    /*O.noimpl('enhanceRNG');

    if(sym !== O.symbols.enhanceRNG)
      throw new TypeError('Function "enhanceRNG" should not be called explicitly');*/

    O.enhancedRNG = 1;
    O.randState = O.Buffer.from(O.ca(32, () => Math.random() * 256));
    O.repeat(10, () => O.random());
  },

  randSeed(seed){
    this.rseed = seed | 0;
    O.randState = O.Buffer.alloc(0);
    O.repeat(10, () => O.random());
  },

  random(){
    if(!O.enhancedRNG)
      return Math.random();

    var st = O.randState;
    var val = read();

    if(O.rseed !== null){
      write(O.rseed);
    }else{
      write(O.now);
      write(Math.random() * 2 ** 64);
    }

    O.randState = O.sha256(st);
    return val / 2 ** 64;

    function read(){
      var val = st[7];
      for(var i = 6; i !== -1; i--)
        val = val * 256 + st[i];
      return val;
    }

    function write(val){
      st[0] ^= val;
      for(var i = 1; i !== 8; i++)
        st[i] ^= val /= 256;
    }
  },

  rand(a=2, b=null){
    if(b !== null) return a + (O.random() * (b - a + 1) | 0);
    return O.random() * a | 0;
  },

  randf(a=1, b=null){
    if(b !== null) return a + O.random() * (b - a);
    return O.random() * a;
  },

  randInt(start=0, prob=.5){
    let num = start;
    while(O.randf() < prob) num++;
    return num;
  },

  randInt2(min=0, max=Infinity){
    mainLoop: while(1){
      let num = -1;
      let n = 1;

      while(n !== 0){
        const a = O.rand(3);
        if(a === 0) n--;
        else if(a === 1) n++;
        if(++num > max) continue mainLoop;
      }

      if(num >= min) return num;
    }
  },

  randRad(radius){
    return O.randf(-radius, radius);
  },

  randDiam(diameter){
    const radius = diameter / 2;
    return O.randf(-radius, radius);
  },

  randElem(arr, splice=0, fast=0){
    const index = O.rand(arr.length);

    if(!splice) return arr[index];
    if(!fast) return arr.splice(index, 1)[0];

    const val = arr[index];
    const last = arr.pop();

    if(index !== arr.length) arr[index] = last;
    return val;
  },

  randBuf(len){
    const buf = O.Buffer.alloc(len);
    for(let i = 0; i !== len; i++)
      buf[i] = O.rand(256);
    return buf;
  },

  // Canvas functions

  fill(g, x, y, col){
    const {width: w, height: h} = g.canvas;
    if(x < 0 || y < 0 || x >= w || y >= h) return;

    const w1 = w - 1;
    const h1 = h - 1;

    const cNew = O.Color.col2rgb(col);
    if(cNew === null) throw new TypeError('Invalid color');

    const d = new O.ImageData(g);
    const cOld = O.Buffer.alloc(3);

    d.get(x, y, cOld);
    if(cNew.equals(cOld)) return;

    const cAux = O.Buffer.alloc(3);
    const stack = [x, y];
    const visited = new O.Set2D([stack]);

    while(stack.length !== 0){
      const y = stack.pop();
      const x = stack.pop();

      d.set(x, y, cNew);

      if(y !== 0 && !visited.has(x, y - 1)){
        visited.add(x, y - 1);
        d.get(x, y - 1, cAux);
        if(cAux.equals(cOld)) stack.push(x, y - 1);
      }

      if(x !== w1 && !visited.has(x + 1, y)){
        visited.add(x + 1, y);
        d.get(x + 1, y, cAux);
        if(cAux.equals(cOld)) stack.push(x + 1, y);
      }

      if(y !== h && !visited.has(x, y + 1)){
        visited.add(x, y + 1);
        d.get(x, y + 1, cAux);
        if(cAux.equals(cOld)) stack.push(x, y + 1);
      }

      if(x !== 0 && !visited.has(x - 1, y)){
        visited.add(x - 1, y);
        d.get(x - 1, y, cAux);
        if(cAux.equals(cOld)) stack.push(x - 1, y);
      }
    }

    d.put();
  },

  drawArc(g, ax, ay, bx, by, k){
    if(k === 0){
      g.lineTo(bx, by);
      return null;
    }

    const cx = (ax + bx) / 2, cy = (ay + by) / 2;
    let mx, my;

    if(ay !== by){
      const dx = cx + (ay - cy) / k;
      const dy = cy - (ax - cx) / k;
      const kcd = (dy - cy) / (dx - cx);
      mx = (
        (ax * ax + ay * ay - dx * dx - dy * dy) / 2 -
        (ay - dy) * (cy - kcd * cx)
      ) / (ax - dx + kcd * (ay - dy));
      my = kcd * (mx - cx) + cy;
    }else{
      const r = O.dist(ax, ay, cx, cy);
      if(ax > bx) k = 1 / k;
      mx = cx;
      my = cy + (k * k + 1) * r * r / (2 * k * r) - k * r;
    }

    const a1 = atan2(by - my, bx - mx);
    const a2 = atan2(ay - my, ax - mx);

    g.arc(mx, my, O.dist(mx, my, ax, ay), a2, a1, k < 0);

    return [mx, my];
  },

  drawStar(g, x, y, r1, r2, spikes, rot=0){
    const {sin, cos} = Math;
    const {pi2} = O;

    for(let i = 0; i !== spikes; i++){
      const angle1 = rot + (i / spikes) * pi2;
      const angle2 = rot + (i + .5) / spikes * pi2;

      g.lineTo(x + cos(angle1) * r2, y + sin(angle1) * r2);
      g.lineTo(x + cos(angle2) * r1, y + sin(angle2) * r1);
    }

    g.closePath();
  },

  drawPolygon(g, x, y, r, verts, rot=0){
    const {sin, cos} = Math;
    const {pi2} = O;

    for(let i = 0; i !== verts; i++){
      const angle = rot + i / verts * pi2;

      g.lineTo(x + cos(angle) * r, y + sin(angle) * r);
    }

    g.closePath();
  },

  // Other functions

  assert(...args){
    const len = args.length;

    if(len < 1 || len > 2)
      throw new TypeError(`Expected 1 or 2 arguments, but got ${len}`);

    if(!args[0]){
      let msg = `Assertion failed`;
      if(len === 2) msg += ` ---> ${args[1]}`;
      throw new O.AssertionError(msg);
    }
  },

  assertFail(...args){
    const len = args.length;

    if(len > 1)
      throw new TypeError(`Expected 0 or 1 argument, but got ${len}`);

    let msg = `Assertion failed`;
    if(len === 1) msg += ` ---> ${args[0]}`;
    throw new O.AssertionError(msg);
  },

  repeat(num, func){
    for(var i = 0; i !== num; i++)
      func(i, i / num, num);
  },

  async repeata(num, func){
    for(var i = 0; i !== num; i++)
      await func(i, i / num, num);
  },

  *repeatg(num, func){
    for(var i = 0; i !== num; i++)
      yield i;
  },

  iteratify(func){
    return {[Symbol.iterator]: func};
  },

  sleep(time=0){
    const t = O.now;
    while(O.now - t < time);
  },

  sleepa(time=0){
    return new Promise(res => {
      setTimeout(res, time);
    });
  },

  wait(time){ return O.sleep(time); },
  waita(time){ return O.sleepa(time); },

  async forEacha(arr, func){
    let i = 0;

    for(const elem of arr)
      await func(elem, i++, arr);
  },

  async mapa(arr, func){
    const arrNew = [];
    let i = 0;

    for(const elem of arr)
      arrNew.push(await func(elem, i++, arr));

    return arrNew;
  },

  async filtera(arr, func){
    const arrNew = [];
    let i = 0;

    for(const elem of arr)
      if(await func(elem, i++, arr))
        arrNew.push(elem);

    return arrNew;
  },

  async joina(arr, sep){
    return (await O.mapa(arr, a => a.toString())).join(sep);
  },

  bound(val, min, max){
    if(val < min) return min;
    if(val > max) return max;
    return val;
  },

  int(val, min=null, max=null){
    if(typeof val == 'object') val = 0;
    else val |= 0;
    if(min != null) val = O.bound(val, min, max);
    return val;
  },

  hsv(val, col=new Uint8Array(3)){
    const v = round((val % 1 + 1) % 1 * (256 * 6 - 1)) | 0;
    const h = v & 255;

    if(v < 256) col[2] = 0, col[0] = 255, col[1] = h;
    else if(v < 256 * 2) col[2] = 0, col[1] = 255, col[0] = 255 - h;
    else if(v < 256 * 3) col[0] = 0, col[1] = 255, col[2] = h;
    else if(v < 256 * 4) col[0] = 0, col[2] = 255, col[1] = 255 - h;
    else if(v < 256 * 5) col[1] = 0, col[2] = 255, col[0] = h;
    else col[1] = 0, col[0] = 255, col[2] = 255 - h;

    return col;
  },

  hsvx(val){
    if(val === 0) return O.hsv(0);
    while(val < 1 / 49) val *= 49;
    return O.hsv(val - 1 / 64);
  },

  dist(x1, y1, x2, y2){
    const dx = x2 - x1;
    const dy = y2 - y1;
    return sqrt(dx * dx + dy * dy);
  },

  dists(x1, y1, x2, y2){
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
  },

  distm(x1, y1, x2, y2){
    return abs(x2 - x1) + abs(y2 - y1);
  },

  enum(arr){
    const obj = O.obj();

    arr.forEach((name, index) => {
      obj[name] = index;
      obj[index] = name;
    });

    return obj;
  },

  await(func, timeout=0){
    return new Promise(res => {
      const test = async () => {
        if(await func()) return res();
        setTimeout(test, timeout);
      };

      test();
    });
  },

  while(func){
    return new Promise(res => {
      const test = async () => {
        if(await func()) return setTimeout(test);
        res();
      };

      test();
    });
  },

  commonProto(arr, calcProtos=1){
    if(arr.length === 0) return null;

    if(calcProtos) arr = arr.map(obj => O.proto(obj));
    if(arr.length === 1) return arr[0];

    return arr.reduce((prev, proto) => {
      if(prev === null || proto === null) return null;
      if(proto === prev) return prev;

      if(proto instanceof prev.constructor) return prev;
      if(prev instanceof proto.constructor) return proto;

      do{
        prev = O.proto(prev);
      }while(!(prev === null || proto instanceof prev.constructor));

      return prev;
    });
  },

  proxify(oldFunc, newFunc){
    return (...args) => {
      return newFunc(oldFunc, args);
    };
  },

  allKeys(obj){
    const arr = [];

    while(obj !== null){
      arr.unshift(O.keys(obj));
      obj = O.proto(obj);
    }

    return arr;
  },

  alias(obj, key, aliases){
    if(!O.isArr(aliases)) aliases = [aliases];

    const desc = O.desc(obj, key);
    for(const alias of aliases)
      Object.defineProperty(obj, alias, desc);

    return obj;
  },

  match(str, reg){
    const match = str.match(reg);
    if(match === null) return [];
    return match;
  },

  date(date=O.now){
    date = new Date(date);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');

    return `${day}.${month}.${year}. ${hour}:${minute}`;
  },

  perf(func){
    const t = O.now;
    func();
    log(((O.now - t) / 1e3).toFixed(3));
  },

  bool(val){ return Boolean(O.int(val)); },
  sortAsc(arr){ return arr.sort((elem1, elem2) => elem1 > elem2 ? 1 : elem1 < elem2 ? -1 : 0); },
  sortDesc(arr){ return arr.sort((elem1, elem2) => elem1 > elem2 ? -1 : elem1 < elem2 ? 1 : 0); },
  undupe(arr){ return arr.filter((a, b, c) => c.indexOf(a) === b); },
  obj(proto=null){ return Object.create(proto); },
  keys(obj){ return Reflect.ownKeys(obj); },
  cc(char, index=0){ return char.charCodeAt(index); },
  sfcc(cc){ return String.fromCharCode(cc); },
  hex(val, bytesNum){ return val.toString(16).toUpperCase().padStart(bytesNum << 1, '0'); },
  hypot(x, y){ return sqrt(x * x + y * y); },
  hypots(x, y){ return x * x + y * y; },
  hypotm(x, y){ return abs(x) + abs(y); },
  sf(val){ return JSON.stringify(val, null, 2); },
  sfa(arr){ return `[${arr.join(', ')}]`; },
  rev(str){ return str.split('').reverse().join(''); },
  has(obj, key){ return Object.hasOwnProperty.call(obj, key); },
  desc(obj, key){ return Object.getOwnPropertyDescriptor(obj, key); },
  nproto(obj){ return Object.assign(O.obj(), obj); },
  sem(s){ return new O.Semaphore(s); },

  proto(obj, n=1){
    while(n-- !== 0) obj = Object.getPrototypeOf(obj);
    return obj;
  },

  resObj(obj){
    const res = O.obj();
    for(const key of O.keys(obj)) res[key] = obj[key]();
    return res;
  },

  /*
    Math functions
  */

  isPrime(num){
    num = BigInt(num);
    if(num <= 1n) return 0;

    for(var i = 2n; i < num; i++)
      if(!(num % i))
        return 0;

    return 1;
  },

  nthPrime(index){
    if(index === 0) return 2n;
    
    let num = 2n;
    index++;

    while(index !== 0)
      if(O.isPrime(num++))
        index--;

    return num - 1n;
  },

  bisect(f){
    if(f(0n)) return 0n;

    let i = 0n;
    let j = 1n;

    while(!f(j)){
      i = j;
      j <<= 1n;
    }

    while(j - i !== 1n){
      const k = i + j >> 1n;

      if(f(k)) j = k;
      else i = k;
    }

    return j;
  },

  async bisecta(f){
    if(await f(0n)) return 0n;

    let i = 0n;
    let j = 1n;

    while(!(await f(j))){
      i = j;
      j <<= 1n;
    }

    while(j - i !== 1n){
      const k = i + j >> 1n;

      if(await f(k)) j = k;
      else i = k;
    }

    return j;
  },

  /*
    Time simulation
  */

  get now(){
    if(O.isElectron) return O.time;
    return Date.now();
  },

  raf(func){
    if(O.isElectron) O.animFrameCbs.push(func);
    else window.requestAnimationFrame(func);
    return func;
  },

  animFrame(){
    const cbs = O.animFrameCbs;
    const cbsCopy = cbs.slice();

    cbs.length = 0;
    for(const cb of cbsCopy) cb();
  },

  /*
    Node functions
  */

  rfs(file, str=0){ return O.nm.fs.readFileSync(file, str ? 'utf8' : null); },
  wfs(file, data){ return O.nm.fs.writeFileSync(file, data); },
  ext(file){ return O.nm.path.parse(file).ext.slice(1); },

  /*
    Modules polyfill
  */

  modulesPolyfill: (() => {
    const modules = {
      path: {
        normalize(p){
          return p.replace(/[\\]/g, '/');
        },

        join(...pths){
          return pths.reduce((p1, p2) => {
            p1 = p1.slice(p1.match(/[\/\\]*$/)[0].length);
            p2 = p2.slice(0, p2.length - p2.match(/^[\/\\]*/)[0].length);

            return p1.split(/[\/\\]/).
              concat(p2.split(/[\/\\]/)).
              join('/');
          });
        },
      },
    };

    return modules;
  }),

  /*
    Events
  */

  ael(target, type, func=null){
    if(func === null){
      func = type;
      type = target;
      target = window;
    }

    return target.addEventListener(type, func, {passive: 0});
  },

  rel(target, type, func=null){
    if(func === null){
      func = type;
      type = target;
      target = window;
    }

    return target.removeEventListener(type, func);
  },

  pd(evt, stopPropagation=0){
    evt.preventDefault();
    if(stopPropagation) evt.stopPropagation();
  },

  /*
    Errors
  */

  virtual(name, isStatic=0){
    let type = O.cap(`${isStatic ? 'static ' : ''}method`);
    throw new TypeError(`${type} ${O.sf(name)} is virtual`);
  },

  noimpl(...args){
    if(args.length > 1)
      throw new TypeError(`Expected 0 or 1 argument`);

    const msg = args.length === 1 ?
      `${O.sf(args[0])} is not implemented` :
      `Not implemented`;

    throw new Error(msg);
  },

  /*
    Algorithms
  */

  sha256: (() => {
    const MAX_UINT = 2 ** 32;

    var hhBase = null;
    var kkBase = null;

    return sha256;

    function sha256(data){
      if((O.isNode || O.isElectron) && O.fastSha256){
        var hash = O.nm.crypto.createHash('sha256');
        hash.update(data);
        return hash.digest();
      }

      return slowSha256(data);
    }

    function slowSha256(buff){
      if(!(buff instanceof O.Buffer))
        buff = new O.Buffer(buff);

      if(hhBase === null){
        hhBase = getArrH();
        kkBase = getArrK();
      }

      const hh = hhBase.slice();
      const kk = kkBase.slice();
      const w = new Uint32Array(64);

      getChunks(buff).forEach(chunk => {
        for(var i = 0; i !== 16; i++){
          w[i] = chunk.readUInt32BE(i << 2);
        }

        for(var i = 16; i !== 64; i++){
          var s0 = (rot(w[i - 15], 7) ^ rot(w[i - 15], 18) ^ (w[i - 15] >>> 3)) | 0;
          var s1 = (rot(w[i - 2], 17) ^ rot(w[i - 2], 19) ^ (w[i - 2] >>> 10)) | 0;

          w[i] = w[i - 16] + w[i - 7] + s0 + s1 | 0;
        }

        var [a, b, c, d, e, f, g, h] = hh;

        for(var i = 0; i !== 64; i++){
          var s1 = (rot(e, 6) ^ rot(e, 11) ^ rot(e, 25)) | 0;
          var ch = ((e & f) ^ (~e & g)) | 0;
          var temp1 = (h + s1 + ch + kk[i] + w[i]) | 0;
          var s0 = (rot(a, 2) ^ rot(a, 13) ^ rot(a, 22)) | 0;
          var maj = ((a & b) ^ (a & c) ^ (b & c)) | 0;
          var temp2 = (s0 + maj) | 0;

          h = g | 0;
          g = f | 0;
          f = e | 0;
          e = d + temp1 | 0;
          d = c | 0;
          c = b | 0;
          b = a | 0;
          a = temp1 + temp2 | 0;
        }

        [a, b, c, d, e, f, g, h].forEach((a, i) => {
          hh[i] = hh[i] + a | 0;
        });
      });

      return computeDigest(hh);
    }

    function getArrH(){
      var arr = firstNPrimes(8);

      arrPow(arr, 1 / 2);
      arrFrac(arr);

      return new Uint32Array(arr);
    }

    function getArrK(){
      var arr = firstNPrimes(64);

      arrPow(arr, 1 / 3);
      arrFrac(arr);

      return new Uint32Array(arr);
    }

    function getChunks(buff){
      var bits = buffToBits(buff);
      var len = bits.length;
      var k = getVarK(len);

      bits += '1' + '0'.repeat(k);

      var buffL = O.Buffer.alloc(8);
      buffL.writeUInt32BE(len / MAX_UINT, 0);
      buffL.writeUInt32BE(len % MAX_UINT, 4);

      bits += buffToBits(buffL);

      var chunks = (bits.match(/.{512}/g) || []).map(a => {
        return bitsToBuff(a);
      });

      return chunks;
    }

    function getVarK(len){
      for(var i = 0; i < 512; i++){
        if(!((len + i + 65) % 512)) return i;
      }
    }

    function computeDigest(a){
      var arr = [];
      var buff = O.Buffer.alloc(4);

      a.forEach(a => {
        buff.writeUInt32BE(a, 0);
        arr.push(buff[0], buff[1], buff[2], buff[3]);
      });

      return O.Buffer.from(arr);
    }

    function rot(a, b){
      return (a >>> b) | (a << 32 - b);
    }

    function arrPow(arr, pow){
      arr.forEach((a, i) => {
        a **= pow;
        arr[i] = a;
      });
    }

    function arrFrac(arr, bitsNum = 32){
      arr.forEach((a, i) => {
        a = a % 1 * 2 ** bitsNum;

        var bits = O.ca(bitsNum, i => {
          return !!(a & (1 << (bitsNum - i - 1))) | 0;
        }).join('');

        a = parseInt(bits, 2);

        arr[i] = a;
      });
    }

    function buffToBits(buff){
      return [...buff].map(byte => {
        return byte.toString(2).padStart(8, '0');
      }).join('');
    }

    function bitsToBuff(bits){
      return O.Buffer.from((bits.match(/\d{8}/g) || []).map(a => {
        return parseInt(a, 2);
      }));
    }

    function firstNPrimes(a){
      return O.ca(a, i => nthPrime(i + 1));
    }

    function nthPrime(a){
      for(var i = 1; a; i++){
        if(isPrime(i)) a--;
      }

      return i - 1;
    }

    function isPrime(a){
      if(a == 1) return false;

      for(var i = 2; i < a; i++){
        if(!(a % i)) return false;
      }

      return true;
    }
  })(),

  base64: (() => {
    const encode = (data, mode=0) => {
      const buf = O.Buffer.from(data);

      let str = '';
      let val = 0;

      buf.forEach((byte, i) => {
        switch(i % 3){
          case 0:
            str += char(byte >> 2, mode);
            val = (byte & 3) << 4;
            break;

          case 1:
            str += char((byte >> 4) | val, mode);
            val = (byte & 15) << 2;
            break;

          case 2:
            str += char((byte >> 6) | val, mode);
            str += char(byte & 63, mode);
            break;
        }
      });

      const m = buf.length % 3;

      if(m !== 0){
        str += char(val);
        if(mode === 0) str += '='.repeat(3 - m);
      }

      return str;
    };

    const decode = (str, mode=0) => {
      let length = (str.length >> 2) * 3;

      if(mode === 0){
        const pad = str.match(/\=*$/)[0].length;
        const extraBytes = pad !== 0 ? pad : 0;
        length -= extraBytes;
      }

      const len = length;
      const buf = O.Buffer.alloc(len);

      str += str;

      let j = 0;
      let val = 0;

      for(let i = 0; i !== len; i++){
        let byte = 0;

        switch(i % 3){
          case 0:
            byte = ord(str[j++], mode) << 2;
            val = ord(str[j++], mode);
            byte |= val >> 4;
            break;

          case 1:
            byte = val << 4;
            val = ord(str[j++], mode);
            byte |= val >> 2;
            break;

          case 2:
            byte = (val << 6) | ord(str[j++], mode);
            break;
        }

        buf[i] = byte;
      }

      return buf;
    };

    const char = (ord, mode) => {
      if(ord === 62) return mode ? '-' : '+';
      if(ord === 63) return mode ? '_' : '/';

      return O.sfcc(ord + (
        ord < 26 ? 65 :
        ord < 52 ? 71 :
        -4
      ));
    };

    const ord = (char, mode) => {
      if(char === (mode ? '-' : '+')) return 62;
      if(char === (mode ? '_' : '/')) return 63;

      const cc = O.cc(char);

      return cc + (
        cc < 65 ? 4 :
        cc < 97 ? -65 :
        -71
      );
    };

    return {encode, decode};
  })(),

  // Exceptions

  err(msg){
    O.exit(`ERROR: ${msg}`);
  },

  exit(...args){
    if(!(O.isNode || O.isElectron))
      throw new TypeError('Only Node.js and Electron processes can be terminated');

    if(args.length !== 0)
      log(...args);

    if(O.isNode) O.proc.exit();
    else setTimeout(() => window.close(), 500);
  },

  // Function which does nothing

  nop(){},
};

O.init();