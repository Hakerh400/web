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
      |p                   |
      |su* # * ### #### ## |
      |     * #   *    #   |
      |su***+*+** *    # * |
      |     * # **+ # ## * |
      |su**** # * *  #   * |
      |     *   * *  # *** |
      |su** **** **  # *   |
      |  w*          # *   |
      | ww* ########## * ww|
      | w              **dc|
      | w                ww|
      | w                  |
      | wwwwwwwwwwwwwwwwww |
      |                    |
      +--------------------+
    `, grid => {
      grid.getp(7, 3).getTrait(Trait.WireOverlap).activeV = 1;

      const gateCtors = {
        '~': Entity.Inverter,
        'v': Entity.Disjunction,
        '^': Entity.Conjunction,
      };

      const gates = [
        [3, 1, '~', 1],
        [5, 1, '^', 1],
        [7, 1, 'v', 1],
        [11, 1, 'v', 1],
        [16, 1, 'v', 1],
        [18, 2, '~', 2],
        [12, 4, '~', 1],
        [14, 4, '^', 1],
        [6, 5, '~', 1],
        [9, 7, '^', 1],
        [4, 9, '~', 1],
      ];

      for(const gateInfo of gates){
        const [x, y, ctorStr, dir] = gateInfo;
        const ctor = gateCtors[ctorStr];

        grid.getp(x, y).createEnt(ctor, dir);
      }

      for(let i = 0; i !== 8; i++)
        grid.getp(2, i).createEnt(Entity.OneWay, 3);
    });
  },
};

const createLayout = (world, ent, level, layoutRaw, cb=null) => {
  world.reqPushRoom(ent, Grid.Rectangle, [w, h], grid => {
    const layout = O.sanl(O.ftext(layoutRaw));

    const csEnts = {
      p: [Entity.Player],
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