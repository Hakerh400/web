'use strict';

const {abs, sqrt, sin, cos, tan} = Math;

class Matrix extends Float32Array{
  static aux = Matrix.ident();

  constructor(arg){
    super(arg);
  }

  static zero(){
    return new Matrix(9);
  }

  static ident(){
    return new Matrix([
      1, 0, 0,
      0, 1, 0,
      0, 0, 1,
    ]);
  }

  static rot(rx, ry, rz, mat){
    const sx = sin(rx), cx = cos(rx);
    const sy = sin(ry), cy = cos(ry);
    const sz = sin(rz), cz = cos(rz);
    return Matrix.rotsc(sx, cx, sy, cx, sz, cz, mat);
  }

  static rotsc(sx, cx, sy, cy, sz, cz, mat=aux){
    mat[0] = cx * cz - cy * sx * sz;
    mat[1] = -cx * sz - cy * sx * cz;
    mat[2] = sx * sy;
    mat[3] = sx * cz + cy * cx * sz;
    mat[4] = -sx * sz + cy * cx * cz;
    mat[5] = -cx * sy;
    mat[6] = sz * sy;
    mat[7] = cz * sy;
    mat[8] = cy;
    return mat;
  }

  static rotnsc(sx, cx, sy, cy, sz, cz, mat){ return Matrix.rotsc(-sx, cx, -sy, cy, -sz, cz, mat); }
  static rotn(rx, ry, rz, mat){ return Matrix.rot(-rx, -ry, -rz, mat); }

  static projection(near, far, fov, aspectRatio){
    const fovt = tan(fov / 2);
    const dist = far - near;

    return new Matrix([
      1 / (aspectRatio * fovt), 0, 0, 0,
      0, 1 / fovt, 0, 0,
      0, 0, -(far + near) / dist, -1,
      0, 0, -2 * far * near / dist, 0,
    ]);
  }

  static rotv(v, mat){ return Matrix.rot(r.x, r.y, r.z, mat); }
  static rotnv(v, mat){ return Matrix.rotn(r.x, r.y, r.z, mat); }
};

const {aux} = Matrix;

module.exports = Matrix;

const Vector = require('./vector');