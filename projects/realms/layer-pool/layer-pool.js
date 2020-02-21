'use strict';

const Layer = require('./layer');

const DEFAULT_FADE_TIME = 100;

class LayerPool{
  constructor(w, h, layerCtor=Layer, fadeTime=DEFAULT_FADE_TIME){
    this.w = w;
    this.h = h;
    this.layerCtor = layerCtor;
    this.fadeTime = fadeTime;

    this.layers = [];
    this.map = O.obj();
  }

  get len(){
    return this.layers.length;
  }

  clear(){
    this.layers.length = 0;
  }

  createLayer(zIndex){
    const {initFunc, layers, map} = this;
    const len = layers.length;
    const layer = new this.layerCtor(this, zIndex);

    map[zIndex] = layer;

    for(let i = 0; i !== len; i++){
      if(layers[i].zIndex > zIndex){
        layers.splice(i, 0, layer);
        return layer;
      }
    }

    layers.push(layer);
    return layer;
  }

  getLayer(zIndex){
    const {map} = this;

    if(!(zIndex in map))
      return this.createLayer(zIndex);

    const layer = map[zIndex];

    if(!layer.wasUsed){
      layer.wasUsed = 1;
      layer.prepare();
    }

    return layer;
  }

  getLayerRaw(zIndex){
    const {map} = this;

    if(!(zIndex in map))
      return null;

    return map[zIndex];
  }

  getCtx(zIndex){
    return this.getLayer(zIndex).g;
  }

  prepare(){
    for(const layer of this.layers)
      layer.wasUsed = 0;
  }

  draw(g){
    for(const layer of this.layers)
      if(layer.wasUsed)
        layer.draw(g);
  }

  drawAndUpdate(g){
    this.draw(g);
    this.update();
  }

  update(){
    const {layers, map} = this;
    const len = layers.length;

    for(let i = len - 1; i !== -1; i--){
      const layer = layers[i];
      if(layer.update()) continue;

      layers.splice(i, 1);
      delete map[layer.zIndex];
    }
  }

  resize(w, h){
    if(this.w === w && this.h === h) return;

    this.w = w;
    this.h = h;

    for(const layer of this.layers)
      layer.resize();
  }
}

module.exports = Object.assign(LayerPool, {
  Layer,
});