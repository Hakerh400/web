'use strict';

class Layer{
  constructor(pool, zIndex){
    this.pool = pool;
    this.zIndex = zIndex;

    const {w, h, fadeTime} = pool;
    this.w = w;
    this.h = h;
    this.fadeTime = fadeTime;

    const canvas = this.canvas = O.doc.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    this.g = canvas.getContext('2d');

    this.wasUsed = 1;

    this.init();
    this.prepare();
  }

  init(){}

  prepare(){
    const {w, h, g} = this;
    g.clearRect(0, 0, w, h);
  }

  draw(g){
    g.drawImage(this.canvas, 0, 0);
  }

  update(){
    if(this.wasUsed) this.fadeTime = this.pool.fadeTime;
    else this.fadeTime--;

    return this.fadeTime >= 0;
  }

  drawAndUpdate(g){
    this.draw(g);
    this.update();
  }

  resize(){
    const {pool, canvas} = this;

    this.w = canvas.width = pool.w;
    this.h = canvas.height = pool.h;

    this.init();
  }
}

module.exports = Layer;