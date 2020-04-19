'use strict';

const {assert} = O;

await O.addStyle('style.css');

class Diagram{
  static instances = new Set();

  paused = 1;
  disposed = 0;
  scheduledRaf = 0;
  resizable = 0;
  #snapToWindow = 0;

  constructor(canvas){
    this.canvas = canvas;
    this.g = canvas.getContext('2d');

    this.rafBound = this.raf.bind(this);

    Diagram.instances.add(this);
  }

  get snapToWindow(){
    assert(!this.disposed);
    return this.#snapToWindow;
  }

  set snapToWindow(val){
    assert(!this.disposed);

    this.#snapToWindow = val;

    if(val) this.canvas.classList.add('snapToWindow');
    else this.canvas.classList.remove('snapToWindow');
  }

  start(){
    assert(!this.disposed);
    assert(this.paused);

    this.paused = 0;

    if(!this.scheduledRaf)
      this.scheduleRaf();
  }

  pause(){
    assert(!this.disposed);
    assert(!this.paused);

    this.paused = 1;
  }

  scheduleRaf(){
    assert(!this.disposed);
    assert(!this.paused);
    assert(!this.scheduledRaf);

    O.raf(this.rafBound);
    this.scheduledRaf = 1;
  }

  raf(){
    if(this.disposed) return;

    assert(this.scheduledRaf);
    this.scheduledRaf = 0;
    if(this.paused) return;

    const {canvas, g} = this;
    const {width: w, height: h} = canvas;

    if(this.#snapToWindow){
      const {iw, ih} = O;
      const {width, height} = canvas;
      
      if(width !== iw || height !== ih){
        canvas.width = iw;
        canvas.height = ih;
      }
    }

    g.fillStyle = 'black';
    g.fillRect(0, 0, w, h);
    g.fillStyle = 'red';
    g.fillRect(10, 10, w - 20, h - 20);

    this.scheduleRaf();
  }

  dispose(){
    const {instances} = Diagram;

    assert(!this.disposed);
    assert(instances.has(this));

    instances.delete(this);
    this.disposed = 1;
  }
}

module.exports = Diagram;