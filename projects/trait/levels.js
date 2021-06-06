'use strict';

const assert = require('assert');
const Grid = require('./grid');
const Entity = require('./entity');
const Trait = require('./trait');

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
      |        ********    |
      | bbb b w^w     *    |
      | bbb   wvw     *    |
      | bbb   w*wwww  *    |
      |       w*   w  *    |
      |      wwdww w  *    |
      |      w * w www*    |
      |      w * w dc>*    |
      |      w^^^wwwww     |
      |        *           |
      |        *           |
      |        p           |
      |        *           |
      |        *           |
      |        u           |
      +--------------------+
    `, grid => {
      const wiresInfo = [8, 1, 8, 2, 8, 8, 13, 7, 14, 7];

      grid.getp(2, 2).getEnt(Trait.Box).createTrait(Trait.Wire);

      for(let i = 0; i !== wiresInfo.length; i += 2){
        const x = wiresInfo[i];
        const y = wiresInfo[i + 1];

        grid.getp(x, y).getEnt(Trait.Concrete).createTrait(Trait.Wire);
      }
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
      '^': [Entity.OneWay, 0],
      '>': [Entity.OneWay, 1],
      'v': [Entity.OneWay, 2],
      '<': [Entity.OneWay, 3],
    };

    const electrical = '*ud';

    for(const tile of grid.tiles){
      const {x, y} = tile.pos;

      tile.createEnt(Entity.Concrete);

      const c = layout[y + 1][x + 1];
      if(c === ' ') continue;

      if(electrical.includes(c))
        tile.getEnt(Trait.Concrete).createTrait(Trait.Wire);

      if(c === '*') continue;

      assert(O.has(csEnts, c));
      tile.createEnt(...csEnts[c]);
    }

    if(cb !== null)
      cb(grid);
  });
};

const putStr = (grid, hostTrait, str, x, y, rightAlign=0) => {
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