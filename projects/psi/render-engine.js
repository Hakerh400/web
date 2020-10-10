'use strict';

const path = require('path');
const Camera = require('./camera');
const Grid = require('./grid');
const Tile = require('./tile');
const Object = require('./object');
const Shape = require('./shape');
const Material = require('./material');
const Model = require('./model');
const Matrix = require('./matrix');
const DiscreteRay = require('./discrete-ray');
const Ray = require('./ray');
const Vector = require('./vector');
const LS = require('./local-strings');

const cwd = __dirname;

let vsSrc1, fsSrc1;
if(O.isElectron){
  vsSrc1 = O.rfs(path.join(cwd, './shaders/vs.glsl'), 1);
  fsSrc1 = O.rfs(path.join(cwd, './shaders/fs.glsl'), 1);
}else{
  const vsSrc2 = require('./shaders/vs.glsl');
  const fsSrc2 = require('./shaders/fs.glsl');
  vsSrc1 = vsSrc2;
  fsSrc1 = fsSrc2;
}
const vsSrc = vsSrc1;
const fsSrc = fsSrc1;

const FOV = O.pi / 3;
const NEAR = 1e-3;
const FAR = 1e3;
const CURSOR_SPEED = 3;
const SUNLIGHT_DIR = new Vector(0, -100, 50).norm();
const TICK_TIME = 1e3;

const DISPLAY_FPS = 0;
const THUMBNAIL_SIZE = 32;
const QUICK_ACCESS_NUM = 9;
const INVENTORY_ROWS = 5;

const rengSem = new O.Semaphore(1);

// TODO: remove O.z from all scripts

const {min, max, abs, sin, cos} = Math;

class RenderEngine extends O.EventEmitter{
  constructor(div, width, height, compData=null){
    super();

    this.div = div;
    this.compData = compData;

    const w = this.w = width;
    const h = this.h = height;
    [this.wh, this.hh] = [w, h].map(a => a >> 1);

    const canvas3D = this.canvas3D = this.createCanvas();
    const canvas2D = this.canvas2D = this.createCanvas();

    const g = this.g = canvas2D.getContext('2d');

    const gl = this.gl = canvas3D.getContext('webgl2', {
      alpha: false,
      preserveDrawingBuffer: true,
    });

    this.attribs = {};
    this.uniforms = {};

    this.bufs = {
      vBuf: gl.createBuffer(),
      nBuf: gl.createBuffer(),
      texBuf: gl.createBuffer(),
    };

    this.aspectRatio = w / h;

    this.cam = new Camera(-3, 7, -3, O.pi / 6, O.pi34, 0);

    this.speed = .1;
    this.dir = 0;

    this.cursorLocked = 0;
    this.curAction = -1;

    this.camRot = Matrix.ident();
    this.objRot = Matrix.ident();

    O.enhancedRNG = 0;
    this.grid = new Grid(this);

    this.renderBound = this.render.bind(this);

    // TODO: Implement this in a better way (don't use `O.z`)
    this.tt = O.now;
    this.sum = 0;
    this.num = 0;

    this.active = 0;
    this.awaitingPause = 0;
    this.disposed = 0;

    this.timePrev = 0;
    this.timeDiff = 0;

    this.listeners = [];
    this.scrollOffsets = [];
    this.cur = new Vector();
    this.mbutton = -1;

    this.hudVisible = 1;
    this.quickAccessIndex = 0;
    this.inventoryVisible = 0;
    this.inventory = O.ca(QUICK_ACCESS_NUM, () => null);
    this.inventoryOffset = 0;
    this.inventoryItem = null;

    this.initialized = 0;
  }

  async init(){
    const {gl} = this;

    await rengSem.wait();
    this.initCanvas();

    await Material.init(this, () => {
      return gl.createTexture();
    }, (tex, img) => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);
    });

    await Model.init();

    this.initGrid();
    this.aels();

    this.initialized = 1;
  }

  initCanvas(){
    const {gl, w, h, aspectRatio, attribs, uniforms} = this;

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const col = 169 / 255;
    gl.viewport(0, 0, w, h);
    gl.clearColor(col, col, col, 1.);

    const vShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vShader, vsSrc);
    gl.compileShader(vShader);
    if(!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)){
      console.error(`[${'VERTEX'}] ${gl.getShaderInfoLog(vShader)}`);
      return;
    }

    const fShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fShader, fsSrc);
    gl.compileShader(fShader);
    if(!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)){
      console.error(`[${'FRAGMENT'}] ${gl.getShaderInfoLog(fShader)}`);
      return;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    gl.enableVertexAttribArray(attribs.v = gl.getAttribLocation(program, 'v'));
    gl.enableVertexAttribArray(attribs.n = gl.getAttribLocation(program, 'n'));
    gl.enableVertexAttribArray(attribs.tex = gl.getAttribLocation(program, 'tex'));

    uniforms.camTrans = gl.getUniformLocation(program, 'camTrans');
    uniforms.camRot = gl.getUniformLocation(program, 'camRot');
    uniforms.objRotation = gl.getUniformLocation(program, 'objRotation');
    uniforms.projection = gl.getUniformLocation(program, 'projection');
    uniforms.scale = gl.getUniformLocation(program, 'scale');
    uniforms.lightDir = gl.getUniformLocation(program, 'lightDir');
    uniforms.calcLight = gl.getUniformLocation(program, 'calcLight');

    gl.uniformMatrix4fv(uniforms.projection, false, Matrix.projection(NEAR, FAR, FOV, aspectRatio));
    gl.uniform3f(uniforms.lightDir, ...SUNLIGHT_DIR);
  }

  initGrid(){
    const {grid} = this;
    const cs = Object.ctors;

    const n = 20;
    O.repeat(2, y => {
      O.repeat(n, z => O.repeat(n, x => {
        const d = grid.get(x, y, z);

        if(!y) return new cs.Dirt(d);
        if((x || z) && O.rand(20) === 0){
          if(O.rand(5) === 0) new cs.Rock(d);
          else new cs.Coin(d);
        }
      }));
    });

    if(O.isElectron){
      for(const user of this.compData.users){
        while(1){
          const pos = new Vector(O.rand(n), 1, O.rand(n));
          const d = grid.getv(pos);
          if(d.has.bot) continue;

          const bot = new cs.Bot(d.purge(), O.rand(4));
          break;
        }
      }
    }else{
      const pos = new Vector(O.rand(n), 1, O.rand(n));
      const d = grid.getv(pos);
      const bot = new cs.Bot(d.purge(), O.rand(4));
    }
  }

  aels(){
    const {div, cam} = this;

    let wasHudVisible = this.hudVisible;

    this.ael(div, 'mousedown', evt => {
      O.pd(evt);

      if(this.inventoryVisible){
        this.mbutton = evt.button;
        return;
      }

      if(!this.cursorLocked){
        div.requestPointerLock();
        return;
      }

      this.curAction = evt.button;
    });

    this.ael('wheel', evt => {
      if(!(this.active && (this.cursorLocked || this.inventoryVisible))) return;
      O.pd(evt);

      const dir = Math.sign(evt.deltaY);
      const n = QUICK_ACCESS_NUM;

      if(this.inventoryVisible){
        const {inventoryOffset: offset} = this;

        if(dir === -1){
          if(offset !== 0)
            this.inventoryOffset--;
        }else{
          if((offset + INVENTORY_ROWS) * n < Object.ctorsNum)
            this.inventoryOffset++;
        }
      }else{
        this.quickAccessIndex = (this.quickAccessIndex + dir + n) % n;
      }
    });

    this.ael(div, 'mousemove', evt => {
      const {cur} = this;

      const brect = div.getBoundingClientRect();
      cur.x = evt.pageX - brect.x;
      cur.y = evt.pageY - brect.y;

      if(!this.cursorLocked) return;
      O.pd(evt);

      cam.rx = max(min(cam.rx + evt.movementY * CURSOR_SPEED / this.h, O.pih), -O.pih);
      cam.ry = (cam.ry + evt.movementX * CURSOR_SPEED / this.w) % O.pi2;
    });

    this.ael(div, 'contextmenu', evt => {
      O.pd(evt);
    });

    this.ael('keydown', evt => {
      if(evt.ctrlKey || !(this.active && (this.cursorLocked || evt.code === 'KeyE'))) return;
      O.pd(evt);

      const matchDigit = evt.code.match(/^(?:Digit|Numpad)(\d)$/);
      if(matchDigit !== null){
        const digit = ~-matchDigit[1];
        this.quickAccessIndex = digit;
        return;
      }

      switch(evt.code){
        case 'KeyW': this.dir |= 1; break;
        case 'KeyS': this.dir |= 2; break;
        case 'KeyA': this.dir |= 4; break;
        case 'KeyD': this.dir |= 8; break;
        case 'Space': this.dir |= 16; break;
        case 'ShiftLeft': case 'ShiftRight': this.dir |= 32; break;

        case 'KeyQ':
          this.inventory[this.quickAccessIndex] = null;
          break;

        case 'KeyE':
          if(this.inventoryVisible ^= 1){
            wasHudVisible = this.hudVisible;
            this.hudVisible = 1;
            O.doc.exitPointerLock();
          }else{
            this.mbutton = -1;
            this.inventoryItem = null;
            this.hudVisible = wasHudVisible;
            div.requestPointerLock();
          }
          break;

        case 'F1':
          if(!this.inventoryVisible)
            this.hudVisible ^= 1;
          break;
      }
    });

    this.ael('keyup', evt => {
      if(!this.cursorLocked) return;
      O.pd(evt);

      switch(evt.code){
        case 'KeyW': this.dir &= ~1; break;
        case 'KeyS': this.dir &= ~2; break;
        case 'KeyA': this.dir &= ~4; break;
        case 'KeyD': this.dir &= ~8; break;
        case 'Space': this.dir &= ~16; break;
        case 'ShiftLeft': case 'ShiftRight': this.dir &= ~32; break;
      }
    });

    this.ael(O.doc, 'pointerlockchange', evt => {
      const {scrollOffsets} = this;

      scrollOffsets.length = 0;

      if(this.cursorLocked ^= 1){
        for(let e = div; e !== null; e = e.parentNode)
          scrollOffsets.push(e.scrollTop);
      }else{
        this.dir = 0;
      }
    });

    let wasActive = 0;

    if(!O.isElectron){
      this.ael('blur', evt => {
        if(wasActive = this.active && !this.awaitingPause)
          this.pause();
      });

      this.ael('focus', evt => {
        if(wasActive)
          this.play();
      });
    }
  }

  ael(...args){
    O.ael(...args);
    this.listeners.push(args);
  }

  rels(){
    for(const [...params] of this.listeners)
      O.rel(...params);
  }

  createCanvas(){
    const canvas = O.ce(this.div, 'canvas');

    canvas.width = this.w;
    canvas.height = this.h;

    return canvas;
  }

  play(){
    return O.await(() => this.disposed || this.initialized && !this.active).then(() => {
      if(this.disposed) return;
      this.active = 1;
      this.timePrev = O.now - this.timeDiff;
      this.renderBound();
    });
  }

  pause(){
    this.inventoryVisible = 0;

    return O.await(() => this.disposed || this.initialized && this.active && !this.awaitingPause).then(() => {
      if(this.disposed) return;
      if(this.cursorLocked) O.doc.exitPointerLock();
      this.awaitingPause = 1;
      this.grid.prune();
    });
  }

  dispose(){
    this.rels();

    return O.await(() => this.initialized).then(() => {
      this.disposed = 1;

      Object.reset();
      Shape.reset();

      rengSem.signal();
    });
  }

  render(){
    if(this.disposed) return;

    if(!this.active || this.awaitingPause){
      this.active = 0;
      this.awaitingPause = 0;
      return;
    }

    if(this.cursorLocked || this.inventoryVisible){
      const {scrollOffsets} = this;
      let i = 0;

      for(let e = this.div; e !== null; e = e.parentNode)
        e.scrollTop = scrollOffsets[i++];
    }

    const {w, h, wh, hh, g, gl, uniforms, cam, dir, camRot, objRot, grid, inventory} = this;

    g.clearRect(0, 0, w, h);
    if(this.hudVisible){
      const {mbutton: btn, inventoryItem: item} = this;
      const {x: cx, y: cy} = this.cur;
      let selectedObj = null;

      const index = this.quickAccessIndex;
      const n = QUICK_ACCESS_NUM;
      const s = THUMBNAIL_SIZE;
      const sh = s / 2;
      const s1 = s + 5;

      const xStart = wh - n / 2 * s1 + (s1 - s) / 2;

      const drawTiles = (objs, index, y, quickAccess=1, editable=1) => {
        for(let i = 0; i !== n; i++){
          if(i === index){
            g.lineWidth = 3;
            g.strokeStyle = '#fff';
          }else{
            g.lineWidth = 2;
            g.strokeStyle = '#aaa';
          }

          const obj = objs[i];
          const x = xStart + i * s1;
          const selected = editable && cx >= x && cy >= y && cx < x + s && cy < y + s;

          if(selected){
            if(btn === -1 && item === null)
              selectedObj = obj;

            if(btn === 0){
              if(quickAccess) inventory[i] = item;
              this.inventoryItem = obj;
            }else if(btn === 2){
              if(quickAccess) inventory[i] = null;
              this.inventoryItem = null;
            }
          }

          g.fillStyle = 'rgba(0, 0, 0, .5)';
          g.fillRect(x, y, s, s);

          if(obj !== null){
            const {img} = Material[obj.material];
            g.drawImage(img, 0, 0, img.width, img.height, x, y, s, s);
          }else{
            if(selected){
              g.fillStyle = 'rgba(100, 100, 100, .7)';
              g.fillRect(x, y, s, s);
            }
          }

          g.beginPath();
          g.rect(x, y, s, s);
          g.stroke();
        }
        g.lineWidth = 1;
      };

      drawTiles(inventory, index, h - s - 5, 1, !this.inventoryVisible);

      if(this.inventoryVisible){
        const {inventoryOffset: offset} = this;

        const {ctorsArr: arr} = Object;
        const len = arr.length;

        const rowsNum = INVENTORY_ROWS;
        const indexStart = offset * n;

        const x1 = xStart - s1;
        const y1 = hh - s1 * 4;
        const x2 = w - x1;
        const y2 = h - y1;

        g.fillStyle = 'rgba(0, 0, 0, .5)';
        g.fillRect(0, 0, w, h);

        g.fillStyle = 'rgba(120, 120, 120, .8)';
        g.strokeStyle = 'black';
        g.beginPath();
        g.rect(x1 + .5, y1 + .5, x2 - x1, y2 - y1);
        g.fill();
        g.stroke();

        for(let i = 0; i !== rowsNum; i++){
          const objs = O.ca(n, j => {
            j += indexStart + i * n;
            if(j >= len) return null;
            return arr[j];
          });
          drawTiles(objs, null, y1 + (i + .5) * s1, 0);
        }

        drawTiles(inventory, null, y2 - s * 1.5);

        const item = this.inventoryItem;
        if(item !== null){
          const {img} = Material[item.material];
          g.drawImage(img, 0, 0, img.width, img.height, cx - sh, cy - sh, s, s);
        }

        if(selectedObj !== null){
          g.textBaseline = 'bottom';
          g.textAlign = 'center';
          g.font = '16px arial';

          const objName = LS.simulator.objects[selectedObj.formattedName];
          const textWidth = g.measureText(objName).width;

          g.fillStyle = 'rgba(0, 0, 0, .8)';
          g.fillRect(cx - textWidth / 2 - 5, cy - 21, textWidth + 10, 21);
          g.fillStyle = 'darkgray';
          g.fillText(objName, cx, cy);
        }

        this.mbutton = -1;
      }else{
        if(DISPLAY_FPS){
          let fps = 1e3 / O.z + .5 | 0;
          if(fps > 55) fps = 60;
          g.font = '16px arial';
          g.fillStyle = 'black';
          g.fillText(`FPS: ${fps}`, 5, 5);
        }

        const s = 10;
        g.strokeStyle = 'white';
        g.beginPath();
        g.moveTo(wh, hh - s);
        g.lineTo(wh, hh + s);
        g.moveTo(wh - s, hh);
        g.lineTo(wh + s, hh);
        g.stroke();
      }
    }

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const time = O.now;
    let timeDiff = this.timeDiff = time - this.timePrev;

    const newTick = timeDiff >= TICK_TIME;
    if(newTick){
      for(const obj of Object.objs)
        obj.prev.setv(obj);

      this.timePrev += TICK_TIME;
      timeDiff %= TICK_TIME;
      grid.tick();
    }

    const k = timeDiff / TICK_TIME;

    // TODO: Use the exponential moving average algorithm to calculate FPS
    {
      const t = O.now;
      this.sum += t - this.tt;
      this.num++;
      this.tt = t;
      O.z = this.sum / this.num;
      if(this.num === 300) this.sum = this.num = 0;
    }

    if(dir){
      const sp = this.speed;
      let x, y, z;

      if(dir & 3){
        x = sp * -sin(cam.ry);
        z = sp * cos(cam.ry);

        if(dir & 1) cam.x += x, cam.z += z;
        if(dir & 2) cam.x -= x, cam.z -= z;
      }

      if(dir & 12){
        x = sp * -sin(cam.ry);
        z = sp * cos(cam.ry);

        if(dir & 4) cam.x += z, cam.z -= x;
        if(dir & 8) cam.x -= z, cam.z += x;
      }

      if(dir & 16) cam.y -= sp;
      if(dir & 32) cam.y += sp;
    }

    // TODO: use Ray::rotate to acomplish these operations
    const sx = sin(cam.rx), cx = cos(cam.rx);
    const sy = sin(cam.ry), cy = cos(cam.ry);

    camRot[0] = cy;
    camRot[1] = sx * sy;
    camRot[2] = -cx * sy;
    camRot[4] = cx;
    camRot[5] = sx;
    camRot[6] = sy;
    camRot[7] = -sx * cy;
    camRot[8] = cx * cy;

    gl.uniformMatrix3fv(uniforms.camRot, false, camRot);

    // Base translation for objects
    const xx = cam.x + .5;
    const yy = cam.y + .5;
    const zz = cam.z + .5;

    // Find the target tile
    renderTargetTile: if(this.hudVisible && !this.inventoryVisible){
      // TODO: optimize this
      const ray = new DiscreteRay(-cam.x, -cam.y, -cam.z, ...new Vector(0, 0, 1).rot(cam.rx, O.pi - cam.ry, 0));
      let d = grid.trace(ray, 20, 1, 1);
      if(d === null) break renderTargetTile;

      const {curAction} = this;

      if(curAction !== -1){
        switch(curAction){
          case 0:
            d.purge();
            break;

          case 1:
            const ctor = d.fst.constructor;
            let index = inventory.findIndex(item => item === null || item === ctor);
            if(index === -1) index = this.quickAccessIndex;
            inventory[index] = ctor;
            this.quickAccessIndex = index;
            break;

          case 2:
            const item = inventory[this.quickAccessIndex];

            if(item !== null){
              d = grid.getv(ray);

              if(!(d.has.occupying && item.is.occupying))
                new item(d);
            }
            break;
        }

        // TODO: optimize this
        ray.set(-cam.x, -cam.y, -cam.z, ...new Vector(0, 0, 1).rot(cam.rx, O.pi - cam.ry, 0));
        d = grid.trace(ray, 20, 1, 1);
        if(d === null) break renderTargetTile;
      }

      const square = Model.square;
      this.bufferModel(square);
      gl.uniform3f(uniforms.camTrans, xx + ray.x, yy + ray.y, zz + ray.z);
      gl.uniformMatrix3fv(uniforms.objRotation, false, Vector.dirMat(ray.dir, 0));
      gl.uniform1f(uniforms.scale, 1);
      gl.uniform1i(uniforms.calcLight, 0);
      gl.bindTexture(gl.TEXTURE_2D, Material.hud.tex);
      gl.drawArrays(gl.LINE_LOOP, 0, square.len);
      gl.uniform1i(uniforms.calcLight, 1);
    }
    this.curAction = -1;

    let rot = null;

    for(const [model, set] of Shape.shapes){
      this.bufferModel(model);

      for(const shape of set){
        const {obj} = shape;
        if(obj === null) continue;

        const {x, y, z, ry} = Ray.intp(obj.prev, obj, k).add(xx, yy, zz);
        gl.uniform3f(uniforms.camTrans, x, y, z);
        gl.uniform1f(uniforms.scale, shape.scale);
        gl.bindTexture(gl.TEXTURE_2D, shape.mat.tex);

        if(ry !== rot){
          rot = ry;
          objRot[0] = objRot[8] = cos(ry);
          objRot[2] = -(objRot[6] = sin(ry));
          gl.uniformMatrix3fv(uniforms.objRotation, false, objRot);
        }

        gl.drawArrays(gl.TRIANGLES, 0, model.len);
      }
    }

    // Render the sky
    {
      const sky = Model.cubeuv;
      this.bufferModel(sky);
      gl.uniform3f(uniforms.camTrans, 0, 0, 0);
      objRot[0] = objRot[8] = 1;
      objRot[2] = objRot[6] = 0;
      gl.uniformMatrix3fv(uniforms.objRotation, false, objRot);
      gl.uniform1f(uniforms.scale, 1e3);
      gl.uniform1i(uniforms.calcLight, 0);
      gl.bindTexture(gl.TEXTURE_2D, Material.sky.tex);
      gl.drawArrays(gl.TRIANGLES, 0, sky.len);
      gl.uniform1i(uniforms.calcLight, 1);
    }

    O.raf(this.renderBound);
  }

  bufferModel(m){
    const {gl, bufs, attribs} = this;

    gl.bindBuffer(gl.ARRAY_BUFFER, bufs.vBuf);
    gl.bufferData(gl.ARRAY_BUFFER, m.verts, gl.STATIC_DRAW);
    gl.vertexAttribPointer(attribs.v, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, bufs.nBuf);
    gl.bufferData(gl.ARRAY_BUFFER, m.norms, gl.STATIC_DRAW);
    gl.vertexAttribPointer(attribs.n, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, bufs.texBuf);
    gl.bufferData(gl.ARRAY_BUFFER, m.tex, gl.STATIC_DRAW);
    gl.vertexAttribPointer(attribs.tex, 2, gl.FLOAT, false, 0, 0);
  }
};

module.exports = RenderEngine;