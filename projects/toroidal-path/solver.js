'use strict';

const CoordsCollection = require('./coords-collection');
const Vector = require('./vector');

const COLORIZED = 0;

class Solver{
  constructor(gui){
    this.gui = gui;
    this.grid = gui.grid;
    this.gen = this.solve();

    this.active = 1;
    this.solved = 0;
  }

  *solve(){
    const {gui, grid} = this;

    const cc = new CoordsCollection();
    const v = new Vector();

    grid.iter((x, y, d) => {
      if(d.wall || !d.locked) return;
      cc.add(x, y);
    });

    while(cc.len()){
      cc.rand(v, 1);
      yield gui.emit('kSpace', v.x, v.y);
    }

    grid.iter((x, y, d) => {
      if(d.wall || !((1 << d.dirs) & 59520)) return;
      cc.add(x, y);
    });

    while(cc.len()){
      const {x, y} = cc.rand(v, 1);
      const d = grid.get(x, y);
      if(!((1 << d.dirs) & 59520)) continue;

      const dirs = [];

      for(let dir = 0; dir !== 4; dir++)
        if(d.dirs & (1 << dir))
          dirs.push(dir);

      while(dirs.length !== 2){
        const dir = O.randElem(dirs, 1);

        v.x = x, v.y = y;
        grid.nav(v, dir, 1);

        yield gui.emit('dragl', x, y, v.x, v.y, dir);
      }
    }

    grid.iter((x, y, d) => {
      if(d.wall || d.dirs) return;
      if(!grid.adj(x, y, 1, (x, y, d) => !(d.wall || d.dirs))) return;
      cc.add(x, y);
    });

    while(cc.len()){
      cc.rand(v, 1);

      while(1){
        const {x, y} = v;
        const dirs = [];

        grid.adj(x, y, 1, (x, y, d, dir) => {
          if(!(d.wall || d.dirs))
            dirs.push(dir);
        });

        if(dirs.length === 0) break;

        const dir = O.randElem(dirs);
        grid.nav(v, dir, 1);
        cc.del(v.x, v.y);

        yield gui.emit('dragl', x, y, v.x, v.y, dir);
      }
    }

    if(COLORIZED)
      yield gui.emit('kKeyW');

    grid.iter((x, y, d) => {
      if(d.wall || !((1 << d.dirs) & 279)) return;
      cc.add(x, y);
    });

    while(cc.len()){
      const {x, y} = cc.rand(v);

      const sx = x, sy = y;
      const sd = grid.get(x, y).dirs;

      const path = grid.path(x, y, 1, 0, (x, y, d, xp, yp, dir, wd, path, cs, cp) => {
        if(d.wall) return 0;

        {
          const i = cp.get(x, y);
          let {dirs} = d;

          if(i !== null){
            if(i !== 0) dirs ^= 1 << (path[i - 1] ^ 2);
            dirs ^= 1 << path[i];
          }

          if(path.length & 1) dirs ^= 15;
          if(!((1 << (dir ^ 2)) & dirs)) return 0;
        }
        
        if((1 << d.dirs) & 279){
          if((1 << (dir ^ 2)) & d.dirs) return 1;

          if(x === sx && y === sy){
            if(sd) return 0;
            if(dir === (path[0] ^ 2)) return 0;
          }

          return 2;
        }

        return 1;
      });

      if(!path) return;

      for(const dir of path){
        const {x, y} = v;
        grid.nav(v, dir, 1);

        yield gui.emit('dragl', x, y, v.x, v.y, dir);
      }

      if(!((1 << grid.get(x, y).dirs) & 279))
        cc.del(x, y);

      if(!((1 << grid.get(v.x, v.y).dirs) & 279))
        cc.del(v.x, v.y);
    }

    this.solved = 1;
  }

  move(){
    if(!this.active) return 0;

    if(this.gen.next().done){
      this.active = 0;
      return 0;
    }

    return 1;
  }
};

module.exports = Solver;