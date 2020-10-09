'use strict';

const Vector = require('./vector');

class DiscreteRay extends Vector{
  constructor(x, y, z, px, py, pz){
    super(0, 0, 0);

    this.set(x, y, z, px, py, pz);
  }

  set(x, y, z, px, py, pz){
    const xx = Math.floor(x);
    const yy = Math.floor(y);
    const zz = Math.floor(z);

    this.x = xx;
    this.y = yy;
    this.z = zz;

    this.dx = x - xx;
    this.dy = y - yy;
    this.dz = z - zz;

    if(px === 0) px = Number.MIN_VALUE;
    if(py === 0) py = Number.MIN_VALUE;
    if(pz === 0) pz = Number.MIN_VALUE;

    this.px = px;
    this.py = py;
    this.pz = pz;

    this.apx = Math.abs(px);
    this.apy = Math.abs(py);
    this.apz = Math.abs(pz);

    this.ax = px > 0;
    this.ay = py > 0;
    this.az = pz > 0;

    this.sx = this.ax ? 1 : -1;
    this.sy = this.ay ? 1 : -1;
    this.sz = this.az ? 1 : -1;

    this.dir = 0;

    return this;
  }

  move(){
    const {dx, dy, dz, px, py, pz, apx, apy, apz, ax, ay, az, sx, sy, sz} = this;

    const w = ax ? 1 - dx : dx;
    const h = ay ? 1 - dy : dy;
    const d = az ? 1 - dz : dz;

    if(apx * h > apy * w){
      if(apx * d > apz * w){
        // X

        this.x += sx;
        this.dx = ax ? 0 : 1;

        this.dy += w / apx * py;
        if(this.dy < 0) this.dy++;
        else if(this.dy > 1) this.dy--;

        this.dz += w / apx * pz;
        if(this.dz < 0) this.dz++;
        else if(this.dz > 1) this.dz--;

        this.dir = ax ? 3 : 1;
      }else{
        // Z

        this.z += sz;
        this.dz = az ? 0 : 1;

        this.dx += d / apz * px;
        if(this.dx < 0) this.dx++;
        else if(this.dx > 1) this.dx--;

        this.dy += d / apz * py;
        if(this.dy < 0) this.dy++;
        else if(this.dy > 1) this.dy--;

        this.dir = az ? 0 : 2;
      }
    }else{
      if(apy * d > apz * h){
        // Y

        this.y += sy;
        this.dy = ay ? 0 : 1;

        this.dx += h / apy * px;
        if(this.dx < 0) this.dx++;
        else if(this.dx > 1) this.dx--;

        this.dz += h / apy * pz;
        if(this.dz < 0) this.dz++;
        else if(this.dz > 1) this.dz--;

        this.dir = ay ? 4 : 5;
      }else{
        // TODO: reduce duplication
        // Z

        this.z += sz;
        this.dz = az ? 0 : 1;

        this.dx += d / apz * px;
        if(this.dx < 0) this.dx++;
        else if(this.dx > 1) this.dx--;

        this.dy += d / apz * py;
        if(this.dy < 0) this.dy++;
        else if(this.dy > 1) this.dy--;

        this.dir = az ? 0 : 2;
      }
    }

    return this;
  }
};

module.exports = DiscreteRay;