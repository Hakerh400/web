'use strict';

const DraggableCanvas = require('../draggable-canvas');
const LS = require('./local-strings');
const Button = require('./button');
const BGShape = require('./bg-shape');
const fileLoader = require('./file-loader');
const Grid = require('./grid');
const Tile = require('./tile');
const AI = require('./ai');
const colors = require('./colors');
const links = require('./links');

const {min, max, floor, ceil, round, sin, cos} = Math;
const {pi, pi2, pih, pi4, pi32, pi34} = O;

const SEARCH_DEPTH_BOUNDS = [1, 10];

const TITLE_FONT = 50;
const TITLE_OFFSET = 85;

const BTN_FONT = 24;
const BTN_WIDTH = 400;
const BTN_HEIGHT = 50;
const BTN_CORNER_RADIUS = 15;
const BTN_SPACE = 10;
const BTN_SELECTED_SCALE = 1.1;
const BTN_RESIZE_TIME = .25e3;

const BG_SHAPES_NUM = 10;
const BG_SHAPE_DIAM = [30, 80];
const BG_SHAPE_SPEED = [1, 2];
const BG_SHAPE_ROT_SPEED = [pi / 300, pi / 150];

const ERR_FONT = 24;
const ERR_OFFSET = 20;

const TILE_SIZE = 80;
const DOT_RADIUS = .15;
const DOT_SHADOW_OFFSET = DOT_RADIUS / 5;
const LINE_CURVATURE = .135;

const main = () => {
  O.body.classList.add('has-canvas');

  for(const dcType of O.keys(colors)){
    const cols = colors[dcType];

    for(const colName of O.keys(cols)){
      const col = cols[colName];
      cols[colName] = O.Color.from(col).toString();
    }
  }

  // const s = 4;
  // const grid = new Grid(s, s);
  // createWorld({
  //   "play": 1,
  //   "player1": [
  //     0
  //   ],
  //   "player2": [
  //     1,
  //     1,
  //     8,
  //   ],
  //   "gridInfo": [
  //     0,
  //     0,
  //     0,
  //     grid,
  //   ],
  //   "autoPlay": true
  // }).show();
  // return;

  createMenu().show();
};

const createMenu = () => {
  const {
    menu: {titles, buttons: btns},
    errors: errs,
  } = LS;

  const sizeBtns = O.ca(9, i => String(i + 1));

  const opts = O.arr2obj([
    'play',
    'player1',
    'player2',
    'gridInfo',
    'autoPlay',
  ], null);

  const getPlayerId = () => {
    const p1 = opts.player1;
    const p2 = opts.player2;
    const p = p1 !== null && p1[0] === 1 && p1.length === 1 ? 1 :
      p2 !== null && p2[0] === 1 && p2.length === 1 ? 2 : null;

    return p;
  };

  const askForPlayerInfo = cb => {
    const p = getPlayerId();
    if(p === null) return cb();

    const pstr = `player${p}`;
    const forStr = ` ${titles.for} ${titles[pstr]}`;
    const info = opts[pstr];

    const getTitle = opt => {
      return titles[opt] + forStr;
    };

    menu.update(getTitle('strength'), [
      btns.beginner,
      btns.advanced,
      btns.pro,
    ], opt => {
      info.push(opt);

      let depth = 3;

      const inc = () => {
        if(depth !== SEARCH_DEPTH_BOUNDS[1]) depth++;
      };

      const dec = () => {
        if(depth !== SEARCH_DEPTH_BOUNDS[0]) depth--;
      };

      const depthStr = () => {
        return `${getTitle('depth')}: ${depth}`;
      };

      const onUpdateDepth = opt => {
        if(opt === 0) return finish();
        else if(opt === 1) inc();
        else if(opt === 2) dec();

        menu.title = depthStr();
      };

      const finish = () => {
        info.push(depth);
        cb();
      };

      menu.update(depthStr(), [
        btns.ok,
        btns.increment,
        btns.decrement,
      ], onUpdateDepth);
    });
  };

  const onPickOpt = opt => {
    if(opts.play === null){
      if(opt === 1){
        menu.pause();
        location.href = links.gameInfo;
        return;
      }

      opts.play = 1;

      return menu.update(titles.player1, [
        btns.human,
        btns.computer,
      ]);
    }

    if(opts.player1 === null){
      opts.player1 = [opt];

      return askForPlayerInfo(() => {
        menu.update(titles.player2, [
          btns.human,
          btns.computer,
        ], onPickOpt);
      });
    }

    if(opts.player2 === null){
      opts.player2 = [opt];

      return askForPlayerInfo(() => {
        menu.update(titles.createGame, [
          btns.newGame,
          btns.loadGame,
        ], onPickOpt);
      });
    }

    const gridInfo = opts.gridInfo;

    if(gridInfo === null){
      if(opt === 0){
        opts.gridInfo = [0];
        return menu.update(titles.gridWidth, sizeBtns);
      }

      menu.pause();

      fileLoader.load().then(buf => {
        if(buf === null){
          menu.resume();
          return;
        }

        const str = buf.toString().trimRight();
        if(str === '') return menu.err(errs.missingGridSize);

        const lines = O.sanl(str);
        const match = lines[0].match(/^([1-9]) ([1-9])$/);
        if(match === null) return menu.err(errs.invalidSize);

        const w = match[1] | 0;
        const h = match[2] | 0;
        const grid = new Grid(w, h);

        for(let i = 1; i !== lines.length; i++){
          const err = msg => {
            menu.err(`${errs.errAtLine} ${i + 1}: ${msg}`, 0);
          };

          const line = lines[i].toLowerCase();
          if(line.length !== 2) return err(errs.expectedTwoChars);

          const c1 = line[0];
          const c2 = line[1];

          const d1 = /[0-9]/.test(c1);
          const d2 = /[0-9]/.test(c2);
          const w1 = /[a-z]/.test(c1);
          const w2 = /[a-z]/.test(c2);

          if(d1 + d2 !== 1 || w1 + w2 !== 1 || d1 + w2 === 1 || w1 + d2 === 1)
            return err(errs.invalidMove);

          const cc1 = O.cc(c1);
          const cc2 = O.cc(c2);

          const type = d1 ? 0 : 1;
          const x = cc2 - (type === 0 ? 97 : 48);
          const y = cc1 - (type === 1 ? 97 : 48);

          const tile = grid.get(x, y);
          if(tile === null || (x === w && type === 0) || (y === h && type === 1)) return err(errs.outsideGrid);
          if(type ? tile.dir2 : tile.dir1) return err(errs.duplicateLine);

          if(grid.setLine(x, y, type) === 0)
            grid.currentPlayer ^= 1;
        }

        opts.gridInfo = [1, grid];
        nextMenuOpts();
      }).catch(err => {
        throw err;
        menu.err(err.message, 0);
        menu.resume();
      });

      return;
    }

    if(gridInfo[0] === 0 && gridInfo.length !== 4){
      if(gridInfo.length === 1){
        gridInfo.push(opt + 1);
        return menu.update(titles.gridHeight, sizeBtns);
      }

      if(gridInfo.length === 2){
        gridInfo.push(opt + 1);
        gridInfo.push(new Grid(gridInfo[1], gridInfo[2]));
        return nextMenuOpts();
      }
    }
  };

  const nextMenuOpts = () => {
    const startGame = () => {
      menu.replaceWith(createWorld(opts));
    };

    if(opts.player1[0] === 1 || opts.player2[0] === 1){
      return menu.update(titles.simulationMode, [
        btns.batchOfMoves,
        btns.stepByStep,
      ], opt => {
        opts.autoPlay = opt === 0;
        startGame();
      });
    }

    startGame();
  };

  const menu = new Menu(titles.intro, [
    btns.play,
    btns.info,
  ], onPickOpt);

  return menu;
};

const createDc = () => {
  const dc = new DraggableCanvas(O.body);
  const {g} = dc;

  dc.setDraggable(0);
  dc.setResizable(0);

  g.lineWidth = 1 / TILE_SIZE;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.textBaseline = 'middle';
  g.textAlign = 'center';

  return dc;
};

class Menu{
  constructor(title, btns, cb){
    const dc = this.dc = createDc();
    const {g} = dc;
    const t = O.now;

    this.update(title, btns, cb);

    const cols = colors.menu;
    const bw1 = this.bw1 = BTN_WIDTH;
    const bh1 = this.bh1 = BTN_HEIGHT;
    const bw2 = this.bw2 = bw1 * BTN_SELECTED_SCALE;
    const bh2 = this.bh2 = bh1 * BTN_SELECTED_SCALE;
    const br = BTN_CORNER_RADIUS;
    const dt = BTN_RESIZE_TIME;
    const shd = BG_SHAPE_DIAM[1];

    const createBGShape = (t, x, y) => {
      const r = O.randf(BG_SHAPE_DIAM[0], BG_SHAPE_DIAM[1]) / 2;
      const verts = O.randInt(3, .5);
      const dir = -O.randf(pih);
      const rot = O.randf(pi2);
      const speed = O.randf(BG_SHAPE_SPEED[0], BG_SHAPE_SPEED[1]);
      const rotSpeed = O.randf(BG_SHAPE_ROT_SPEED[0], BG_SHAPE_ROT_SPEED[1]) * (O.rand(2) ? 1 : -1);

      return new BGShape(t, x, y, r, verts, dir, rot, speed, rotSpeed);
    };

    const bgShapes = O.ca(BG_SHAPES_NUM, () => {
      const {wh, hh} = dc;

      return createBGShape(t, O.randf(-wh, wh), O.randf(-hh, hh));
    });

    dc.setBg(cols.bg);

    const select = index => {
      const {btns} = this;
      const t = O.now;

      if(this.selectedIndex !== -1){
        const btn = btns[this.selectedIndex];
        const {tr} = btn;

        if(tr === null) btn.tr = [t, 1, 0];
        else btn.tr = [t, tr[1] + (t - tr[0]) / dt * min((tr[2] - tr[1]), 1), 0];

        btn.selected = 0;
      }

      const btn = btns[index];
      const {tr} = btn;
      
      if(tr === null) btn.tr = [t, 0, 1];
      else btn.tr = [t, tr[1] + (t - tr[0]) / dt * min((tr[2] - tr[1]), 1), 1];

      btn.selected = 1;
      this.selectedIndex = index;
    };

    dc.renderFunc = (x1, y1, x2, y2) => {
      const {title, btns, errMsg} = this;
      const {wh, hh} = dc;
      const t = O.now;

      g.strokeStyle = cols.bgShape;
      g.lineWidth = 5;

      for(let i = 0; i !== BG_SHAPES_NUM; i++){
        const shape = bgShapes[i];
        const {dir, speed} = shape;

        const dt = (t - shape.t) / 60;
        const offset = dt * speed;
        const rot = shape.rot + shape.rotSpeed * dt;

        const x = shape.x + cos(dir) * offset;
        const y = shape.y + sin(dir) * offset;

        if(x > x2 + shd || y < y1 - shd){
          const d = BG_SHAPE_DIAM[1] * 2;

          const shape = O.rand(2) ?
            createBGShape(t, -wh - d, O.randf(-hh, hh)) :
            createBGShape(t, O.randf(-wh, wh), hh + d);

          bgShapes[i] = shape;
          continue;
        }

        g.beginPath();
        O.drawPolygon(g, x, y, shape.r, shape.verts, rot);
        g.stroke();
      }

      dc.font = TITLE_FONT;
      g.lineWidth = 7;
      g.fillStyle = cols.titleFill;
      g.strokeStyle = cols.titleStroke;
      g.strokeText(title, 0, -hh + TITLE_OFFSET);
      g.fillText(title, 0, -hh + TITLE_OFFSET);
      dc.font = BTN_FONT;

      let y = (btns.length - 1) * BTN_SPACE;
      for(const btn of btns) y += btn.h;
      y = -y / 2;

      if(errMsg !== null){
        g.fillStyle = cols.err;
        g.fillText(errMsg, 0, y - btns[0].h / 2 - ERR_OFFSET);
      }

      for(const btn of btns){
        let {tr} = btn;

        if(tr !== null && t - tr[0] > BTN_RESIZE_TIME)
          tr = btn.tr = null;

        const k = tr !== null ?
          tr[1] + (t - tr[0]) / dt * (tr[2] - tr[1]) :
          btn.selected ? 1 : 0;

        const bw = btn.w = bw1 + (bw2 - bw1) * k;
        const bh = btn.h = bh1 + (bh2 - bh1) * k;
        const bwh = bw / 2;
        const bhh = bh / 2;

        y += bhh;

        g.lineWidth = 2;
        g.strokeStyle = cols.line;
        g.beginPath();
        g.arc(-bwh + br, y - bhh + br, br, pi, pi32);
        g.lineTo(bwh - br, y - bhh);
        g.arc(bwh - br, y - bhh + br, br, pi32, pi2);
        g.lineTo(bwh, y + bhh - br);
        g.arc(bwh - br, y + bhh - br, br, 0, pih);
        g.lineTo(-bwh + br, y + bhh);
        g.arc(-bwh + br, y + bhh - br, br, pih, pi);
        g.closePath();
        g.fillStyle = cols.btn;
        g.fill();
        g.globalAlpha = k;
        g.fillStyle = cols.btnSelected;
        g.fill();
        g.globalAlpha = 1;
        g.stroke();

        g.fillStyle = cols.btnText;
        g.fillText(btn.label, 0, y);

        if(btn.selected){
          g.lineWidth = 1;
          g.fillStyle = cols.btnCursor;
          g.beginPath();
          O.drawStar(g, -bwh - bhh, y, bhh * .15, bhh * .5, 5, O.now / 2e3);
          g.fill();
          g.stroke();
        }

        y += bhh + BTN_SPACE;
      }
    };

    dc.onKeyDown = evt => {
      const {btns, selectedIndex} = this;

      switch(evt.code){
        case 'ArrowUp': case 'ArrowLeft':
          select((selectedIndex + btns.length - 1) % btns.length);
          break;

        case 'ArrowDown': case 'ArrowRight':
          select((selectedIndex + 1) % btns.length);
          break;

        case 'Enter': case 'Space':
          this.cb(selectedIndex);
          break;
      }
    };
  }

  show(cb){
    this.dc.show(cb);
    return this;
  }

  hide(cb){
    this.dc.hide(cb);
    return this;
  }

  pause(){
    this.dc.pause();
    return this;
  }

  resume(){
    this.dc.resume();
    return this;
  }

  replaceWith(dc, cb){
    this.dc.replaceWith(dc, cb);
    return this;
  }

  remove(cb){
    this.dc.remove(cb);
    return this;
  }

  update(title, btns, cb=this.cb){
    const {bw1, bh1, bw2, bh2} = this;

    this.btns = btns.map((label, index) => {
      if(index === 0) return new Button(label, bw2, bh2, 1);
      return new Button(label, bw1, bh1, 0);
    });

    this.title = title;
    this.cb = cb;
    this.selectedIndex = 0;
    this.errMsg = null;

    return this.resume();
  }

  err(msg, prependErrStr=1){
    if(prependErrStr) msg = `${LS.error}: ${msg}`;
    this.errMsg = msg;
    this.resume();
  }
};

const createWorld = opts => {
  const {player1, player2, gridInfo} = opts;

  const dc = createDc();
  const {g} = dc;

  const cols = colors.world;

  dc.setScale(TILE_SIZE);
  dc.setBg(cols.bg);
  dc.setResizable(1);

  const grid = O.last(gridInfo);
  const gw = grid.w - 1;
  const gh = grid.h - 1;

  const playerTypes = [player1[0], player2[0]];
  const ai = AI.create(grid, player1, player2);
  const {autoPlay} = opts;

  let nextLine = null;

  const centerDisplay = () => {
    dc.setTranslate(gw / 2 - .5, gh / 2 - .5);
  };

  const calcNextLine = (x, y) => {
    nextLine = null;

    x += .5;
    y += .5;

    let xx = floor(x);
    let yy = floor(y);
    let xf = x - xx;
    let yf = y - yy;
    let type;

    if(xf > yf){
      if(xf < 1 - yf){
        type = 0;
      }else{
        type = 1;
        xx++;
      }
    }else{
      if(yf < 1 - xf){
        type = 1;
      }else{
        type = 0;
        yy++;
      }
    }

    if(!grid.has(xx, yy) || (xx === gw && type === 0) || (yy === gh && type === 1)) return;
    nextLine = [xx, yy, type];
  };

  const setLine = line => {
    const [x, y, type] = line;
    const n = grid.setLine(x, y, type)

    if(n === 0)grid.currentPlayer ^= 1;
    return n;
  };

  const play = () => {
    const n = ai[grid.currentPlayer].play();

    if(n === 0) grid.currentPlayer ^= 1;
    return n;
  };

  const exportGame = () => {
    const link = O.doc.createElement('a');

    link.target = '_blank';
    link.download = 'game.txt';
    link.href = `data:text/plain;base64,${O.base64.encode(grid.getExportStr())}`;

    link.click();
  };

  dc.renderFunc = (x1, y1, x2, y2) => {
    x1 = floor(x1);
    y1 = floor(y1);

    g.setLineDash([.2, .3]);
    g.lineWidth = 5 / TILE_SIZE;
    g.strokeStyle = cols.gridBoundary;
    g.strokeRect(-.5, -.5, gw, gh);
    g.setLineDash([]);

    const xx1 = max(x1 - 2, 0);
    const yy1 = max(y1 - 2, 0);
    const xx2 = min(x2 + 2, gw + 1);
    const yy2 = min(y2 + 2, gh + 1);

    for(let y = yy1; y < yy2; y++){
      for(let x = xx1; x < xx2; x++){
        const {player} = grid.get(x, y);

        if(player !== null){
          g.fillStyle = player === 0 ? cols.player1 : cols.player2;
          g.fillRect(x - .5, y - .5, 1, 1);
        }
      }
    }

    g.fillStyle = cols.line;

    for(let y = yy1; y < yy2; y++){
      for(let x = xx1; x < xx2; x++){
        const tile = grid.get(x, y);

        if(tile.dir1){
          g.beginPath();
          g.moveTo(x - .5, y - .5 - DOT_RADIUS);
          O.drawArc(g, x - .5, y - .5 - DOT_RADIUS, x + .5, y - .5 - DOT_RADIUS, -LINE_CURVATURE);
          g.lineTo(x + .5, y - .5 + DOT_RADIUS);
          O.drawArc(g, x + .5, y - .5 + DOT_RADIUS, x - .5, y - .5 + DOT_RADIUS, -LINE_CURVATURE);
          g.closePath();
          g.fill();
        }

        if(tile.dir2){
          g.beginPath();
          g.moveTo(x - .5 - DOT_RADIUS, y - .5);
          O.drawArc(g, x - .5 - DOT_RADIUS, y - .5, x - .5 - DOT_RADIUS, y + .5, LINE_CURVATURE);
          g.lineTo(x - .5 + DOT_RADIUS, y + .5);
          O.drawArc(g, x - .5 + DOT_RADIUS, y + .5, x - .5 + DOT_RADIUS, y - .5, LINE_CURVATURE);
          g.closePath();
          g.fill();
        }
      }
    }

    drawNextLine: if(nextLine !== null){
      const [x, y, type] = nextLine;
      const tile = grid.get(x, y);
      if(type ? tile.dir2 : tile.dir1) break drawNextLine;

      g.fillStyle = grid.currentPlayer === 0 ? cols.player1 : cols.player2;
      g.globalAlpha = .5;
      g.beginPath();
      if(type === 0){
        g.moveTo(x - .5, y - .5 - DOT_RADIUS);
        O.drawArc(g, x - .5, y - .5 - DOT_RADIUS, x + .5, y - .5 - DOT_RADIUS, -LINE_CURVATURE);
        g.lineTo(x + .5, y - .5 + DOT_RADIUS);
        O.drawArc(g, x + .5, y - .5 + DOT_RADIUS, x - .5, y - .5 + DOT_RADIUS, -LINE_CURVATURE);
      }else{
        g.moveTo(x - .5 - DOT_RADIUS, y - .5);
        O.drawArc(g, x - .5 - DOT_RADIUS, y - .5, x - .5 - DOT_RADIUS, y + .5, LINE_CURVATURE);
        g.lineTo(x - .5 + DOT_RADIUS, y + .5);
        O.drawArc(g, x - .5 + DOT_RADIUS, y + .5, x - .5 + DOT_RADIUS, y - .5, LINE_CURVATURE);
      }
      g.closePath();
      g.fill();
      g.globalAlpha = 1;
    }

    for(let y = y1 - 2; y < y2 + 2; y++){
      for(let x = x1 - 2; x < x2 + 2; x++){
        g.fillStyle = cols.dotShadow;
        g.beginPath();
        g.arc(x - .5 + DOT_SHADOW_OFFSET, y - .5 + DOT_SHADOW_OFFSET, DOT_RADIUS, 0, O.pi2);
        g.fill();
        g.fillStyle = cols.dot;
        g.beginPath();
        g.arc(x - .5, y - .5, DOT_RADIUS, 0, O.pi2);
        g.fill();
      }
    }
  };

  dc.onMouseDown = (evt, x, y) => {
    if(playerTypes[grid.currentPlayer] === 1) return;

    calcNextLine(x, y);
    if(nextLine === null) return;

    const tile = grid.get(nextLine[0], nextLine[1]);
    if(nextLine[2] ? tile.dir2 : tile.dir1) return;

    if(setLine(nextLine) === 0 && autoPlay && playerTypes[grid.currentPlayer])
      while(grid.availsNum !== 0 && play());
  };

  dc.onMouseMove = (evt, x, y) => {
    if(playerTypes[grid.currentPlayer] === 1) return;
    calcNextLine(x, y);
  };

  dc.onMouseLeave = (evt, x, y) => {
    nextLine = null;
  };

  dc.onKeyDown = evt => {
    switch(evt.code){
      case 'Enter': case 'Space':
        if(autoPlay) break;
        if(playerTypes[grid.currentPlayer] === 0) break;
        if(grid.availsNum === 0) break;
        play();
        break;

      case 'Home':
        centerDisplay();
        break;

      case 'KeyS':
        exportGame();
        break;
    }
  };

  centerDisplay();

  while(grid.availsNum !== 0 && autoPlay && playerTypes[grid.currentPlayer])
    while(grid.availsNum !== 0 && play());

  return dc;
};

main();