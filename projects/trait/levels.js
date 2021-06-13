'use strict';

const assert = require('assert');
const Grid = require('./grid');
const Entity = require('./entity');
const Trait = require('./trait');
const flags = require('./flags');

const w = 20;
const h = 15;

const levels = {
  '01'(world, ent, level){
    createLayout(world, ent, level, `
      +--------------------+
      |              w     |
      |              w     |
      |              w  c  |
      |     w        w     |
      |     w        w     |
      |     w        w     |
      |     w        w     |
      |     w        w     |
      |     w        w     |
      |     w        w     |
      |     w        w     |
      |     w        w     |
      |  p  w              |
      |     w              |
      |     w              |
      +--------------------+
    `);
  },

  '02'(world, ent, level){
    createLayout(world, ent, level, `
      +--------------------+
      |     cwwwww         |
      |   wwww   w ww      |
      |   w    B bb w      |
      |bwBw www www w      |
      | w w   w     w      |
      | w w p wwwwwww      |
      | w w   w     w      |
      | w w www www w      |
      | w w    B bb w      |
      | w wwww   w ww      |
      | w B  wwwww w       |
      | w   B      w       |
      | wwwwwwwwwwww       |
      |b                   |
      |                    |
      +--------------------+
    `, grid => {
      putStr(grid, Trait.Concrete, 'Esc-Menu', w, h - 2, 1);
      putStr(grid, Trait.Concrete, 'R-Restart', w, h - 1, 1);
    });
  },

  '03'(world, ent, level){
    createLayout(world, ent, level, `
      +--------------------+
      |                    |
      |  wwww              |
      |  w  www w          |
      |  w bp   w          |
      |  w swwwww          |
      |  ww w              |
      |   w w       ww     |
      |   w w       wu*    |
      |   w w       ww*    |
      |   w w  www    *    |
      |   w w  wcw    *    |
      |   w w  wdw    *    |
      |         *******    |
      |                    |
      |                    |
      +--------------------+
    `);
  },

  '04'(world, ent, level){
    createLayout(world, ent, level, `
      +--------------------+
      |    ~www*** ####w   |
      | bbb~  w^w     #w   |
      | bbb~b wvw     #w   |
      | bbb~  w*wwww  #w   |
      |~~~~~ ww*   w  #w   |
      |      wwdww w  #w   |
      |      w * w www#w   |
      |      w * w Dc>#w   |
      |      w^^^wwwww w   |
      |        *           |
      |        *           |
      |        p           |
      |        *           |
      |        *           |
      |        u           |
      +--------------------+
    `, grid => {
      const wiresInfo = [
        [8, 1, 0],
        [8, 2, 0],
        [8, 8, 0],
        [13, 7, 1],
        [14, 7, 1],
      ];

      grid.getp(2, 2).getEnt(Trait.Box).createTrait(Trait.Wire);

      for(const [x, y, active] of wiresInfo)
        grid.getp(x, y).getEnt(Trait.Concrete).createTrait(Trait.Wire, active);

      grid.getp(11, 0).createEnt(Entity.Inverter, 1);
    });
  },

  '05'(world, ent, level){
    createLayout(world, ent, level, `
      +--------------------+
      |su* # * ### #### ## |
      |p    * #   *    #   |
      |su***+*+** *    # * |
      |     * # **+ # ## * |
      |su**** # * *  #   * |
      |     *   * *  # *** |
      |su** **** **  # *   |
      |  w*wwwwwwwwww#w*ww |
      |   * ########## d   |
      |wwwwwwwwwwwwwwwwwww |
      |cw***u b      wt    |
      |dw*wwwwdwwwww wtw w |
      |*w******w         w |
      |*w w w tw wwwwwwwww |
      |**uw   tw           |
      +--------------------+
    `, grid => {
      grid.getp(7, 2).getTrait(Trait.WireOverlap).activeV = 1;

      const gateCtors = {
        '~': Entity.Inverter,
        '|': Entity.Disjunction,
        '&': Entity.Conjunction,
      };

      const gates = [
        [3, 0, '~', 1],
        [5, 0, '&', 1],
        [7, 0, '|', 1],
        [11, 0, '|', 1],
        [16, 0, '|', 1],
        [18, 1, '~', 2],
        [12, 3, '~', 1],
        [14, 3, '&', 1],
        [6, 4, '~', 1],
        [9, 6, '&', 1],
        [4, 8, '~', 1],
      ];

      for(const gateInfo of gates){
        const [x, y, ctorStr, dir] = gateInfo;
        const ctor = gateCtors[ctorStr];

        grid.getp(x, y).createEnt(ctor, dir);
      }

      const oneWays = [
        [3, 7, 2],
        [14, 7, 2],
        [16, 7, 2],
        [3, 10, 3],
        [4, 10, 1],
        [6, 13, 0],
      ];

      for(let i = 0; i !== 7; i++)
        grid.getp(2, i).createEnt(Entity.OneWay, 3);
      
      for(const [x, y, dir] of oneWays)
        grid.getp(x, y).createEnt(Entity.OneWay, dir);
    });
  },

  '06'(world, ent, level){
    createLayout(world, ent, level, `
      +--------------------+
      |pu# * db         ttt|
      |    * *d   www w wwt|
      | u## **w  wwd*****bu|
      |    #wwww w bd wwwww|
      | u###whwd***u  d*  u|
      |    wwLw dwwwwwv***u|
      |    w  w bb> D   *ww|
      |wwwww  w  www#w **wc|
      |~>****uw ****+**dwww|
      |Lw*  wdwwdwdw#w ww  |
      |  *  w uw   w###w   |
      |  *  w *ww  wwwww   |
      | *d* w *****d     ww|
      | dbd w     *w    d*u|
      |     ^^^^^^*d u*d kk|
      +--------------------+
    `, grid => {
      grid.getp(13, 8).getTrait(Trait.WireOverlap).activeV = 1;
      grid.getp(18, 2).getEnt(Trait.Concrete).createTrait(Trait.Wire);
      grid.getp(0, 8).createEnt(Entity.UnstableGround);

      const pressedButtons = [
        [1, 0],
        [1, 2],
        [1, 4],
      ];

      for(const [x, y] of pressedButtons){
        const tile = grid.getp(x, y);

        tile.createEnt(Entity.Swap);
        tile.getTrait(Trait.Wire).active = 1;
      }

      const gateCtors = {
        '~': Entity.Inverter,
        '|': Entity.Disjunction,
        '&': Entity.Conjunction,
      };

      const gates = [
        [3, 0, '~', 1],
        [4, 2, '&', 1],
        [15, 9, '~', 2],
      ];

      for(const gateInfo of gates){
        const [x, y, ctorStr, dir] = gateInfo;
        const ctor = gateCtors[ctorStr];

        grid.getp(x, y).createEnt(ctor, dir);
      }

      const oneWays = [
        [2, 0, 3],
        [2, 1, 3],
        [2, 2, 3],
        [2, 3, 3],
        [2, 4, 3],
        [12, 0, 1],
        [14, 1, 2],
        [15, 2, 3],
        [14, 3, 2],
        [14, 4, 1],
        [13, 7, 0],
        [9, 12, 3],
        [11, 14, 0],
        [15, 8, 0],
      ];
      
      for(const [x, y, dir] of oneWays)
        grid.getp(x, y).createEnt(Entity.OneWay, dir);
    });
  },

  '07'(world, ent, level){
    createLayout(world, ent, level, `
      +--------------------+
      |wwwwwwwww           |
      |www   www           |
      |ww      w           |
      |wwuwuwu w           |
      |ww wpB*ww           |
      |ww w wuw            |
      |w     *w            |
      |w   w *www          |
      |wwwwwwvw w          |
      |sk   duwLw          |
      |k    www^w          |
      |     w              |
      |     L              |
      |     L              |
      |     w              |
      +--------------------+
    `, grid => {
      const boxes = [
        [2, 3],
        [4, 3],
        [6, 3],
      ];

      for(const [x, y] of boxes)
        grid.getp(x, y).createEnt(Entity.Box, 1);

      const wires = [
        [3, 3],
        [5, 3],
        [6, 8],
      ];

      for(const [x, y] of wires)
        grid.getp(x, y).getEnt(Trait.Concrete).createTrait(Trait.Wire);
    });
  },
};

const createLayout = (world, ent, level, layoutRaw, cb=null) => {
  world.reqCreateRoom(Grid.Rectangle, [w, h], grid => {
    const {room} = grid;
    const layout = O.sanl(O.ftext(layoutRaw));

    const csEnts = {
      p: [Entity.Player, ent],
      b: [Entity.Box],
      B: [Entity.Box, 1],
      w: [Entity.Wall],
      c: [Entity.Diamond],
      s: [Entity.Swap],
      e: [Entity.Wire],
      u: [Entity.Button],
      d: [Entity.DigitalDoor],
      D: [Entity.DigitalDoor, 1],
      '^': [Entity.OneWay, 0],
      '>': [Entity.OneWay, 1],
      'v': [Entity.OneWay, 2],
      '<': [Entity.OneWay, 3],
      t: [Entity.Tail],
      h: [Entity.Hammer],
      k: [Entity.Key],
      L: [Entity.LockedDoor],
    };

    const electrical = '*+#udD';

    for(const tile of grid.tiles){
      const {x, y} = tile.pos;
      const c = layout[y + 1][x + 1];

      if(c === '~'){
        tile.createEnt(Entity.Water);
        continue;
      }

      tile.createEnt(Entity.Concrete);

      if(c === ' ' || c === '~') continue;

      if(electrical.includes(c)){
        const ground = tile.getEnt(Trait.Concrete);
        const active = c === '#' || c === 'D';

        if(c === '+'){
          ground.createTrait(Trait.WireOverlap);
          continue;
        }

        ground.createTrait(Trait.Wire, active);
      }

      if(c === '*' || c === '#') continue;

      assert(O.has(csEnts, c));
      tile.createEnt(...csEnts[c]);
    }

    if(cb !== null)
      cb(grid);

    world.selectedRoom = room;
  });
};

const putStr = (grid, hostTrait, str, x, y, rightAlign=0) => {
  if(!flags.DisplayStrings) return;

  const len = str.length;

  if(rightAlign)
    x -= len;

  for(let i = 0; i !== len; i++){
    const tile = grid.getp(x + i, y);
    if(!tile) continue;

    const ent = tile.getEnt(hostTrait);
    if(!ent) continue;

    ent.createTrait(Trait.Text, str[i]);
  }
};

module.exports = levels;