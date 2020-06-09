'use strict';

class SimpleGrid{
  constructor(w, h, func=null, d=null){
    this.w = w;
    this.h = h;

    if(d === null){
      d = O.ca(h, y => {
        return O.ca(w, x =>{
          if(func === null) return O.obj();
          return func(x, y);
        });
      });
    }

    this.d = d;
  }

  iter(func){
    const {w, h} = this;

    for(let y = 0; y !== h; y++)
      for(let x = 0; x !== w; x++)
        func(x, y, this.get(x, y));
  }

  iterate(func){
    this.iter(func);
  }

  some(func){
    const {w, h} = this;

    for(let y = 0; y !== h; y++)
      for(let x = 0; x !== w; x++)
        if(func(x, y, this.get(x, y)))
          return 1;

    return 0;
  }

  find(v, func){
    const {w, h} = this;

    for(let y = 0; y !== h; y++){
      for(let x = 0; x !== w; x++){
        if(func(x, y, this.get(x, y))){
          v.x = x;
          v.y = y;
          return 1;
        }
      }
    }

    return 0;
  }

  count(func){
    const {w, h} = this;
    let num = 0;

    for(let y = 0; y !== h; y++)
      for(let x = 0; x !== w; x++)
        if(func(x, y, this.get(x, y)))
          num++;

    return num;
  }

  iterAdj(x, y, wrap, func=null){
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

      this.adj(x, y, wrap, (x1, y1, d, dir, wrapped) => {
        if(d === null) return;
        if(queued.has(x1, y1)) return;
        if(visited.has(x1, y1)) return;

        if(func(x1, y1, d, x, y, dir, wrapped)){
          queue.push(x1, y1);
          queued.add(x1, y1);
        }
      });
    }
  }

  adj(x, y, wrap, func=null){
    const {w, h} = this;

    if(func === null){
      func = wrap;
      wrap = 0;
    }

    let wd = 0;

    return (
      func(x, (wd = wrap && y === 0) ? h - 1 : y - 1, this.get(x, y - 1, wrap), 0, wd) ||
      func((wd = wrap && x === w - 1) ? 0 : x + 1, y, this.get(x + 1, y, wrap), 1, wd) ||
      func(x, (wd = wrap && y === h - 1) ? 0 : y + 1, this.get(x, y + 1, wrap), 2, wd) ||
      func((wd = wrap && x === 0) ? w - 1 : x - 1, y, this.get(x - 1, y, wrap), 3, wd)
    );
  }

  adjc(x, y, wrap, func=null){
    const {w, h} = this;

    if(func === null){
      func = wrap;
      wrap = 0;
    }

    return (
      func(wrap && x === 0 ? w - 1 : x - 1, wrap && y === 0 ? h - 1 : y - 1, this.get(x - 1, y - 1, wrap), 0) ||
      func(wrap && x === w - 1 ? 0 : x + 1, wrap && y === 0 ? h - 1 : y - 1, this.get(x + 1, y - 1, wrap), 1) ||
      func(wrap && x === 0 ? w - 1 : x - 1, wrap && y === h - 1 ? 0 : y + 1, this.get(x - 1, y + 1, wrap), 2) ||
      func(wrap && x === w - 1 ? 0 : x + 1, wrap && y === h - 1 ? 0 : y + 1, this.get(x + 1, y + 1, wrap), 3)
    );
  }

  findAdj(x, y, wrap, func=null){
    const {w, h} = this;

    if(func === null){
      func = wrap;
      wrap = 0;
    }

    let dir = 0;
    let wd;

    const found = (
      func(x, (wd = wrap && y === 0) ? h - 1 : y - 1, this.get(x, y - 1, wrap), dir++, wd) ||
      func((wd = wrap && x === w - 1) ? 0 : x + 1, y, this.get(x + 1, y, wrap), dir++, wd) ||
      func(x, (wd = wrap && y === h - 1) ? 0 : y + 1, this.get(x, y + 1, wrap), dir++, wd) ||
      func((wd = wrap && x === 0) ? w - 1 : x - 1, y, this.get(x - 1, y, wrap), dir++, wd)
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

  path(xs, ys, wrap=null, all=null, func=null){
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

      if(this.adj(x, y, wrap, (x1, y1, d, dir, wrapped) => {
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

        switch(func(x1, y1, d, x, y, dir, wrapped, p, c, cp)){
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

  findPath(x, y, wrap, all, func){
    this.path(x, y, wrap, all, func);
  }

  get(x, y, wrap=0){
    const {w, h} = this;

    if(!this.includes(x, y)){
      if(!wrap) return null;
      x = ((x % w) + w) % w;
      y = ((y % h) + h) % h;
    }

    return this.d[y][x];
  }

  set(x, y, val, wrap=0){
    const {w, h} = this;

    if(!this.includes(x, y)){
      if(!wrap) return null;
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

module.exports = SimpleGrid;