'use strict';

class TilesGrid{
  constructor(g=null){
    this.isNode = O.env === 'node';
    this.bgEnabled = 1;

    this.w = 1;
    this.h = 1;
    this.s = 32;

    this.tileParams = [];
    this.drawFunc = O.nop;

    this.g = g !== null ? g : O.ceCanvas(1).g;

    this.iw = this.g.g.canvas.width;
    this.ih = this.g.g.canvas.height;
    this.iwh = this.iw / 2;
    this.ihh = this.ih / 2;

    this.resize();

    var tileParams = this.tileParams;

    this.Tile = class{
      constructor(params){
        tileParams.forEach((param, index) => {
          this[param] = params[index];
        });
      }
    };

    this.emptyFunc = () => [];
    this.d = [];
    this.create();
  }

  expandUp(resize){
    const {d, w, h, Tile} = this;
    d.unshift(O.ca(w, () => new Tile([0, 0, 0, 0])));
    this.setWH(w, h + 1, resize);
  }

  expandLeft(resize){
    const {d, w, h, Tile} = this;
    for(const row of d) row.unshift(new Tile([0, 0, 0, 0]));
    this.setWH(w + 1, h, resize);
  }

  expandDown(resize){
    const {d, w, h, Tile} = this;
    d.push(O.ca(w, () => new Tile([0, 0, 0, 0])));
    this.setWH(w, h + 1, resize);
  }

  expandRight(resize){
    const {d, w, h, Tile} = this;
    for(const row of d) row.push(new Tile([0, 0, 0, 0]));
    this.setWH(w + 1, h, resize);
  }

  collapseUp(resize){
    const {d, w, h, Tile} = this;
    d.shift();
    this.setWH(w, h - 1, resize);
  }

  collapseLeft(resize){
    const {d, w, h, Tile} = this;
    for(const row of d) row.shift();
    this.setWH(w - 1, h, resize);
  }

  collapseDown(resize){
    const {d, w, h, Tile} = this;
    d.pop();
    this.setWH(w, h - 1, resize);
  }

  collapseRight(resize){
    const {d, w, h, Tile} = this;
    for(const row of d) row.pop();
    this.setWH(w - 1, h, resize);
  }

  setWH(w, h, resize=1){
    this.w = w;
    this.h = h;
    this.wh = w / 2;
    this.hh = h / 2;
    if(resize) this.resize();
  }

  setSize(s){
    this.s = s;
    this.resize();
  }

  setTileParams(params){
    this.tileParams.length = [];
    params.forEach(param => this.tileParams.push(param));
  }

  setDrawFunc(func = O.nop){
    this.drawFunc = func;
  }

  updateIWH(){
    if(this.isNode) return;

    const {iw, ih} = O;
    if(this.iw == iw && this.ih == ih) return;

    this.iw = iw;
    this.ih = ih;
    this.iwh = iw / 2;
    this.ihh = ih / 2;

    const g = this.g.g;
    constcanvas = g.canvas;

    canvas.width = iw;
    canvas.height = ih;
  }

  create(func=this.emptyFunc){
    var d = this.d;
    d.length = this.h;
    d.fill(null);

    d.forEach((a, x) => {
      d[x] = O.ca(this.w, O.nop);
    });

    this.iterate((x, y) => {
      d[y][x] = new this.Tile(func(x, y));
    });
  }

  iterate(func){
    var {w, h, d, g} = this;
    var x, y;

    for(y = 0; y < h; y++){
      for(x = 0; x < w; x++){
        func(x, y, d[y][x], g);
      }
    }
  }

  resize(){
    this.updateIWH();

    var g = this.g;

    g.resetTransform();
    g.lineWidth = 1;

    g.fillStyle = 'white';
    g.fillRect(0, 0, this.iw, this.ih);

    var tx = this.iw - this.w * this.s >> 1;
    var ty = this.ih - this.h * this.s >> 1;

    g.translate(Math.max(tx, 0), Math.max(ty, 0));
    g.scale(this.s);

    if(this.bgEnabled){
      g.fillStyle = 'white';
      g.fillRect(0, 0, this.w, this.h);
    }

    g.textBaseline = 'middle';
    g.textAlign = 'center';
    g.font(this.s * .8);
  }

  draw(){
    this.iterate(this.drawFunc);
  }

  drawTile(x, y){
    this.drawFunc(x, y, this.d[y][x], this.g);
  }

  drawFrame(x, y, func = null){
    var g = this.g;
    var s1 = 1 / this.s + 1;

    if(func === null){
      g.beginPath();
      g.rect(x, y, 1, 1);
      g.stroke();
    }else{
      this.adjacent(x, y, (px, py, d1, dir) => {
        if(func(d1, dir)){
          switch(dir){
            case 0:
              g.beginPath();
              g.moveTo(x, y);
              g.lineTo(x + s1, y);
              g.stroke();
              break;
            case 1:
              g.beginPath();
              g.moveTo(x, y);
              g.lineTo(x, y + s1);
              g.stroke();
              break;
            case 2:
              g.beginPath();
              g.moveTo(x, y + 1);
              g.lineTo(x + s1, y + 1);
              g.stroke();
              break;
            case 3:
              g.beginPath();
              g.moveTo(x + 1, y);
              g.lineTo(x + 1, y + s1);
              g.stroke();
              break;
          }
        }
      });
    }
  }

  drawTube(x, y, dirs, size, round=0){
    let ds = dirs & 5;

    if(dirs & 2) ds |= 8;
    if(dirs & 8) ds |= 2;

    this.g.concaveMode = 1;
    this.g.drawTube(x, y, ds, size, round);
    this.g.concaveMode = 0;
  }

  get(x, y){
    var {w, h} = this;
    if(x < 0 || y < 0 || x >= w || y >= h) return null;
    return this.d[y][x];
  }

  adjacent(x, y, func){
    func(x, y - 1, this.get(x, y - 1), 0);
    func(x - 1, y, this.get(x - 1, y), 1);
    func(x, y + 1, this.get(x, y + 1), 2);
    func(x + 1, y, this.get(x + 1, y), 3);
  }
}

module.exports = TilesGrid;