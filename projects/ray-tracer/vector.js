'use strict';

class Vector{
  constructor(x, y, z){
    this.set_(x, y, z);
  }

  clone(){ return new Vector(this.x, this.y, this.z); }
  dist_(x, y, z){ return Math.sqrt((this.x - x) ** 2 + (this.y - y) ** 2 + (this.z - z) ** 2); }
  dists_(x, y, z){ return (this.x - x) ** 2 + (this.y - y) ** 2 + (this.z - z) ** 2; }
  distm_(x, y, z){ return Math.abs(this.x - x) + Math.abs(this.y - y) + Math.abs(this.z - z); }

  len(){ return this.dist_(0, 0, 0); }
  lens(){ return this.dists_(0, 0, 0); }
  lenm(){ return this.distm_(0, 0, 0); }

  setLen(len){ return this.mul(len / this.len()); }
  norm(){ return this.setLen(1); }

  set_(x, y, z){ this.x = x, this.y = y, this.z = z; return this; }
  add_(x, y, z){ this.x += x, this.y += y, this.z += z; return this; }
  sub_(x, y, z){ this.x -= x, this.y -= y, this.z -= z; return this; }

  mul(k){ this.x *= k, this.y *= k, this.z *= k; return this; }
  div(k){ if(k){ this.x /= k, this.y /= k, this.z /= k; } return this; }

  rot_(rx, ry, rz){
    const x = this.x, y = this.y, z = this.z;

    const sx = Math.sin(rx), cx = Math.cos(rx);
    const y1 = y * cx - z * sx, z1 = y * sx + z * cx;

    const sy = Math.sin(ry), cy = Math.cos(ry);
    const x2 = x * cy + z1 * sy, z2 = z1 * cy - x * sy;

    const sz = Math.sin(rz), cz = Math.cos(rz);
    this.x = x2 * cz - y1 * sz, this.y = x2 * sz + y1 * cz, this.z = z2;

    return this;
  }

  rotsc_(sx, cx, sy, cy, sz, cz){
    const x = this.x, y = this.y, z = this.z;
    const y1 = y * cx - z * sx, z1 = y * sx + z * cx;
    const x2 = x * cy + z1 * sy, z2 = z1 * cy - x * sy;

    this.x = x2 * cz - y1 * sz, this.y = x2 * sz + y1 * cz, this.z = z2;

    return this;
  }

  rotn_(rx, ry, rz){ return this.rot_(-rx, -ry, -rz); }
  rotnsc_(sx, cx, sy, cy, sz, cz){ return this.rotsc_(-sx, cx, -sy, cy, -sz, cz); }

  lt_(x, y, z){ return this.x < x && this.y < y && this.z < z; }
  gt_(x, y, z){ return this.x > x && this.y > y && this.z > z; }

  set(v){ return this.set_(v.x, v.y, v.z); }
  dist(v){ return this.dist_(v.x, v.y, v.z); }
  dists(v){ return this.dists_(v.x, v.y, v.z); }
  distm(v){ return this.distm_(v.x, v.y, v.z); }
  add(v){ return this.add_(v.x, v.y, v.z); }
  sub(v){ return this.sub_(v.x, v.y, v.z); }
  rot(v){ return this.rot_(v.x, v.y, v.z); }
  rotsc(v){ return this.rotsc_(v.x, v.y, v.z); }
  rotn(v){ return this.rotn_(v.x, v.y, v.z); }
  rotnsc(v){ return this.rotnsc_(v.x, v.y, v.z); }
  lt(v){ return this.lt_(v.x, v.y, v.z); }
  gt(v){ return this.gt_(v.x, v.y, v.z); }
};

module.exports = Vector;