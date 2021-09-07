'use strict';

const assert = require('assert');;
const colors = require('../colors');
const Scoreboard = require('../scoreboard');
const Animation = require('./animation');
const Tile = require('./tile');

const {min, max, floor} = Math;
const {pi2} = O;

const {Move, Grow, Explode} = Animation;

const SMALL_ITEMS_PER_MOVE = 3;

const RADIUS_BIG = .35;
const RADIUS_SMALL = .1;

const ITEM_MOVE_SPEED = .3;
const ITEM_GROW_SPEED = .1;
const ITEM_EXPLODE_SPEED = .08;

const tileSize = 60;
const w = O.urlParam('w', 9) | 0;
const h = O.urlParam('h', 9) | 0;

const fontFamily = 'arial';
const fontSize = 32;
const textOffset = 10;

const {g} = O.ceCanvas(1);

const itemsNum = 8;

const cols = O.rec(formatCols, {
  bg: [169, 169, 169],
  tileBg: [128, 128, 128],
  selected: [200, 200, 200],
});

cols.items = colors.get(itemsNum);

const scoreboard = new Scoreboard();

let time = O.now;

const grid = createGrid();
const anims = [];

let points;
let gameOver = 0;

let selected;
let persistInfo;
let growthStage;

const main = () => {
  g.textBaseline = 'top';
  g.textAlign = 'left';
  g.font(fontSize);

  newGame();
  resize();
  aels();
  render();
};

const newGame = () => {
  points = 0;
  anims.length = 0;

  selected = null;
  persistInfo = null;
  growthStage = 0;

  grid.iter((x, y, d) => {
    d.item = null;
  });

  putSmallItems();
  grow();
  putSmallItems();

  // grid.iter((x, y, d) => {
  //   if(x||y){
  //     d.item = 1;
  //     d.big = 1;
  //   }
  // });
};

const aels = () => {
  let cx = 0;
  let cy = 0;
  let has = 0;

  const updateCoords = evt => {
    const {iw, ih} = O;

    cx = floor(evt.clientX / tileSize + (w - iw / tileSize) / 2);
    cy = floor(evt.clientY / tileSize + (h - ih / tileSize) / 2);
    has = grid.has(cx, cy);
  };

  O.ael('keydown', evt => {
    if(gameOver) return;

    (async () => {
      const {code} = evt;

      if(code === 'KeyR'){
        newGame();
        return;
      }

      // await O.await(() => !hasAnims(), 16);
      if(hasAnims()) return;

      if(code === 'Enter'){
        afterMove();
        return;
      }
    })().catch(log);
  });

  O.ael('mousedown', evt => {
    if(gameOver) return;

    (async () => {
      await O.await(() => !hasAnims(), 16);

      updateCoords(evt);

      const {button} = evt;

      if(button === 0){
        if(!has){
          selected = null;
          return;
        }

        const target = grid.get(cx, cy);

        if(target === selected){
          selected = null;
          return;
        }

        if(!target.isEmpty && target.big){
          selected = target;
          return;
        }

        if(selected === null) return;

        const pth = grid.path(selected.x, selected.y, (x, y, d) => {
          if(d === target) return 2;
          if(d === null) return 0;
          if(d.isEmpty) return 1;
          if(d.big) return 0;
          return 1;
        });

        if(pth === null) return;

        addAnim(new Move(time, selected, target, pth));
        selected = null;

        return;
      }

      if(button === 2){
        selected = null;
        return;
      }
    })().catch(log);
  });

  O.ael('contextmenu', evt => {
    O.pd(evt);
  });

  O.ael('resize', evt => {
    resize();
  });
};

const resize = () => {
  g.resize(O.iw, O.ih);
};

const render = () => {
  time = O.now;

  const {iw, ih} = O;
  const iwh = iw / 2;
  const ihh = ih / 2;

  g.resetTransform();
  g.fillStyle = cols.bg;
  g.fillRect(0, 0, iw, ih);

  g.fillStyle = 'black';
  g.fillText(`Points: ${points}`, textOffset, textOffset);

  g.translate(iwh - 1, ihh - 1);
  g.scale(tileSize);
  g.translate(-w / 2, -h / 2);

  grid.iter((x, y, d) => {
    const isSelected = d === selected;
    g.fillStyle = isSelected ? cols.selected : cols.tileBg;
    g.fillRect(x, y, 1, 1);

    if(d.isEmpty) return;
    if(animsAffect(d)) return;

    setCol(d.item);
    g.beginPath();

    const radius = d.big ? RADIUS_BIG : RADIUS_SMALL;
    g.arc(x + .5, y + .5, radius, 0, pi2);

    g.fill();
    g.stroke();
  });

  g.beginPath();
  for(let y = 0; y <= h; y++){
    g.moveTo(0, y);
    g.lineTo(w, y);
  }
  for(let x = 0; x <= w; x++){
    g.moveTo(x, 0);
    g.lineTo(x, h);
  }
  g.stroke();

  if(persistInfo !== null){
    const [tile, item] = persistInfo;
    const {x, y} = tile;

    setCol(item);
    g.beginPath();
    g.arc(x + .5, y + .5, RADIUS_SMALL, 0, pi2);
    g.fill();
    g.stroke();
  }

  let len = anims.length;
  let exploded = 0;

  animsLoop: for(let i = 0; i !== len; i++){
    const anim = anims[i];

    const remove = () => {
      anims.splice(i, 1);
      len--;
      i--;
    };

    if(anim instanceof Move){
      const {startTime, start, end, pth} = anim;
      const timeOffset = time - startTime;
      const spOffset = (timeOffset / 1e3 * 60) * ITEM_MOVE_SPEED;
      const index = floor(spOffset);

      const render = (x, y, item) => {
        setCol(item);
        g.beginPath();
        g.arc(x + .5, y + .5, RADIUS_BIG, 0, pi2);
        g.fill();
        g.stroke();
      };

      const renderDefault = () => {
        render(end.x, end.y, end.item);
      };

      if(index >= pth.length){
        remove();

        const persistSmallItem = !hasEmptyTiles();

        const item1 = start.item;
        const item2 = end.item;
        const big = end.big;

        end.item = item1;
        end.big = 1;

        if(persistSmallItem){
          start.item = item2;
          start.big = big;
        }else{
          start.item = null;
        }

        if(afterMove())
          if(!persistSmallItem && item2 !== null && animsAffect(end, Explode))
            persistInfo = [end, item2];

        renderDefault();
        continue animsLoop;
      }

      anim.progress(index);

      const x1 = anim.x;
      const y1 = anim.y;

      let x2 = x1;
      let y2 = y1;

      switch(pth[index]){
        case 0: y2--; break;
        case 1: x2++; break;
        case 2: y2++; break;
        case 3: x2--; break;
      }

      const k1 = 1 - spOffset % 1;
      const k2 = 1 - k1;
      const x = x1 * k1 + x2 * k2;
      const y = y1 * k1 + y2 * k2;

      render(x, y, start.item);
      continue;
    }

    if(anim instanceof Grow){
      const {startTime, tile} = anim;
      const timeOffset = time - startTime;
      const spOffset = min((timeOffset / 1e3 * 60) * ITEM_GROW_SPEED, 1);

      const k1 = 1 - spOffset;
      const k2 = 1 - k1;
      const radius = RADIUS_SMALL * k1 + RADIUS_BIG * k2;

      setCol(tile.item);
      g.beginPath();
      g.arc(tile.x + .5, tile.y + .5, radius, 0, pi2);
      g.fill();
      g.stroke();

      if(spOffset === 1){
        tile.big = 1;
        remove();
      }

      continue;
    }

    if(anim instanceof Explode){
      const {startTime, tile} = anim;
      const timeOffset = time - startTime;
      const spOffset = min((timeOffset / 1e3 * 60) * ITEM_EXPLODE_SPEED, 1);

      const k1 = 1 - spOffset;
      const k2 = 1 - k1;
      const radius = RADIUS_BIG * k1 + (RADIUS_BIG * 2) * k2;
      const alpha = 1 * k1 + 0 * k2;

      g.globalAlpha = alpha;
      setCol(tile.item);
      g.beginPath();
      g.arc(tile.x + .5, tile.y + .5, radius, 0, pi2);
      g.fill();
      g.stroke();
      g.globalAlpha = 1;

      if(spOffset === 1){
        tile.item = null;
        exploded = 1;
        remove();
      }

      continue;
    }

    assert.fail();
  }

  if(!hasAnims()){
    if(persistInfo !== null){
      const [tile, item] = persistInfo;

      tile.item = item;
      tile.big = 0;

      persistInfo = null;
    }

    checkGrowthStage: if(growthStage !== 0){
      if(growthStage === 1){
        growthStage = 2;

        if(checkMatches())
          break checkGrowthStage;
      }

      if(growthStage === 2){
        putSmallItems();
        growthStage = 0;
        break checkGrowthStage;
      }

      assert.fail();
    }

    addExtraItems: if(exploded){
      const hasBigItems = grid.some((x, y, d) => {
        return d.item !== null && d.big;
      });

      if(hasBigItems)
        break addExtraItems;

      const hasSmallItems = grid.some((x, y, d) => {
        return d.item !== null;
      });

      if(!hasSmallItems)
        putSmallItems();

      grow();
      putSmallItems();
    }
  }

  O.raf(render);
};

const afterMove = () => {
  if(checkMatches())
    return 1;

  grow();
  growthStage = 1;

  return 0;
};

const setCol = item => {
  assert(typeof item === 'number');
  assert(item === (item | 0));
  assert(item >= 0 && item < itemsNum);

  g.fillStyle = cols.items[item];
};

const hasAnims = () => {
  return anims.length !== 0;
};

const addAnim = anim => {
  anims.push(anim);
};

const animsAffect = (tile, ctor=null) => {
  return anims.some(anim => {
    if(!anim.affects(tile)) return 0;
    if(ctor !== null && !(anim instanceof ctor)) return 0;
    return 1;
  });
};

const checkMatches = () => {
  const matched = new Set();

  grid.iter((x, y, d) => {
    if(d.isEmpty) return;
    if(!d.big) return;

    const {item} = d;

    const followDir = (dx, dy) => {
      const m = new Set([d]);

      let x1 = x + dx;
      let y1 = y + dy;

      while(1){
        const d1 = grid.get(x1, y1);

        if(d1 === null) break;
        if(d1.isEmpty) break;
        if(!d1.big) break;
        if(d1.item !== item) break;

        m.add(d1);

        x1 += dx;
        y1 += dy;
      }

      if(m.size >= 5)
        for(const d of m)
          matched.add(d);
    };

    followDir(-1, 1);
    followDir(1, 0);
    followDir(1, 1);
    followDir(0, 1);
  });

  if(matched.size === 0)
    return 0;

  for(const d of matched){
    addAnim(new Explode(time, d));
    points++;
  }

  return 1;
};

const grow = () => {
  grid.iter((x, y, d) => {
    if(d.isEmpty) return;
    if(d.big) return;

    addAnim(new Grow(time, d));
  });
};

const putSmallItems = () => {
  let cnt = 0;

  for(let i = 0; i !== SMALL_ITEMS_PER_MOVE; i++){
    if(!putSmallItem()) break;
    cnt++;
  }

  if(cnt === 0){
    gameOver = 1;

    scoreboard.open(points, () => {
      gameOver = 0;
      newGame();
    });
  }
};

const putSmallItem = () => {
  const d = getRandEmptyTile();
  if(d === null) return 0;

  d.item = O.rand(itemsNum);
  d.big = 0;

  return 1;
};

const getRandEmptyTile = () => {
  const emptyTiles = getEmptyTiles();
  if(emptyTiles.length === 0) return null;

  return O.randElem(emptyTiles);
};

const hasEmptyTiles = () => {
  return getEmptyTiles().length !== 0;
};

const getEmptyTiles = () => {
  const tiles = [];

  grid.iter((x, y, d) => {
    if(d.isEmpty)
      tiles.push(d);
  });

  return tiles;
};

function createGrid(){
  return new O.Grid(w, h, (x, y) => {
    return new Tile(x, y);
  });
}

function *formatCols(cols){
  if(O.isArr(cols)){
    if(typeof cols[0] === 'number'){
      assert(cols.length === 3);
      return `#${[...cols].map(a => O.hex(a, 1)).join('')}`;
    }

    const colsNew = [];

    for(const col of cols)
      colsNew.push(yield [formatCols, col]);

    return colsNew;
  }

  const colsNew = O.obj();

  for(const key of O.keys(cols))
    colsNew[key] = yield [formatCols, cols[key]];

  return colsNew;
}

main();