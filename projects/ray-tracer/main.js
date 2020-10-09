'use strict';

const Vector = require('./vector');
const Ray = require('./ray');
const Camera = require('./camera');

const IS_BROWSER = O.env === 'browser';
const IS_NODE = O.env === 'node';

const STABILIZE_FPS = IS_BROWSER;
const USE_BUFF = IS_NODE;

const SCALE = IS_BROWSER ? .2 : 1;
const VIEW_DISTANCE = IS_BROWSER ? 100 : 100;
const TARGET_FPS = IS_BROWSER ? 30 : 30;
const CAM_SPEED = IS_BROWSER ? .5 : .05;

const targetDt = 1e3 / TARGET_FPS;

const w = Math.round(window.innerWidth * SCALE);
const h = Math.round(window.innerHeight * SCALE);

const [wh, hh] = [w, h].map(a => a / 2);

const pixelsNum = w * h;
var pixelsPerFrame = STABILIZE_FPS ? 1e3 : pixelsNum;

const g = createContext();
const imgd = g.createImageData(w, h);
const {data} = imgd;

const pixels = [];
var pixelIndex = 0;

const cam = new Camera(0, -2, 0, 0, O.pi / 7, 0, 0, 0);
const {vel} = cam;

const func = createFunc();
const blocks = new O.Map3D();

var time = Date.now();

var buff = null;

window.setTimeout(main);

function main(){
  O.body.classList.add('has-canvas');
  O.body.style.backgroundColor = '#000000';
  O.body.style.overflow = 'hidden';

  for(var i = 3; i < data.length; i += 4)
    data[i] = 255;

  for(var i = 0, y = 0; y !== h; y++){
    for(var x = 0; x !== w; x++, i += 4){
      pixels.push([(x - wh) / wh, (y - hh) / wh, i]);
    }
  }

  O.shuffle(pixels);

  aels();
  O.raf(render);
}

function aels(){
  O.ael('mousedown', evt => {
    if(!isCurLocked())
      g.canvas.requestPointerLock();
  });

  O.ael('mousemove', evt => {
    if(!isCurLocked()) return;

    const dx = evt.movementX / 100;
    const dy = -evt.movementY / 100;

    cam.pitch = O.bound(cam.pitch + dy, -O.pih, O.pih);
    cam.yaw = (cam.yaw + dx) % O.pi2;
  });

  O.ael('keydown', evt => {
    switch(evt.code){
      case 'KeyW': vel.z = CAM_SPEED; break;
      case 'KeyA': vel.x = -CAM_SPEED; break;
      case 'KeyS': vel.z = -CAM_SPEED; break;
      case 'KeyD': vel.x = CAM_SPEED; break;
      case 'Space': vel.y = -CAM_SPEED; break;
      case 'ShiftLeft': vel.y = CAM_SPEED; break;
      case 'KeyE': prompt(getCode(), getCode()); break;
    }
  });

  O.ael('keyup', evt => {
    switch(evt.code){
      case 'KeyW': vel.z = 0; break;
      case 'KeyA': vel.x = 0; break;
      case 'KeyS': vel.z = 0; break;
      case 'KeyD': vel.x = 0; break;
      case 'Space': vel.y = 0; break;
      case 'ShiftLeft': vel.y = 0; break;
    }
  });

  O.ael('_msg', evt => {
    switch(evt.type){
      case 'setBuff':
        buff = evt.buff;
        break;
    }
  });
}

function createContext(){
  const canvas = O.ce(O.body, 'canvas');

  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.width = w;
  canvas.height = h;

  return canvas.getContext('2d');
}

function createFunc(){
  return (x, y, z, t) => {
    return (
      (
        (y <= 0)
      ) || (
        (y === 1) &&
        ((t % x ^ t % z) === 0)
      )
    );
  };

  const arr = [];

  while(arr.length !== 20){
    while(1){
      try{
        var expr1 = elem();
        if(expr1.length < 100) continue;
        
        var expr2 = elem();
        if(expr2.length < 100) continue;

        arr.push(`(${expr1})<(${expr2})`);
        break;
      }catch{
        continue;
      }
    }
  }

  const code = `return${arr.join('^')}`;
  const func = new Function('x', 'y', 'z', code);

  return func;

  function elem(){
    if(r()){
      var type = O.rand(3);
      var opnd;

      if(type === 0){
        opnd = String(+O.randf(-20, 20).toFixed(3));
      }else if(type === 1){
        opnd = e(['x', 'y', 'z']);
      }else if(type === 2){
        opnd = 'Math.random()';
      }

      return op ? `${op}(${opnd})` : opnd;
    }

    var type = O.rand(4);

    if(type === 0){
      var op = e([
        '+', '-', '/', '*', '%', '**',
        '<', '>', '<=', '>=', '==', '!==',
        '<<', '>>', '>>>',
        '&', '|', '^',
        '&&', '||',
      ]);
      return `(${elem()})${op}(${elem()})`;
    }

    if(type === 1){
      var func = e([
        'abs', 'acos', 'acosh', 'asin', 'asinh',
        'atan', 'atanh', 'cbrt', 'ceil', 'clz32',
        'cos', 'cosh', 'exp', 'expm1', 'floor',
        'fround', 'log', 'log1p', 'log10', 'log2',
        'round', 'sign', 'sin', 'sinh', 'sqrt',
        'tan', 'tanh', 'trunc',
      ]);
      return `Math.${func}(${elem()})`;
    }

    if(type === 2){
      var func = e([
        'atan2', 'imul', 'pow',
      ]);
      return `Math.${func}(${elem()},${elem()})`;
    }

    if(type === 3){
      if(r()) return `(${elem()})<(${elem()})?(${elem()}):(${elem()})`;
      var func = e([
        'hypot', 'max', 'min',
      ]);
      var opnds = O.ca(O.randInt(2, .5), () => elem());
      return `Math.${func}(${opnds.join(',')})`;
    }
  }

  function e(arr){
    return O.randElem(arr);
  }

  function r(v){
    return O.rand(v);
  }
}

function render(t){
  if(STABILIZE_FPS){
    const fps = Math.round(t - time);

    if(fps !== TARGET_FPS){
      if(fps > targetDt) pixelsPerFrame /= 1.1;
      else pixelsPerFrame *= 1.1;
    }

    pixelsPerFrame = Math.round(pixelsPerFrame);
    if(pixelsPerFrame > pixelsNum) pixelsPerFrame = pixelsNum;

    time = t;
  }

  t /= 1e3;

  cam.tick();
  const {x: camX, y: camY, z: camZ, yaw, pitch} = cam;

  const sx = Math.sin(pitch);
  const cx = Math.cos(pitch);
  const sy = Math.sin(yaw);
  const cy = Math.cos(yaw);

  const ray = new Ray(0, 0, 0, 0, 0, 0);
  const vec = new Vector(0, 0, 0);

  const d = USE_BUFF ? buff : data;

  for(let i = 0; i !== pixelsPerFrame; i++){
    const pixelData = pixels[pixelIndex++];
    if(pixelIndex === pixelsNum) pixelIndex = 0;

    const xx = pixelData[0];
    const yy = pixelData[1];
    const i = pixelData[2];

    const col = new Uint8Array(3);

    vec.set_(xx, yy, 1).rotsc_(sx, cx, sy, cy, 0, 1).setLen(1);
    ray.reset(camX, camY, camZ, vec.x, vec.y, vec.z);

    d[i] = 0;
    d[i + 1] = 0;
    d[i + 2] = 0;

    for(var j = 0; j !== VIEW_DISTANCE; j++){
      ray.move();
      var {x, y, z} = ray;

      /*if(blocks.has(x, y, z)){
        var m = blocks.get(x, y, z) === 2;
      }else{
        var m = func(x, y, z);
        blocks.set(x, y, z, m ? 2 : 1);
      }*/

      if(func(x, -y, z, t)){
        const {dir} = ray;
        const adir = dir & 3;

        var k = 1 - j / VIEW_DISTANCE;

        if((x ^ y ^ z) & 1){
          col[0] = ((y & 7) << 4) + (adir === 1) * ((y & 7) << 4);
          col[1] = 128 + (adir === 2) * 128;
          col[2] = 128 + (adir === 3) * 128;
        }else{
          col[0] = ((y & 7) << 4) + (adir === 2) * ((y & 7) << 4);
          col[1] = 128 + (adir === 3) * 128;
          col[2] = 128 + (adir === 1) * 128;
        }

        if(dir < 0){
          col[0] >>= 1;
          col[1] >>= 1;
          col[2] >>= 1;
        }

        d[i] = col[0] * k;
        d[i + 1] = col[1] * k;
        d[i + 2] = col[2] * k;

        break;
      }
    }
  }

  if(!USE_BUFF)
    g.putImageData(imgd, 0, 0);

  O.raf(render);
}

function getCode(){
  var lines = O.sanl(func.toString()).slice(2);
  lines.pop();

  return lines.join('\n').substring(6);
}

function isCurLocked(){
  return O.doc.pointerLockElement !== null;
}