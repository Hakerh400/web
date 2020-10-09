'use strict';

const Model = require('./model');
const Vector = require('./vector');

const {zero} = Vector;

const shapes = new Map();

class Shape{
  constructor(model, mat, scale=1, trans=zero(), rot=zero()){
    this.obj = null;
    this.index = -1;

    this.model = model;
    this.mat = mat;
    this.scale = scale;
    this.trans = trans;
    this.rot = rot;

    if(!shapes.has(model)) shapes.set(model, new Set());
    shapes.get(model).add(this);
  }

  static reset(){
    shapes.clear();
  }

  remove(){
    const {model} = this;
    const set = shapes.get(model);

    if(set.size === 1) shapes.delete(model);
    else set.delete(this);
  }
};

module.exports = Object.assign(Shape, {
  shapes,
});