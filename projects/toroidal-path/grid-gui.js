'use strict';

const SimpleGrid = require('./simple-grid');
const Vector = require('./vector');

class GridGUI{
  constructor(w, h, s, func=() => O.obj()){
    this.w = w;
    this.h = h;
    this.func = func;
    this.grid = new SimpleGrid(w, h, func);
    this.scale = s;

    const {g, w: iw, h: ih} = O.ceCanvas(1);
    const [iwh, ihh] = [iw, ih].map(a => a / 2);

    g.concaveMode = 1;

    this.g = g;
    this.iw = iw;
    this.ih = ih;
    this.iwh = iwh;
    this.ihh = ihh;

    this.transform();

    this.keys = O.obj();
    this.mbs = 0;
    this.cur = new Vector();

    this.funcs = {
      draw: [],
      frame: [],
    };

    this.wrap = 0;

    this.ls = O.obj();
    this.aels();
  }

  aels(){
    const btnName = btn => 'lmr'[btn];
    const {keys, cur} = this;

    O.ael('keydown', evt => {
      const key = evt.code;

      keys[key] = 1;
      this.emit(`k${key}`, cur.x, cur.y);
    });

    O.ael('keyup', evt => {
      const key = evt.code;

      keys[key] = 0;
      this.emit(`ku${key}`, cur.x, cur.y);
    });

    O.ael('mousedown', evt => {
      const btn = evt.button;

      this.mbs |= 1 << btn;
      this.updateCur(evt);

      this.emit(`${btnName(btn)}mb`, cur.x, cur.y);
    });

    O.ael('mousemove', evt => {
      const {mbs} = this;
      const {x, y} = cur;

      this.updateCur(evt);

      if(cur.x !== x || cur.y !== y){
        const dx = Math.sign(cur.x - x);
        const dy = Math.sign(cur.y - y);

        let xx = x, yy = y;
        let dir = dx === 1 ? 1 : 3;
        let prev;

        while(xx !== cur.x){
          prev = xx;
          xx += dx;

          this.emit('move', xx, yy);
          for(let btn = 0; btn !== 3; btn++)
            if(mbs & (1 << btn))
              this.emit(`drag${btnName(btn)}`, prev, yy, xx, yy, dir);
        }

        dir = dy === 1 ? 2 : 0;

        while(yy !== cur.y){
          prev = yy;
          yy += dy;

          this.emit('move', xx, yy);
          for(let btn = 0; btn !== 3; btn++)
            if(mbs & (1 << btn))
              this.emit(`drag${btnName(btn)}`, xx, prev, xx, yy, dir);
        }
      }
    });

    O.ael('mouseup', evt => {
      const btn = evt.button;

      this.mbs &= ~(1 << btn);
      this.updateCur(evt);

      this.emit(`${btnName(btn)}mbu`, cur.x, cur.y);
    });

    O.ael('blur', evt => {
      this.mbs = 0;
    });

    O.ael('contextmenu', evt => {
      evt.preventDefault();
      evt.stopPropagation();
    });
  }

  updateCur(evt){
    const {clientX: x, clientY: y} = evt;
    const {scale, g, cur} = this;

    cur.x = Math.floor((x - g.tx) / scale);
    cur.y = Math.floor((y - g.ty) / scale);
  }

  transform(){
    const {grid, g} = this;

    g.resetTransform();
    g.translate(this.iwh, this.ihh);
    g.scale(this.scale);
    g.translate(-grid.w / 2, -grid.h / 2);
  }

  tick(){
    this.emit('tick');
  }

  draw(){
    const {grid, g, funcs} = this;

    g.clearCanvas('darkgray');
    g.save();

    for(const drawf of funcs.draw){
      grid.iter((x, y, d) => {
        g.translate(x, y);
        drawf(g, d, x, y);
        g.restore();
      });
    }

    this.drawFrame();
  }

  drawTiles(tiles){
    const {grid, g, funcs, wrap} = this;

    g.save();

    for(const drawf of funcs.draw){
      for(let i = 0; i !== tiles.length; i += 2){
        const x = tiles[i];
        const y = tiles[i + 1];
        const d = grid.get(x, y);

        g.translate(x, y);
        drawf(g, d, x, y);
        g.restore();
      }
    }

    this.drawFrame();
  }

  drawFrame(){
    const {g, w, h, grid, wrap, funcs} = this;

    g.save();

    g.strokeStyle = '#000';
    g.beginPath();

    for(const framef of funcs.frame){
      grid.iter((x, y, d1) => {
        grid.adj(x, y, wrap, (xx, yy, d2, dir) => {
          if(dir === 3 && x !== 0) return;
          if(dir === 0 && y !== 0) return;
          if(!framef(g, d1, d2, x, y, dir)) return;

          switch(dir){
            case 0:
              g.moveTo(x, y);
              g.lineTo(x + 1, y);
              break;

            case 1:
              g.moveTo(x + 1, y);
              g.lineTo(x + 1, y + 1);
              break;

            case 2:
              g.moveTo(x, y + 1);
              g.lineTo(x + 1, y + 1);
              break;

            case 3:
              g.moveTo(x, y);
              g.lineTo(x, y + 1);
              break;
          }
        });
      });
    }

    g.stroke();
  }

  removeListener(type, func){
    const {ls} = this;
    if(!(type in ls)) return;
    ls[type].remove(func);
  }

  removeAllListeners(type){
    delete this.ls[type];
  }

  on(type, func){
    if(type === 'draw'){
      this.funcs.draw.push(func);
      return;
    }

    if(type === 'frame'){
      this.funcs.frame.push(func);
      return;
    }

    const {ls} = this;
    if(!(type in ls)) ls[type] = new Set();
    ls[type].add(func);
    return this;
  }

  emit(type, ...args){
    const {ls} = this;
    if(!(type in ls)) return;
    for(const func of ls[type])
      func(...args);
  }
}

module.exports = GridGUI;