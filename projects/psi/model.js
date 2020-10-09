'use strict';

const path = require('path');

const LOADING_SPEED = 1e5;

const dd = 1e-3;

const modelNames = [
  'rock',
  'tree',
  'animal',
  'bot',
  'coin',
];

const cwd = __dirname;

class Model{
  constructor(verts, norms, tex){
    this.verts = verts;
    this.norms = norms;
    this.tex = tex;

    this.len = verts.length / 3 | 0;
  }

  static async init(){
    const speed = LOADING_SPEED;
    let cnt = 0;

    for(const name of modelNames){
      let buf1;
      if(O.isElectron){
        const file = path.join(cwd, './models', `${name}.hex`);
        buf1 = O.rfs(file);
      }else{
        const file = path.join('./models', `${name}.hex`);
        const buf2 = require(file);
        buf1 = buf2;
      }
      const buf = buf1;
      const ser = new O.Serializer(buf);
      const len = ser.readUint();
      const len1 = len - 1;

      const verts = new Float32Array(len * 3);
      const norms = new Float32Array(len * 3);
      const tex = new Float32Array(len * 2);

      for(const arr of [verts, norms, tex]){
        for(let i = 0; i !== arr.length; i++){
          arr[i] = ser.readFloat();

          if(++cnt === speed){
            cnt = 0;
          }
        }
      }

      const model = new Model(verts, norms, tex);

      const key = name.replace(/\-./g, a => a[1].toUpperCase());
      exported[key] = model;
    }
  }
};

class Rectangle extends Model{
  constructor(x1, y1, z1, w, d){
    const x2 = x1 + w;
    const z2 = z1 + d;
    const y = y1 + dd;

    const verts = new Float32Array([
      x1, y, z1, x2, y, z1, x2, y, z2,
      x2, y, z2, x1, y, z2, x1, y, z1,
    ]);

    const norms = new Float32Array([
      0, 1, 0, 0, 1, 0, 0, 1, 0,
      0, 1, 0, 0, 1, 0, 0, 1, 0,
    ]);

    const tex = new Float32Array([
      0, 0, 1, 0, 1, 1,
      1, 1, 0, 1, 0, 0,
    ]);

    super(verts, norms, tex);
  }
};

class Cuboid extends Model{
  constructor(x1, y1, z1, w, h, d, uv=1){
    const x2 = x1 + w;
    const y2 = y1 + h;
    const z2 = z1 + d;

    const verts = [];
    const norms = [];
    const tex = [];

    const verts1 = [
      x1, y2 - dd, z1, x2, y2 - dd, z1, x1, y2 - dd, z2, x2, y2 - dd, z2, // Top
      x1, y1 + dd, z1, x2, y1 + dd, z1, x1, y1 + dd, z2, x2, y1 + dd, z2, // Bottom
      x1, y1, z2 - dd, x2, y1, z2 - dd, x1, y2, z2 - dd, x2, y2, z2 - dd, // Left
      x1, y1, z1 + dd, x2, y1, z1 + dd, x1, y2, z1 + dd, x2, y2, z1 + dd, // Right
      x2 - dd, y1, z1, x2 - dd, y2, z1, x2 - dd, y1, z2, x2 - dd, y2, z2, // Front
      x1 + dd, y1, z1, x1 + dd, y2, z1, x1 + dd, y1, z2, x1 + dd, y2, z2, // Back
    ];

    const norms1 = [
      0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, // Top
      0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, // Bottom
      -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, // Left
      1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, // Right
      0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, // Front
      0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, // Back
    ];

    const sx = 1 / 4, sy = 1 / 3;
    const tex1 = !uv ? [
      1, 1, 0, 1, 1, 0, 0, 0, // Top
      1, 0, 0, 0, 1, 1, 0, 1, // Bottom
      0, 1, 1, 1, 0, 0, 1, 0, // Left
      1, 1, 0, 1, 1, 0, 0, 0, // Right
      1, 1, 1, 0, 0, 1, 0, 0, // Front
      0, 1, 0, 0, 1, 1, 1, 0, // Back
    ] : [
      2, 0, 2, 1, 1, 0, 1, 1, // Top
      2, 3, 2, 2, 1, 3, 1, 2, // Bottom
      0, 2, 1, 2, 0, 1, 1, 1, // Left
      3, 2, 2, 2, 3, 1, 2, 1, // Right
      2, 2, 2, 1, 1, 2, 1, 1, // Front
      3, 2, 3, 1, 4, 2, 4, 1, // Back
    ].map((a, b) => a * (b & 1 ? sy : sx));

    const inds = [
      0, 1, 2, 1, 2, 3, // Top
      4, 5, 6, 5, 6, 7, // Bottom
      8, 9, 10, 9, 10, 11, // Left
      12, 13, 14, 13, 14, 15, // Right
      16, 17, 18, 17, 18, 19, // Front
      20, 21, 22, 21, 22, 23, // Back
    ];

    for(const i of inds){
      let k;

      verts.push(verts1[k = i * 3], verts1[k + 1], verts1[k + 2]);
      norms.push(norms1[k = i * 3], norms1[k + 1], norms1[k + 2]);
      tex.push(tex1[k = i * 2], tex1[k + 1]);
    }

    super(
      new Float32Array(verts),
      new Float32Array(norms),
      new Float32Array(tex),
    );
  }
};

const models = {
  square: new Rectangle(-.5, -.5, -.5, 1, 1),
  cube: new Cuboid(-.5, -.5, -.5, 1, 1, 1, 0),
  cubeuv: new Cuboid(-.5, -.5, -.5, 1, 1, 1, 1),
};

const exported = module.exports = Object.assign(Model, {
  Rectangle,
  Cuboid,
}, models);