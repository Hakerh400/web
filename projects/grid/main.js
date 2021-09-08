'use strict';

const TilesGrid = require('./tiles-grid');
const BitStream = require('./bit-stream');
const Vector = require('./vector');

const IS_BROWSER = O.isBrowser;
const IS_NODE = O.isNode;

const CHECK_SNAPSHOT = 1;
const RAINBOW_ENABLED = 0;
const CHECKSUM_ENABLED = 0;
const COORDS_ENABLED = 0;

const MAX_COORDS = (1 << 16) - 1;

var size = O.urlParam('size', 40);
var diameter = .7;
var radius = diameter / 2;

var w = 1920 / size | 0;
var h = 1080 / size | 0;

var autoDraw = IS_BROWSER;

var tileParams = [
  'dir',
  'circ',
  'wall',
  'void',
];

var cols = {
  bg: '#ffffff',
  nonMarkedLines: '#e0e0e0',
  markedLines: '#000000',
  blackCirc: '#000000',
  whiteCirc: '#ffffff',
  wall: '#808080',
  void: '#00ff00',
  internal: '#00ffff',
};

var drawFuncs = [
  drawGridLines,
  drawTile,
  drawFrameLines,
];

var grid = null;
var canvas = null;
var blackCirc = null;

var fragments = [];
var activeFragment = null;

var isCanvasVisible = true;

main();

function main(){
  grid = new TilesGrid();
  canvas = grid.g.canvas;

  grid.setWH(w, h);
  grid.setSize(size);
  grid.setTileParams(tileParams);

  createGrid();
  addEventListeners();
}

function addEventListeners(){
  var clientX = grid.iw >> 1;
  var clientY = grid.ih >> 1;

  var keys = Object.create(null);
  var mouse = Object.create(null);

  ael('keydown', evt => {
    keys[evt.code] = 1;

    switch(evt.code){
      case 'Enter': applyAlgorithms(); break;
      case 'Space': test1(); break;
      case 'KeyE': test2(); break;

      case 'KeyR': resetGrid(); break;
      case 'KeyC': closeGrid(); break;
      case 'KeyD': divideGrid(); break;
      case 'KeyI': updateInternals(); break;
      case 'Escape': showTextArea(evt); break;
      case 'Digit1': drawGrid(1); break;

      case 'ArrowUp': move(0); break;
      case 'ArrowLeft': move(1); break;
      case 'ArrowDown': move(2); break;
      case 'ArrowRight': move(3); break;
    }
  });

  ael('keyup', evt => {
    keys[evt.code] = 0;
  });

  ael('mousedown', evt => {
    mouse[evt.button] = 1;

    var type = getInputType();
    var mode = mouse[0] ? 1 : 0;

    if(type !== 0){
      clientX = evt.clientX;
      clientY = evt.clientY;
      setOrRemoveObjects(evt, type, mode);
      return;
    }

    switch(evt.button){
      case 0:
        markLine(evt);
        break;

      case 2:
        unmarkLine(evt);
        break;
    }
  });

  ael('mouseup', evt => {
    mouse[evt.button] = 0;
  });

  ael('mousemove', evt => {
    if(!(mouse[0] || mouse[2]))
      return;

    var g = grid.g;
    var type = getInputType();
    var mode = mouse[0] ? 1 : 0;

    if(type !== 0){
      setOrRemoveObjects(evt, type, mode);
      return;
    }

    if(mode === 0){
      unmarkLine(evt);
      return;
    }

    const scale = g.sx;

    var x1 = Math.round((clientX - g.tx) / scale);
    var y1 = Math.round((clientY - g.ty) / scale);
    var x2 = Math.round((evt.clientX - g.tx) / scale);
    var y2 = Math.round((evt.clientY - g.ty) / scale);

    var xs = x2 > x1 ? 1 : x2 < x1 ? -1 : 0;
    var ys = y2 > y1 ? 1 : y2 < y1 ? -1 : 0;

    var dir1 = ys !== -1 ? 0 : 2;
    var dir2 = xs !== -1 ? 1 : 3;

    if(xs === -1) x1--, x2--;
    if(ys === -1) y1--, y2--;

    while(x1 !== x2){
      sdir(x1, y1, dir1);
      x1 += xs;
    }

    while(y1 !== y2){
      sdir(x1, y1, dir2);
      y1 += ys;
    }

    clientX = evt.clientX;
    clientY = evt.clientY;

    drawGrid();
  });

  ael('contextmenu', evt => {
    evt.preventDefault();
  });

  if(IS_NODE){
    window.addEventListener('_msg', evt => {
      switch(evt.type){
        case 'import': importGrid(evt.data); break;
        case 'export': evt.data = exportGrid(); break;
        case 'algs': applyAlgorithms(); break;

        case 'test':
          importGrid(evt.data[0]);
          if(exportGrid() !== evt.data[0]) { evt.data = false; break; }
          applyAlgorithms();
          evt.data = exportGrid() === evt.data[1];
          break;

        default:
          throw new TypeError('Unrecognized message type');
          break;
      }
    });
  }

  function getInputType(){
    if(keys['KeyB']) return 1;
    if(keys['KeyW']) return 2;
    if(keys['KeyX']) return 3;
    if(keys['KeyV']) return 4;
    return 0;
  }

  function markLine(evt){
    var coords = getCoords(evt);
    if(coords === null) return;

    var [x, y, dir] = coords;
    sdir(x, y, dir);

    drawGrid();
  }

  function unmarkLine(evt){
    var coords = getCoords(evt);
    if(coords === null) return;

    var [x, y, dir] = coords;
    cdir(x, y, dir);

    drawGrid();
  }

  function move(dir){
    var tiles = new Set();

    iterate(1, (x, y, d) => {
      if(d.circ !== 1) return;
      if(gdir(x, y, dir, 1)) return;

      var d1 = ndir(x, y, dir, 1).d;
      if(d1 === null || d1.void) return;

      d.circ = 0;
      tiles.add(d1);
    });

    tiles.forEach(d => {
      d.circ = 1;
    });

    drawGrid();
  }

  function setOrRemoveObjects(evt, type, mode){
    const {g} = grid;
    const scale = g.sx;

    var x1 = Math.floor((clientX - g.tx) / scale);
    var y1 = Math.floor((clientY - g.ty) / scale);
    var x2 = Math.floor((evt.clientX - g.tx) / scale);
    var y2 = Math.floor((evt.clientY - g.ty) / scale);

    var xs = x2 > x1 ? 1 : x2 < x1 ? -1 : 0;
    var ys = y2 > y1 ? 1 : y2 < y1 ? -1 : 0;

    do{
      setOrRemoveObject(x1, y1, type, mode);
      x1 += xs;
    }while(x1 !== x2);

    do{
      setOrRemoveObject(x1, y1, type, mode);
      y1 += ys;
    }while(y1 !== y2);

    clientX = evt.clientX;
    clientY = evt.clientY;

    drawGrid();
  }

  function setOrRemoveObject(x, y, type, mode){
    switch(type){
      case 1: mode ? scirc(x, y, 1) : ccirc(x, y, 1); break;
      case 2: mode ? scirc(x, y, 2) : ccirc(x, y, 2); break;
      case 3: mode ? swall(x, y) : cwall(x, y); break;
      case 4: mode ? svoid(x, y) : cvoid(x, y); break;
    }
  }

  function getCoords(evt = null){
    if(evt !== null){
      clientX = evt.clientX;
      clientY = evt.clientY;
    }

    const {g} = grid;
    const scale = g.sx;

    var cx = (clientX - g.tx) / scale;
    var cy = (clientY - g.ty) / scale;

    var x = Math.floor(cx);
    var y = Math.floor(cy);

    var d = get(x, y, 1);
    if(d === null) return null;

    cx %= 1;
    cy %= 1;

    var a1 = cx <= cy;
    var a2 = 1 - cx < cy;
    var dir = (a2 << 1) | (a1 ^ a2);

    return [x, y, dir];
  }

  function test1(){
    let str = exportGrid();

    str = O.sanl(str).join('');
    str = str.substring(64);

    importGrid(str, 1);
    applyAlgorithms();
  }

  function test2(){
    const f = () => {
      let str = exportGrid();

      str = O.rev(str);

      importGrid(str, 1);

      let s = exportGrid();

      do{
        applyAlgorithms();
      }while(s !== (s = exportGrid()));
    };

    f();
    f();
  }

  function ael(type, func){
    window.addEventListener(type, evt => {
      if(!isCanvasVisible)
        return;

      func(evt);
    });
  }
}

function createGrid(){
  grid.create(() => {
    return [0, 0, 0, 0];
  });

  resetGrid();
}

function resetGrid(draw=1){
  blackCirc = null;

  iterate(1, (x, y, d) => {
    d.dir = 0;
    d.circ = 0;
    d.wall = 0;
    d.void = 0;

    d.internal = 0;
  });

  if(draw) drawGrid();
}

function closeGrid(){
  for(var x = 0; x < w; x++){
    sdir(x, 0, 0);
    sdir(x, h - 1, 2);
  }

  for(var y = 0; y < h; y++){
    sdir(0, y, 1);
    sdir(w - 1, y, 3);
  }

  drawGrid();
}

function divideGrid(){
  for(var y = 0; y < h; y++){
    for(var x = 0; x < w; x++){
      sdirs(x, y);
    }
  }

  drawGrid();
}

function updateInternals(){
  findFragments();

  fragments.forEach(frag => {
    activeFragment = frag;
    findInternalCells();
  });

  drawGrid();
}

/*
  Drawing functions
*/

function clearGrid(){
  var g = grid.g;

  g.fillStyle = cols.bg;
  g.fillRect(0, 0, w, h);
}

function drawGrid(important=0){
  if(!(autoDraw || important)) return;

  clearGrid();

  drawFuncs.forEach(func => {
    grid.setDrawFunc(func);
    grid.draw();
  });
}

function drawGridLines(x, y, d, g){
  g.strokeStyle = cols.nonMarkedLines;
  g.beginPath();
  g.rect(x, y, 1, 1);
  g.stroke();
}

function drawTile(x, y, d, g){
  g.strokeStyle = 'black';

  if(d.void){
    g.fillStyle = cols.void;
    g.fillRect(x, y, 1, 1);
    return;
  }

  if(d.wall){
    g.fillStyle = cols.wall;
    g.fillRect(x, y, 1, 1);
    grid.drawFrame(x, y, drawWallFrame);
    return;
  }

  if(d.internal){
    g.fillStyle = RAINBOW_ENABLED ? d.col : cols.internal;
    g.fillRect(x, y, 1, 1);
  }

  if(d.circ){
    g.fillStyle = [cols.blackCirc, cols.whiteCirc][d.circ - 1];
    g.beginPath();
    g.arc(x + .5, y + .5, radius, 0, O.pi2);
    g.fill();
    g.stroke();
  }
}

function drawFrameLines(x, y, d, g){
  if(d.void)
    return;

  g.strokeStyle = cols.markedLines;

  grid.drawFrame(x, y, (d1, dir) => {
    if(d.wall && d1 && d1.wall) return false;
    if(!gdir(x, y, dir, 1)) return false;
    return true;
  });
}

function drawWallFrame(d, dir){
  if(d === null) return true;
  return !d.wall;
}

/*
  Iterating functions
*/

function iterateExternalShape(x, y, func){
  var id = getId();
  var queue = [{x, y, d: get(x, y)}];

  while(queue.length){
    var {x, y, d} = queue.shift();
    if(d.id === id) continue;
    d.id = id;

    func(x, y, d);

    iterateDirs(dir => {
      var obj = ndir(x, y, dir);
      var d = obj.d;

      if(d === null || d.wall)
        return;

      if(d.internal && d.id !== id)
        queue.push(obj);
    });
  }
}

function iterateInternalShape(x, y, func){
  var id = getId();
  var queue = [x, y, get(x, y), 0];

  while(queue.length){
    var x = queue.shift();
    var y = queue.shift();
    var d = queue.shift();
    var dist = queue.shift();

    if(d.id === id) continue;
    d.id = id;

    func(x, y, d, dist);

    iterateDirs(dir => {
      if(gdir(x, y, dir)) return;

      var obj = ndir(x, y, dir);
      if(obj.d.id === id) return;

      queue.push(obj.x, obj.y, obj.d, dist + 1);
    });
  }
}

function traverseShape(x, y, func){
  var id = getId();
  var d = get(x, y);
  var dir1 = null;
  var dir2;

  var xp, yp, dp;

  do{
    xp = x;
    yp = y;
    dp = d;

    var foundDir = false;

    iterateDirs(dir => {
      if(foundDir) return;

      if(!gdir(xp, yp, dir) && ({x, y, d} = ndir(xp, yp, dir), d.id !== id)){
        foundDir = true;
        dir2 = dir;
      }
    });

    if(!foundDir){
      dir2 = null;
    }

    func(xp, yp, dp, dir1, dir2);

    if(dir2 !== null){
      dp.id = id;
      dp = d;
      dir1 = dir2 + 2 & 3;
    }
  }while(dir2 !== null);
}

function someAdjacent(x, y, func){
  var found = false;

  iterateDirs(dir => {
    if(found) return;

    var obj = ndir(x, y, dir);

    if(func(obj.x, obj.y, obj.d, dir)){
      found = true;
    }
  });

  return found;
}

function iterateDirs(func){
  func(0);
  func(1);
  func(3);
  func(2);
}

/*
  Grid functions
*/

function findFragments(){
  var id = getId();

  fragments.length = 0;
  activeFragment = null;

  iterate(1, (x, y, d) => {
    if(d.void || d.id === id) return;

    var frag = new Fragment(fragments.length);
    var queue = [[x, y]];

    d.id = id;
    frag.addInternalTile(x, y);

    while(queue.length){
      [x, y] = queue.shift();

      adjacent(x, y, (x1, y1, d1) => {
        if(d1 !== null){
          if(d1.id === id) return;

          d1.id = id;
          frag.addInternalTile(x1, y1);
          queue.push([x1, y1]);
        }else{
          frag.addExternalTile(x1, y1);
        }
      });
    }

    frag.sort();
    fragments.push(frag);
  });
}

function iterate(advanced, func=null){
  if(func === null){
    func = advanced;
    advanced = 0;
  }

  if(advanced) grid.iterate(func);
  else activeFragment.iterate(func);
}

function adjacent(x, y, advanced, func=null){
  if(func === null){
    func = advanced;
    advanced = 0;
  }

  grid.adjacent(x, y, (x, y, d, dir) => {
    if(!advanced && d !== null && d.void) d = null;
    func(x, y, d, dir);
  });
}

function getFirstTile(){
  return activeFragment.internalTiles[0];
}

function get(x, y, advanced){
  if(!(advanced || activeFragment.includes(x, y)))
    return null;

  return grid.get(x, y);
}

class Fragment{
  constructor(index){
    this.index = index;

    this.externalTiles = [];
    this.internalTiles = [];

    this.tilesObj = new O.Map2D();
  }

  addExternalTile(x, y){
    this.externalTiles.push([x, y]);
  }

  addInternalTile(x, y){
    this.internalTiles.push([x, y, get(x, y, 1)]);
    this.tilesObj.set(x, y);
  }

  sort(){
    sortCoords(this.internalTiles);
  }

  iterate(func){
    this.internalTiles.forEach(tile => {
      func(...tile);
    });
  }

  includes(x, y){
    return this.tilesObj.has(x, y);
  }
};

/*
  Import and export functions
*/

function showTextArea(evt=null){
  if(!(O.static in showTextArea)){
    var obj = Object.create(null);
    showTextArea[O.static] = obj;

    var div = O.ce(O.body, 'div');
    obj.div = div;
    div.style.margin = '8px';

    var ta = O.ce(div, 'textarea');
    obj.ta = ta;
    ta.style.width = `${grid.iw * .75}px`;
    ta.style.height = `${grid.ih * .75}px`;

    window.addEventListener('keydown', evt => {
      if(isCanvasVisible || evt.disabled)
        return;

      switch(evt.code){
        case 'Escape':
          div.style.display = 'none';
          canvas.style.display = 'block';
          importGrid(ta.value);
          isCanvasVisible = true;
          evt.disabled = true;
          break;
      }
    });
  }

  var obj = showTextArea[O.static];
  var {div, ta} = obj;

  isCanvasVisible = false;
  if(evt !== null) evt.disabled = true;

  canvas.style.display = 'none';
  div.style.display = 'block';
  ta.value = exportGrid();

  ta.focus();
  ta.scrollTop = 0;
  ta.selectionStart = 0;
  ta.selectionEnd = 0;
}

function exportGrid(){
  var bs = new BitStream();

  if(COORDS_ENABLED){
    bs.write(w, MAX_COORDS);
    bs.write(h, MAX_COORDS);
  }

  iterate(1, (x, y, d) => {
    var dirs = gdirs(x, y, 1);

    if(y === 0) bs.write(dirs & 1 ? 1 : 0, 1);
    if(x === 0) bs.write(dirs & 2 ? 1 : 0, 1);

    bs.write(dirs & 8 ? 1 : 0, 1);
    bs.write(dirs & 4 ? 1 : 0, 1);

    if(!(((dirs & 1) && isVoid(x, y - 1)) || ((dirs & 2) && isVoid(x - 1, y)))){
      bs.write(d.void | 0, 1);
      if(d.void) return;
    }

    if(dirs === 15){
      bs.write(d.wall | 0, 1);
      if(d.wall) return;
    }

    bs.write(d.circ | 0, 2);
  });

  bs.pack();

  return bs.stringify(CHECKSUM_ENABLED);
}

function importGrid(str, draw=1){
  var arr = (String(str).match(/[0-9a-f]{2}|\S/gi) || []).map(a => {
    if(a.length === 2) return parseInt(a, 16);
    return a.charCodeAt(0) & 255;
  });

  var bs = new BitStream(arr, CHECKSUM_ENABLED);

  if(COORDS_ENABLED){
    w = bs.read(MAX_COORDS);
    h = bs.read(MAX_COORDS);
  }

  resetGrid(draw);

  iterate(1, (x, y, d) => {
    var dirs = gdirs(x, y, 1);

    if(y === 0) dirs |= bs.read(1);
    if(x === 0) dirs |= bs.read(1) << 1;

    dirs |= bs.read(1) << 3;
    dirs |= bs.read(1) << 2;

    iterateDirs(dir => {
      if(dirs & (1 << dir))
        sdir(x, y, dir);
    });

    if(!(((dirs & 1) && isVoid(x, y - 1)) || ((dirs & 2) && isVoid(x - 1, y)))){
      d.void = bs.read(1);
      if(d.void) return;
    }

    if(dirs === 15){
      d.wall = bs.read(1);
      if(d.wall) return;
    }

    d.circ = bs.read(2);
  });

  if(draw){
    updateInternals();
    drawGrid();
  }
}

/*
  Algorithms
*/

function applyAlgorithms(){
  findFragments();

  fragments.forEach(frag => {
    activeFragment = frag;

    createSnapshot();
    transformGrid();
    checkSnapshot();
  });

  calcCols();
  drawGrid();
}

function transformGrid(){
  findInternalCells();
  putExternalLines();

  findInternalCells();
  findShapes();

  putBlackCirc();
  connectShapes();
  fillShapes();

  connectDirShapes();
  putWhiteCircs();
}

function createSnapshot(){
  iterate((x, y, d) => {
    d.dirPrev = gdirs(x, y);
    d.circPrev = d.circ;
    d.wallPrev = d.wall;
  });
}

function findInternalCells(){
  var arr = [];
  var queue = activeFragment.externalTiles.slice();

  iterate((x, y, d) => {
    d.internal = 1;
  });

  while(queue.length){
    var [x, y] = queue.shift();
    var d = get(x, y);

    if(d !== null){
      if(!d.internal) continue;
      d.internal = 0;
    }

    iterateDirs(dir => {
      if(!gdir(x, y, dir)){
        var obj = ndir(x, y, dir);
        queue.push([obj.x, obj.y]);
      }
    });
  }
}

function putExternalLines(){
  var d1;

  iterate((x, y, d) => {
    d.ext = 0;
    d.extLines = 0;
  });

  iterate((x, y, d) => {
    if(d.internal || d.ext) return;

    if(d.circ){
      d.ext = 1;
      return;
    }

    d.ext = someAdjacent(x, y, (x1, y1, d1, dir) => {
      if(gdir(x, y, dir)){
        if(d1 === null || d1.wall || !d1.internal)
          return 1;
      }

      if(followDir(x, y, dir, 2))
        return 1;

      return 0;
    }) | 0;
  });

  iterate((x, y, d) => {
    if(!d.ext) return;

    iterateDirs(dir => {
      var ddir = 1 << dir;

      d1 = ndir(x, y, dir).d;

      if(d1 === null || !d1.ext){
        d.extLines |= ddir;
        return;
      }

      if(d.circ || (d1 !== null && d1.circ) || isLineTouching(x, y, dir))
        return;

      d.extLines |= ddir;
    });
  });

  iterate((x, y, d) => {
    if(d.ext){
      iterateDirs(dir => {
        if(d.extLines & (1 << dir))
          sdir(x, y, dir);
      });
    }
  });

  function followDir(x, y, dir, count, dirs=0){
    count--;

    var {x: x1, y: y1, d} = ndir(x, y, dir);
    var dir1 = dir;
    var d1;

    if(d === null) return 0;

    var found = 0;
    dirs |= 1 << dir;

    O.repeat(2, i => {
      if(found) return;
      dir1 ^= i + 1;

      if(((1 << dir1) & dirs) === 0){
        var goFurther = 0;

        if(gdir(x1, y1, dir1)){
          d1 = ndir(x1, y1, dir1).d;

          if(!d.internal){
            if(d1 === null || d1.wall || !d1.internal)
              found = 1;
          }else{
            if(d1 !== null && d1.wall) found = 1;
            else goFurther = 1;
          }
        }else if(!d.internal){
          goFurther = 1;
        }

        if(goFurther && count !== 0 && followDir(x1, y1, dir1, count, dirs))
          found = 1;
      }
    });

    return found;
  }
}

function findShapes(){
  iterate((x, y, d) => d.containsCircs = 0);

  iterate((x, y, d) => {
    if(!d.internal || d.containsCircs) return;

    if(d.circ)
      iterateInternalShape(x, y, (x, y, d) => d.containsCircs = 1);
  });
}

function putBlackCirc(){
  var firstInternalCell = null;
  var firstBlackCirc = null;
  var d1;

  iterate((x, y, d) => {
    if(d.internal && !d.wall){
      if(firstInternalCell === null) firstInternalCell = new Vector(x, y);
      if(d.circ === 1 && firstBlackCirc === null) firstBlackCirc = new Vector(x, y);
    }

    if(d.circ === 1) d.circ = 0;
  });

  if(firstInternalCell === null){
    var [x, y] = getFirstTile();
    sdirs(x, y);
    get(x, y).internal = 1;
    setBlackCirc(x, y);
  }else if(firstBlackCirc === null){
    setBlackCirc(firstInternalCell.x, firstInternalCell.y);
  }else{
    setBlackCirc(firstBlackCirc.x, firstBlackCirc.y);
  }
}

function connectShapes(){
  var mode = 0;
  var internalsNumPrev = null;

  while(1){
    var internalsNum = 0;

    iterate((x, y, d) => {
      if(!d.internal || d.wall)
        return;
      internalsNum++;
    });

    var id = getId();
    var queue = [];

    iterateExternalShape(blackCirc.x, blackCirc.y, (x, y, d) => {
      internalsNum--;
      d.id2 = id;
      d.elem = null;

      adjacent(x, y, (x, y, d1, dir) => {
        if(d1 === null || d1.id2 === id)
          return;

        if(mode === 0 ? !d1.internal : d1.wall){
          d1.id2 = id;
          d1.elem = null;
          queue.push([x, y, d1, [dir]]);
        }
      });
    });

    if(internalsNum === 0)
      break;

    if(internalsNum === internalsNumPrev){
      mode ^= 1;
      internalsNumPrev = null;
      continue;
    }

    internalsNumPrev = internalsNum;
    sortCoords(queue);

    var pathLen = null;
    var elems = [];

    while(queue.length){
      var elem = queue.shift();
      var [x, y, d, path] = elem;

      if(mode === 0 ? d.internal : !d.wall){
        if(pathLen === null){
          pathLen = path.length;
        }else{
          if(path.length > pathLen)
            break;
        }

        elems.push(elem);
        continue;
      }

      iterateDirs(dir => {
        var obj = ndir(x, y, dir);
        var d = obj.d;

        if(d === null) return;
        if(mode === 0 && d.wall) return;
        if(mode === 1 && !d.internal) return;

        if(d.id2 !== id || (d.elem !== null && findMinPathElem([elem, d.elem]) === elem)){
          d.id2 = id;
          d.elem = elem;
          queue.push([obj.x, obj.y, d, [...path, dir]]);
        }
      });
    }

    if(pathLen !== null){
      var elem = findMinPathElem(elems);
      var [x, y, d, path] = elem;

      path = path.map(dir => dir + 2 & 3);
      path.push(path[path.length - 1]);

      path.reduceRight((dirPrev, dir) => {
        if(mode === 0){
          if(!d.internal){
            iterateDirs(ddir => {
              if(ddir !== dir && ddir !== dirPrev){
                if(mode === 0) sdir(x, y, ddir);
                else cdir(x, y, ddir);
              }
            });
          }
        }else{
          if(d.wall){
            cwall(x, y);
          }
        }

        ({x, y, d} = ndir(x, y, dir));

        return dir + 2 & 3;
      });
    }

    findInternalCells();
  }

  findInternalCells();

  iterate((x, y, d) => {
    d.elem = null;
  });
}

function fillShapes(){
  iterate((x, y, d) => d.visited = 0);

  iterate((x, y, d) => {
    if(d.visited || !d.internal || d.wall) return;

    if(!d.containsCircs){
      fillShapeWhichHasNoCircs(x, y);
    }else{
      fillShapeWhichHasCircs(x, y);
    }
  });
}

function fillShapeWhichHasNoCircs(x, y){
  traverseShape(x, y, (x, y, d, dir1, dir2) => {
    iterateDirs(dir => {
      if(dir !== dir1 && dir !== dir2)
        sdir(x, y, dir);
    });

    d.visited = 1;
  });
}

function fillShapeWhichHasCircs(xStart, yStart){
  do{
    var id = getId();

    var foundLoop = false;
    var queue = [xStart, yStart, -1];

    while(queue.length){
      var x = queue.shift();
      var y = queue.shift();
      var lastDir = queue.shift();

      var d = get(x, y);
      var reversedLastDir = lastDir !== -1 ? lastDir + 2 & 3 : -1;

      if(d.id !== id){
        d.id = id;
        d.dirToStart = reversedLastDir;
      }else{
        foundLoop = true;

        id = getId();
        d.id = id;

        var xLoop = x;
        var yLoop = y;

        do{
          ({x, y, d} = ndir(x, y, d.dirToStart));
          d.id = id;
        }while(d.dirToStart !== -1);

        var xMin = xLoop;
        var yMin = yLoop;

        O.repeat(2, stage => {
          var found = false;

          x = xLoop;
          y = yLoop;

          if(stage === 0) ({x, y, d} = ndir(x, y, reversedLastDir));
          else d = get(x, y);

          do{
            [xMin, yMin] = findMinCoords(xMin, yMin, x, y);

            if(found) break;

            ({x, y, d} = ndir(x, y, d.dirToStart));

            if(stage === 0){
              if(d.id === id){
                found = true;
                id = getId();
                d.firstCommonTile = id;
              }
            }else{
              if(d.firstCommonTile === id){
                found = true;
              }
            }
          }while(1);
        });

        sdir(xMin, yMin, 3);

        break;
      }

      iterateDirs(dir => {
        if(gdir(x, y, dir)) return;

        var obj = ndir(x, y, dir);
        if(obj.d === null || obj.d.id === id) return;

        queue.push(obj.x, obj.y, dir);
      });
    }
  }while(foundLoop);

  iterateInternalShape(xStart, yStart, (x, y, d) => {
    d.visited = 1;
  });
}

function connectDirShapes(){
  do{
    var found = false;

    var shapeId = getId();
    var {x, y} = blackCirc;

    iterateInternalShape(x, y, (x, y, d) => {
      d.shapeId = shapeId;
    });

    var xMin, yMin;
    var dirMin = -1;

    iterateInternalShape(x, y, (x, y, d) => {
      iterateDirs(dir => {
        if(!gdir(x, y, dir))
          return;

        var d1 = ndir(x, y, dir).d;
        if(d1 === null || d1.wall || !d1.internal || d1.shapeId === shapeId)
          return;

        if(dirMin === -1){
          xMin = x;
          yMin = y;
          dirMin = dir;
        }else{
          if(compareCoordsAndDir(xMin, yMin, dirMin, x, y, dir)){
            xMin = x;
            yMin = y;
            dirMin = dir;
          }
        }
      });
    });

    if(dirMin !== -1){
      found = true;
      cdir(xMin, yMin, dirMin);
    }
  }while(found);
}

function putWhiteCircs(){
  iterate((x, y, d) => {
    if(!(d.circ === 1 || d.wall)){
      if(d.internal && dirsNum(x, y) === 3) d.circ = 2;
      else d.circ = 0;
    }
  });
}

function checkSnapshot(){
  if(!CHECK_SNAPSHOT)
    return;

  var needsChange = true;
  var freeTile = null;

  iterate((x, y, d) => {
    if(!needsChange) return;

    var dirs = gdirs(x, y);

    if(dirs !== d.dirPrev || d.circ !== d.circPrev || d.wall !== d.wallPrev){
      needsChange = false;
      return;
    }

    if(freeTile === null && !d.internal && dirs !== 0)
      freeTile = new Vector(x, y);
  });

  if(needsChange && freeTile !== null){
    sdirs(freeTile.x, freeTile.y);
    transformGrid();
  }
}

function calcCols(x = null, y = null){
  if(!RAINBOW_ENABLED)
    return;

  if(x === null || y === null)
    ({x, y} = blackCirc);

  iterateInternalShape(x, y, (x, y, d, dist) => {
    var val = dist / 256 % 1;
    var hsvCol = O.hsv(val);
    var rgb = hsvCol.map(a => (a + 255) >> 1);
    var col = O.rgb(...rgb);

    d.col = col;
  });
}

/*
  Other functions
*/

function getId(){
  return Object.create(null);
}

function setBlackCirc(x, y){
  var d = get(x, y);
  if(d.wall) cwall(x, y);
  blackCirc = new Vector(x, y);
  d.circ = 1;
}

function isLineTouching(x, y, dir){
  if(gdire(x, y, dir, 1) || gdire(x, y, dir - 1 & 3, 1) || gdire(x, y, dir + 1 & 3, 1))
    return true;

  var xx = x, yy = y;
  var d;

  ({x, y, d} = ndir(xx, yy, dir, 1));
  if(d && (gdire(x, y, dir - 1 & 3, 1) || gdire(x, y, dir + 1 & 3, 1))) return true;

  ({x, y, d} = ndir(xx, yy, dir - 1 & 3, 1));
  if(d && gdire(x, y, dir, 1)) return true;

  ({x, y, d} = ndir(xx, yy, dir + 1 & 3, 1));
  if(d && gdire(x, y, dir, 1)) return true;

  return false;
}

function findMinCoords(xMin, yMin, x, y){
  if(y < yMin){
    xMin = x;
    yMin = y;
  }else if(y === yMin && x < xMin){
    xMin = x;
  }

  return [xMin, yMin];
}

function compareCoordsAndDir(xMin, yMin, dirMin, x, y, dir){
  if(dirMin === 2){
    dirMin = 0;
    yMin++;
  }else if(dirMin === 3){
    dirMin = 1;
    xMin++;
  }

  if(dir === 2){
    dir = 0;
    y++;
  }else if(dir === 3){
    dir = 1;
    x++;
  }

  if(y < yMin) return true;
  if(y > yMin) return false;
  if(dir === dirMin) return x < xMin;
  return dir === 0;
}

function sortCoords(coords){
  coords.sort(([x1, y1], [x2, y2]) => {
    if(y1 < y2) return -1;
    if(y1 > y2) return 1;
    if(x1 < x2) return -1;
    return 1;
  });

  return coords;
}

function findMinPathElem(elems){
  if(elems.length === 1)
    return elems[0];

  var len = elems[0][3].length - 1;

  var coords = elems.map(([x, y, d, path], index) => {
    var coords = [];
    coords.index = index;

    for(var i = len; i >= 1; i--){
      ({x, y} = ndir(x, y, path[i] + 2 & 3));
      coords.push([x, y]);
    }

    return sortCoords(coords);
  });

  for(var i = 0; i < len; i++){
    var [xMin, yMin] = coords[0][i];

    coords.forEach(coords => {
      var [x, y] = coords[i];

      if(y < yMin || (y === yMin && x < xMin)){
        xMin = x;
        yMin = y;
      }
    });

    coords = coords.filter(coords => {
      var [x, y] = coords[i];

      return x === xMin && y === yMin;
    });

    if(coords.length === 1)
      break;
  }

  return elems[coords[0].index];
}

function dirGt(dir1, dir2){
  return dirIndex(dir1) > dirIndex(dir2);
}

function dirLt(dir1, dir2){
  return dirIndex(dir1) < dirIndex(dir2);
}

function dirGe(dir1, dir2){
  return dirIndex(dir1) >= dirIndex(dir2);
}

function dirLe(dir1, dir2){
  return dirIndex(dir1) <= dirIndex(dir2);
}

function dirIndex(dir){
  return dir ^ (dir >> 1);
}

function dirsNum(x, y){
  return gdir(x, y, 0) + gdir(x, y, 1) + gdir(x, y, 2) + gdir(x, y, 3);
}

function isVoid(x, y){
  var d = get(x, y, 1);
  return d === null || d.void;
}

function gdir(x, y, dir, advanced){
  var d = get(x, y, advanced);

  if(d === null){
    var obj = ndir(x, y, dir, advanced);
    if((d = obj.d) === null) return 1;

    x = obj.x;
    y = obj.y;

    dir = dir + 2 & 3;
  }

  if(d.wall || (d.dir & (1 << dir))) return 1;
  if((d = ndir(x, y, dir, advanced).d) && d.wall) return 1;
  return 0;
}

function sdir(x, y, dir){
  var advanced = 1;
  var d = get(x, y, advanced);
  var d1 = ndir(x, y, dir, advanced).d;

  if((d === null || d.void) && (d1 === null || d1.void))
    return;

  if(d !== null) d.dir |= 1 << dir;
  if(d1 !== null) d1.dir |= 1 << (dir + 2 & 3);
}

function cdir(x, y, dir){
  var advanced = 1;
  var d = get(x, y, advanced);

  if(d !== null) d.dir &= ~(1 << dir);
  if((d = ndir(x, y, dir, advanced).d) !== null) d.dir &= ~(1 << (dir + 2 & 3));
}

function gdirs(x, y, advanced){
  return gdir(x, y, 0, advanced) | (gdir(x, y, 1, advanced) << 1) | (gdir(x, y, 2, advanced) << 2) | (gdir(x, y, 3, advanced) << 3);
}

function gdire(x, y, dir, advanced){
  var d = ndir(x, y, dir, advanced).d;

  if(d === null || d.wall || d.void || d.ext)
    return gdir(x, y, dir, advanced);

  return false;
}

function sdirs(x, y, advanced){
  iterateDirs(dir => sdir(x, y, dir, advanced));
}

function cdirs(x, y, advanced){
  iterateDirs(dir => cdir(x, y, dir, advanced));
}

function ndir(x, y, dir, advanced){
  x += (dir === 3) - (dir === 1) | 0;
  y += (dir === 2) - (dir === 0) | 0;

  return {
    x, y,
    d: get(x, y, advanced),
  };
}

function scirc(x, y, type){
  var d = get(x, y, 1);
  if(d === null || d.circ === type) return;

  if(d.void) cvoid(x, y);
  else if(d.wall) cwall(x, y, 1);

  d.circ = type;
}

function ccirc(x, y, type){
  var d = get(x, y, 1);
  if(d === null || d.void || d.circ !== type) return;

  d.circ = 0;
}

function swall(x, y){
  var d = get(x, y, 1);
  if(d === null || d.wall) return;

  if(d.void) cvoid(x, y);
  else if(d.circ) d.circ = 0;

  d.wall = 1;
  sdirs(x, y);
}

function cwall(x, y){
  var d = get(x, y, 1);
  if(d === null || !d.wall) return;

  d.wall = 0;
  sdirs(x, y);
}

function svoid(x, y){
  var d = get(x, y, 1);
  if(d === null || d.void) return;

  d.internal = 0;
  if(d.circ) d.circ = 0;
  else if(d.wall) cwall(x, y);

  adjacent(x, y, (x1, y1, d1, dir) => {
    if(d1 === null) cdir(x, y, dir);
  });

  d.void = 1;
}

function cvoid(x, y){
  var d = get(x, y, 1);
  if(d === null || !d.void) return;

  d.void = 0;
}