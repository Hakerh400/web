'use strict';

const Vector = require('./vector');

class Ray extends Vector{
  constructor(x, y, z, rx, ry, rz){
    super(0, 0, 0);
    this.reset(x, y, z, rx, ry, rz);
  }

  reset(x, y, z, rx, ry, rz){
    const xx = Math.floor(x);
    const yy = Math.floor(y);
    const zz = Math.floor(z);

    this.x = xx;
    this.y = yy;
    this.z = zz;

    this.dx = x - xx;
    this.dy = y - yy;
    this.dz = z - zz;

    if(rx === 0) rx = Number.MIN_VALUE;
    if(ry === 0) ry = Number.MIN_VALUE;
    if(rz === 0) rz = Number.MIN_VALUE;

    this.rx = rx;
    this.ry = ry;
    this.rz = rz;

    this.arx = Math.abs(rx);
    this.ary = Math.abs(ry);
    this.arz = Math.abs(rz);

    this.ax = rx > 0;
    this.ay = ry > 0;
    this.az = rz > 0;

    this.sx = this.ax ? 1 : -1;
    this.sy = this.ay ? 1 : -1;
    this.sz = this.az ? 1 : -1;

    this.dir = 0;
  }

  move(){
    const {dx, dy, dz, rx, ry, rz, arx, ary, arz, ax, ay, az, sx, sy, sz} = this;

    const w = ax ? 1 - dx : dx;
    const h = ay ? 1 - dy : dy;
    const d = az ? 1 - dz : dz;

    if(arx * h > ary * w){
      if(arx * d > arz * w){
        // X

        this.x += sx;
        this.dx = ax ? 0 : 1;

        this.dy += w / arx * ry;
        if(this.dy < 0) this.dy++;
        else if(this.dy > 1) this.dy--;

        this.dz += w / arx * rz;
        if(this.dz < 0) this.dz++;
        else if(this.dz > 1) this.dz--;

        this.dir = ax ? 1 : -1;
      }else{
        // Z

        this.z += sz;
        this.dz = az ? 0 : 1;

        this.dx += d / arz * rx;
        if(this.dx < 0) this.dx++;
        else if(this.dx > 1) this.dx--;

        this.dy += d / arz * ry;
        if(this.dy < 0) this.dy++;
        else if(this.dy > 1) this.dy--;

        this.dir = az ? 3 : -3;
      }
    }else{
      if(ary * d > arz * h){
       // Y

       this.y += sy;
       this.dy = ay ? 0 : 1;

       this.dx += h / ary * rx;
       if(this.dx < 0) this.dx++;
       else if(this.dx > 1) this.dx--;

       this.dz += h / ary * rz;
       if(this.dz < 0) this.dz++;
       else if(this.dz > 1) this.dz--;

       this.dir = ay ? 2 : -2;
      }else{
        // Z

        this.z += sz;
        this.dz = az ? 0 : 1;

        this.dx += d / arz * rx;
        if(this.dx < 0) this.dx++;
        else if(this.dx > 1) this.dx--;

        this.dy += d / arz * ry;
        if(this.dy < 0) this.dy++;
        else if(this.dy > 1) this.dy--;

        this.dir = az ? 3 : -3;
      }
    }
  }
};

module.exports = Ray;