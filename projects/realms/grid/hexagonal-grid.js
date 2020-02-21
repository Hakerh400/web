'use strict';

const LayerPool = require('../layer-pool');
const Grid = require('./grid');
const Tile = require('../tile');

const ZOOM_FACTOR = .9;
const DEFAULT_SCALE = 40;
const LINE_WIDTH = 1 / DEFAULT_SCALE;
const SPACING = 0.9875;

const {floor, ceil, round} = Math;

class HexagonalGrid extends Grid{
  #d = createObj();

  constructor(reng){
    super(reng);

    const {brect} = reng;
    this.pool = new LayerPool(brect.width, brect.height, Layer);

    this.tx = 0;
    this.ty = 0;
    this.scale = DEFAULT_SCALE;

    this.txPrev = this.tx;
    this.tyPrev = this.ty;
    this.txNext = this.tx;
    this.tyNext = this.ty;
    this.trEnabled = 0;
  }

  get type(){ return 'hexagonal'; }

  get target(){
    const {reng, tx, ty, scale} = this;
    const {width: w, height: h} = reng.brect;
    const wh = w / 2;
    const hh = h / 2;

    if(!reng.curIn) return null;

    const y = round(ty + (reng.cy - hh) / scale);
    const x = round(tx + (reng.cx - wh) / scale - (y & 1 ? .5 : 0));

    return this.get(x, y, 1);
  }

  draw(g, t, k){
    if(this.trEnabled){
      const k1 = 1 - k;
      const k2 = k;

      this.tx = this.txPrev * k1 + this.txNext * k2;
      this.ty = this.tyPrev * k1 + this.tyNext * k2;
    }

    const {reng, pool, tx, ty, scale, removedObjs} = this;
    const {width: w, height: h} = reng.brect;
    const wh = w / 2;
    const hh = h / 2;

    pool.resize(w, h);
    pool.prepare();

    const xx = -tx * scale + wh;
    const yy = -ty * scale + hh;

    g.fillStyle = 'black';
    g.fillRect(0, 0, w, h);

    const xStart = floor(tx - wh / scale) - 1;
    const yStart = floor(ty - hh / scale) - 1;
    const xEnd = xStart + ceil(w / scale) + 2;
    const yEnd = yStart + ceil(h / scale) + 2;

    const cs = [0, 0];
    let x = 0, y = 0;

    const getCoords = tile => {
      const {x, y} = tile;

      cs[0] = x + (y & 1 ? .5 : 0);
      cs[1] = y;

      return cs;
    };

    const drawObj = obj => {
      const {tile, layer, transitions} = obj;
      const trLen = transitions.length;
      const g = pool.getCtx(layer);

      ({x, y} = tile);

      g.resetTransform();
      g.translate(xx, yy);
      g.scale(scale, scale);

      if(trLen === 0){
        g.translate(x + (y & 1 ? .5 : 0), y);
      }else{
        if(obj.keepTranslation) g.translate(x, y);
        for(const tr of transitions)
          tr.apply(g, k, getCoords);
      }

      g.scale(SPACING, SPACING);

      if(obj.draw(g, t, k)){
        const g = pool.getCtx(layer - .5);

        g.resetTransform();
        g.translate(xx, yy);
        g.scale(scale, scale);

        if(trLen === 0){
          g.translate(x + (y & 1 ? .5 : 0), y);
        }else{
          if(obj.keepTranslation) g.translate(x, y);
          for(const tr of transitions)
            tr.apply(g, k, getCoords);
        }
        
        g.translate(.06, .06);
        g.scale(1.12, 1.12);
        g.beginPath();
        tile.border(g);
        g.fill();
      }
    };

    for(y = yStart; y <= yEnd; y++){
      for(x = xStart; x <= xEnd; x++){
        const tile = this.get(x, y);

        for(const obj of tile.objs)
          drawObj(obj);
      }
    }

    for(const obj of removedObjs)
      drawObj(obj);

    pool.draw(g);
  }

  drag(dx, dy){
    const {scale} = this;

    this.tx -= dx / scale;
    this.ty -= dy / scale;
  }

  zoom(dir){
    const {reng} = this;
    const {width: w, height: h} = reng.brect;
    const {cx, cy} = reng;
    const wh = w / 2;
    const hh = h / 2;

    const k = dir < 0 ? 1 / ZOOM_FACTOR : ZOOM_FACTOR;
    const sk = (k - 1) / (k * this.scale);

    this.tx += (cx - wh) * sk;
    this.ty += (cy - hh) * sk;
    this.scale *= k;
  }

  endAnim(){
    super.endAnim();

    if(this.trEnabled){
      this.tx = this.txNext;
      this.ty = this.tyNext;
      this.trEnabled = 0;
    }
  }

  has(x, y){
    let d = this.#d;
    if(!(y in d)) return 0;
    d = d[y];
    return x in d;
  }

  gen(x, y){
    let d = this.#d;
    let tile;

    if(!(y in d)) d = createKey(d, y);
    else d = d[y];

    if(x in d){
      tile = d[x];
      tile.removed = 0;
    }else{
      d.size++;
      tile = d[x] = new Tile.HexagonalTile(this, x, y);
      
      const odd = y & 1;
      let adj;

      if(adj = this.getRaw(odd ? x + 1 : x, y - 1, 1))  tile.setAdj(0, adj), adj.setAdj(3, tile);
      if(adj = this.getRaw(x + 1, y, 1))                tile.setAdj(1, adj), adj.setAdj(4, tile);
      if(adj = this.getRaw(odd ? x + 1 : x, y + 1, 1))  tile.setAdj(2, adj), adj.setAdj(5, tile);
      if(adj = this.getRaw(odd ? x : x - 1, y + 1, 1))  tile.setAdj(3, adj), adj.setAdj(0, tile);
      if(adj = this.getRaw(x - 1, y, 1))                tile.setAdj(4, adj), adj.setAdj(1, tile);
      if(adj = this.getRaw(odd ? x : x - 1, y - 1, 1))  tile.setAdj(5, adj), adj.setAdj(2, tile);
    }

    this.emit('gen', tile);
    return tile.update();
  }

  getRaw(x, y, includeRemoved=0){
    let d = this.#d;

    if(!(y in d)) return null;
    d = d[y];
    if(!(x in d)) return null;
    
    const tile = d[x];
    if(!includeRemoved && tile.removed) return null;
    return tile;
  }

  get(x, y){
    let d = this.#d;

    if(!(y in d)) return this.gen(x, y);
    d = d[y];
    if(!(x in d)) return this.gen(x, y);
    
    const tile = d[x];
    if(tile.removed) return this.gen(x, y);
    return tile;
  }
}

class Layer extends LayerPool.Layer{
  constructor(pool, zIndex){
    super(pool, zIndex);
  }

  init(){
    const {g} = this;

    const isShadow = this.isShadow = this.zIndex % 1 !== 0;
    g.lineWidth = LINE_WIDTH;

    g.textBaseline = 'middle';
    g.textAlign = 'center';
    g.font = `.8px arial`;

    if(isShadow)
      g.fillStyle = '#000';
  }

  prepare(){
    const {w, h, g} = this;

    g.resetTransform();
    g.clearRect(0, 0, w, h);

    this.wasUsed = 1;
  }

  draw(g){
    if(this.isShadow){
      g.globalAlpha = .5;
      super.draw(g);
      g.globalAlpha = 1;
    }else{
      super.draw(g);
    }
  }
}

const createObj = () => {
  const obj = O.obj();
  obj.size = 0;
  return obj;
};

const createKey = (obj, key) => {
  obj.size++;
  const obj1 = obj[key] = createObj();
  return obj1;
};

module.exports = Object.assign(HexagonalGrid, {
  Layer,
});