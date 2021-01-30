'use strict';

const Grid = require('./grid');
const Tile = require('./tile');
const Object = require('./object');
const Event = require('./event');

const {isElectron} = O;
const isBrowser = !isElectron;

const SHOW_FPS = 0;

const CAM_FOLLOW_PLAYER = isElectron;
const EVENT_QUEUE_MAX_LEN = isBrowser ? 2 : Infinity;
const TICK_DURATION = isBrowser ? 100 : 500;

const {
  Navigate,
  Digit,
} = Event;

const {sign} = Math;

class RenderEngine{
  constructor(canvas, gridCtor){
    this.canvas = canvas;
    this.g = canvas.getContext('2d');
    this.grid = new gridCtor(this);

    this.cx = 0;
    this.cy = 0;
    this.curIn = 0;

    this.listeners = [];
    this.events = [];

    this.disposed = 0;
    this.aels();

    this.time = 0;
    this.animating = 0;
    this.tick = null;

    this.playerTile = null;

    this.renderBound = this.render.bind(this);
    O.raf(this.renderBound);

    this.fps = 0;
    this.fpsFactor = .5;
    this.fpsTime = O.now;
    this.fpsFramesNum = 0;
  }

  aels(){
    const {canvas, grid} = this;

    let clicked = 0;

    this.ael(window, 'keydown', evt => {
      const {target} = grid;
      const {code} = evt;

      if(/^Arrow/.test(code)){
        const dir = ['Up', 'Right', 'Down', 'Left'].findIndex(a => code.endsWith(a));
        this.addEvt(new Navigate(dir, 4, target));
        return;
      }

      if(/^Digit|Numpad/.test(code)){
        const digit = O.last(code) | 0;
        this.addEvt(new Digit(digit, target));
        return;
      }

      switch(code){
        case 'Enter':
          this.addEvt(new Event('tick', target));
          break;
      }
    });

    this.ael(window, 'mousemove', evt => {
      const {cx, cy, curIn} = this;
      this.updateCursor(evt);

      if(clicked && curIn && this.curIn){
        const dx = this.cx - cx;
        const dy = this.cy - cy;
        this.grid.drag(dx, dy);
      }
    });

    this.ael(window, 'mousedown', evt => {
      this.updateCursor(evt);

      const btn = evt.button;

      if(btn === 0) clicked = 1;
    });

    this.ael(window, 'mouseup', evt => {
      this.updateCursor(evt);

      const btn = evt.button;

      if(btn === 0) clicked = 0;
    });

    this.ael(window, 'wheel', evt => {
      this.updateCursor(evt);
      if(!this.curIn) return;

      const dir = sign(evt.deltaY);
      this.grid.zoom(dir);
    });

    this.ael(window, 'resize', evt => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });

    this.ael(window, 'contextmenu', evt => {
      O.pd(evt);
    });

    this.ael(window, 'blur', evt => {
      clicked = 0;
    });
  }

  ael(...args){
    this.listeners.push(args);
    O.ael(...args);
  }

  rels(){
    for(const args of this.listeners)
      O.rel(...args);
  }

  addEvt(evt){
    const {events} = this;
    events.push(evt);
    if(events.length > EVENT_QUEUE_MAX_LEN) events.shift();
  }

  updateCursor(evt){
    const {left, top, width: w, height: h} = this.brect;
    const {clientX: x, clientY: y} = evt;

    if(x >= left && y >= top && x < left + w && y < top + h){
      this.cx = x - left;
      this.cy = y - top;
      this.curIn = 1;
    }else{
      this.curIn = 0;
    }
  }

  get brect(){
    const brect = this.canvas.getBoundingClientRect();

    if(CAM_FOLLOW_PLAYER){
      this.cx = (brect.left + brect.width) / 2;
      this.cy = (brect.top + brect.height) / 2;
    }

    return brect;
  }

  render(){
    if(this.disposed) return;

    const {canvas, g, grid, events} = this;
    const t = O.now;
    let k = 0;

    main: {
      if(this.animating){
        const dt = t - this.time;
        k = dt / TICK_DURATION % 1;

        if(dt >= TICK_DURATION){
          this.animating = 0;
          grid.endAnim();
        }
      }else{
        if(events.length === 0){
          if(isBrowser) break main;

          if(this.playerTile === null)
            this.playerTile = grid.get(0, 0);

          const {playerTile} = this;
          const n = 100;

          while(1){
            let target = playerTile;
            O.repeat(n, () => target = target.adj(grid.rand(target.adjsNum)));
            if(target === playerTile) continue;

            const {has} = target;
            if(!has.ground || has.occupying) continue;

            const path = playerTile.findPath(n, (prev, tile, path) => {
              if(prev === null) return -1;

              const {has} = tile;
              if(!has.ground || has.occupying) return 0;

              if(tile === target) return 1;
              return -1;
            });

            if(path === null) continue;

            let d = playerTile;
            for(const dir of path){
              this.addEvt(new Navigate(dir, d.adjsNum));
              d = d.adj(dir);
            }

            this.playerTile = target;
            break;
          }
        }

        if(events.length === 0) break main;

        const evt = events.shift();
        const {type} = evt;

        this.tick = Symbol();

        if(CAM_FOLLOW_PLAYER && type === 'navigate'){
          const {dir, dmax} = evt;

          grid.txPrev = grid.tx;
          grid.tyPrev = grid.ty;

          if(dmax === 4){
            grid.txNext = grid.tx + (dir === 3 ? -1 : dir === 1 ? 1 : 0);
            grid.tyNext = grid.ty + (dir === 0 ? -1 : dir === 2 ? 1 : 0);
          }else if(dmax === 6){
            grid.txNext = grid.tx + (dir === 4 ? -1 : dir === 1 ? 1 : dir === 3 || dir === 5 ? -.5 : .5);
            grid.tyNext = grid.ty + (dir === 0 || dir === 5 ? -1 : dir === 2 || dir === 3 ? 1 : 0);
          }

          grid.trEnabled = 1;
        }

        if(type === 'tick'){
          if(!grid.tick(evt))
            break main;
        }else{
          if(!grid.emitAndTick(evt))
            break main;
        }

        this.time = t;
        this.animating = 1;
      }
    }

    grid.draw(g, t, k);

    if(SHOW_FPS){
      const fontSize = 64;
      const offset = 10;

      const timeCur = t;
      const timeDif = timeCur - this.fpsTime;

      this.fpsFramesNum++;

      if(timeDif > 500){
        const fpsCur = this.fpsFramesNum * 1e3 / timeDif;
        const fpsNew = this.fpsFactor * this.fps + (1 - this.fpsFactor) * fpsCur;

        this.fps = fpsNew;
        this.fpsTime = timeCur;
        this.fpsFramesNum = 1;
      }

      const str = String(Math.round(this.fps));

      g.save();
      g.resetTransform();

      g.font = `${fontSize}px arial`;
      g.fillStyle = 'black';
      g.textBaseline = 'top';
      g.textAlign = 'left';

      g.fillStyle = 'white';
      g.fillRect(0, 0, g.measureText(str).width + offset * 2, fontSize + offset * 2);

      g.fillStyle = 'black';
      g.fillText(str, offset, offset);

      g.restore();
    }

    O.raf(this.renderBound);
  }

  dispose(){
    this.disposed = 1;
    this.rels();
  }
}

module.exports = RenderEngine;