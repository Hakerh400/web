'use strict';

const GridGUI = require('./grid-gui');
const Solver = require('./solver');
const Tile = require('./tile');

const AUTO = 1;
const CHECK = 1;

if(O.ih < 1080) return;

const w = 21;
const h = 21;
const s = 40;

const density = .15;
const speed = 1;

O.enhanceRNG();
let seed = O.urlParam('seed');
if(seed !== null) O.randSeed(seed |= 0);

let solving = 0;
let solver = null;

const main = () => {
  const gui = new GridGUI(w, h, s, initFunc);
  const {grid, keys, cur} = gui;

  const highlighted = new O.Map2D();
  let colorized = 0;

  const isBoundary = (x, y) => {
    const d = grid.get(x, y);
    return d === null || d.wall;
  };

  gui.on('draw', (g, d, x, y) => {
    const ddirs = 1 << d.dirs;

    g.fillStyle =
      d.z ? '#f00' :
      d.wall ? '#840' :
      d.locked ? '#888' :
      colorized ?
        ddirs & 279 ?
          (x ^ y) & 1 ? '#f08' : '#0ff' :
        ddirs & 59520 ? '#fa0' :
        '#ccc' :
      '#ccc';

    g.fillRect(0, 0, 1, 1);

    g.strokeStyle = '#bbb';
    g.beginPath();
    g.rect(0, 0, 1, 1);
    g.stroke();
  });

  gui.on('draw', (g, d, x, y) => {
    if(!d.wall){
      const {dirs} = d;

      g.fillStyle = highlighted.has(x, y) ? '#ff0' : '#0f0';
      g.strokeStyle = '#000';
      
      if(dirs !== 0)
        g.drawTube(0, 0, dirs, .3);
    }
  });

  gui.on('frame', (g, d1, d2, x, y, dir) => {
    if(d2 === null) return 1;
    return d1.wall || d2.wall;
  });

  gui.on('kF3', (x, y) => {
    grid.iter((x, y, d) => {
      d.dirs = 0;
      d.locked = 0;
    });

    gui.draw();
  });

  gui.on('kSpace', (x, y) => {
    if(!grid.has(x, y)) return;
    grid.get(x, y).toggleLock();

    gui.drawTiles([x, y]);
  });

  gui.on('kKeyQ', (x, y) => {
    highlighted.reset();

    highlight: {
      if(!grid.has(x, y)) break highlight;

      const d = grid.get(x, y);
      if(d.wall) break highlight;

      highlighted.add(x, y);

      grid.iterAdj(x, y, 1, (x, y, d, xp, yp, dir) => {
        const dp = grid.get(xp, yp);

        if(d.wall) return 0;
        if(!(dp.dirs & (1 << dir))) return 0;
        if(!(d.dirs & (1 << (dir ^ 2)))) return 0;

        highlighted.add(x, y);
        return 1;
      });
    }

    gui.draw();
  });

  gui.on('kKeyW', (x, y) => {
    colorized ^= 1;
    gui.draw();
  });

  gui.on('kEnter', () => {
    if(!solving){
      solver = new Solver(gui);
      solving = 1;
      // colorized = 0;
    }

    if(!solver.move()){
      solving = 0;
      solver = null;
    }

    gui.draw();
  });

  gui.on('kKeyA', () => {
    solver = new Solver(gui);
    colorized = 0;

    while(solver.move());

    if(!solver.solved){
      grid.iter((x, y, d) => {
        d.dirs = 0;
      });
    }

    colorized = 0;
    solving = 0;
    solver = null;

    gui.draw();
  });

  gui.on('dragl', (x1, y1, x2, y2, dir) => {
    if(!grid.has(x1, y1)) return;

    x2 = (x2 + w) % w;
    y2 = (y2 + h) % h;

    const d1 = grid.get(x1, y1);
    const d2 = grid.get(x2, y2);

    if(d1.wall || d2.wall) return;
    if(d1.locked || d2.locked) return;

    d1.dirs ^= 1 << dir;
    d2.dirs ^= 1 << (dir ^ 2);

    gui.drawTiles([x1, y1, x2, y2]);
  });

  {
    const next = () => {
      do{
        generate(grid);
        colorized = 0;
        solving = 0;
        highlighted.reset();
      }while(CHECK && !check());
    };

    const check = () => {
      solver = new Solver(gui);
      colorized = 0;

      while(solver.move());
      const {solved} = solver;

      grid.iter((x, y, d) => d.dirs = 0);

      colorized = 0;
      solver = null;

      return solved;
    };

    const move = () => {
      if(!solving) return;

      if(!solver.move()){
        solving = 0;
        solver = null;
      }
    };

    gui.on('tick', () => {
      if(!AUTO) return;
      O.repeat(speed, move);
    });

    gui.on('kArrowRight', () => {
      next();
      gui.draw();
    });

    next();
  }

  gui.on('kKeyM', () => {
    location.href = location.href.replace(/&seed=\d+|$/, a => {
      return `&seed=${seed !== null ? seed + 1 : 1}`;
    });
  });

  gui.draw();

  if(seed !== null)
    gui.emit('kKeyA');
};

const generate = grid => {
  grid.iter((x, y, d) => {
    d.wall = 0;
    d.dirs = 0;
    d.locked = 0;
  });

  grid.iter((x, y, d) => {
    d.wall = O.randf() < density;

    let found = 0;

    grid.adj(x, y, 1, (x1, y1, d1) => {
      let sum = 0;

      grid.adj(x1, y1, 1, (x2, y2, d2) => {
        if(d2.wall) sum++;
      });

      if(sum >= 3) found = 1;
    });

    if(found) d.wall = 0;
  });
};

const initFunc = (x, y) => {
  const d = new Tile();
  genFunc(x, y, d);
  return d;
};

const genFunc = (x, y, d) => {
  d.wall = O.randf() < density;
  d.dirs = 0;
  d.locked = 0;
};

main();