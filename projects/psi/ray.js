'use strict';

const O = require('../omikron');
const Vector = require('./vector');

const {pi, pi2, pi3} = O;

class Ray extends Vector{
  static aux = Ray.zero(0, 0, 0);

  constructor(x, y, z, rx, ry, rz){
    super(x, y, z);

    this.setr(rx, ry, rz);
  }

  static zero(){ return new Ray(0, 0, 0); }

  static from(r){
    return new Ray().setv(r);
  }

  static intp(r1, r2, k, dest=aux){
    const k1 = 1 - k;

    return dest.set(
      r1.x * k1 + r2.x * k,
      r1.y * k1 + r2.y * k,
      r1.z * k1 + r2.z * k,
      r1.rx + ((((((r2.rx - r1.rx) % pi2) + pi3) % pi2) - pi) * k) % pi2,
      r1.ry + ((((((r2.ry - r1.ry) % pi2) + pi3) % pi2) - pi) * k) % pi2,
      r1.rz + ((((((r2.rz - r1.rz) % pi2) + pi3) % pi2) - pi) * k) % pi2
    );
  }

  set(x, y, z, rx, ry, rz){
    this.setp(x, y, z);
    this.setr(rx, ry, rz);
    return this;
  }

  setp(x, y, z){
    return super.set(x, y, z);
  }

  setr(rx=0, ry=0, rz=0){
    this.rx = rx;
    this.ry = ry;
    this.rz = rz;
    return this;
  }

  rot(rx, ry, rz){ return this.setr(rx, ry, rz); }

  setv(r){ return this.set(r.x, r.y, r.z, r.rx, r.ry, r.rz); }
  setpv(v){ return this.setp(v.x, v.y, v.z); }
  setrv(v){ return this.setr(v.x, v.y, v.z); }
  rotv(v){ return this.rot(v.x, v.y, v.z); }
};

const {aux} = Ray;

module.exports = Ray;