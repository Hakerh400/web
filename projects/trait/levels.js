'use strict';

const assert = require('assert');
const Grid = require('./grid');
const Entity = require('./entity');
const Trait = require('./trait');

const w = 20;
const h = 15;

const levels = {
  '01'(world, ent, level){
    world.reqPushRoom(ent, Grid.Rectangle, [w, h], grid => {
      for(const tile of grid.tiles)
        tile.createEnt(Entity.Concrete);

      for(let i = 0; i !== h - 3; i++){
        grid.createEnt(5, i + 3, Entity.Wall);
        grid.createEnt(w - 6, i, Entity.Wall);
      }

      grid.createEnt(2, h - 3, Entity.Player);
      // grid.createEnt(w - 3, 2, Entity.Diamond, level);
      grid.createEnt(3, h - 3, Entity.Diamond, level);

      // grid.getp(0, 0).getEnt(Trait.Concrete).createTrait(Trait.Text, level);
    });
  },

  '02'(world, ent, level){
    world.reqPushRoom(ent, Grid.Rectangle, [w, h], grid => {
      const layout = O.sanl(O.ftext(`
        +--------------------+
        |     dwwwww         |
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
      `));

      const csEnts = {
        p: [Entity.Player],
        b: [Entity.Box],
        B: [Entity.Box, 1],
        w: [Entity.Wall],
        d: [Entity.Diamond, level],
      };

      for(const tile of grid.tiles){
        const {x, y} = tile.pos;

        tile.createEnt(Entity.Concrete);

        const c = layout[y + 1][x + 1];
        if(c === ' ') continue;

        assert(O.has(csEnts, c));
        tile.createEnt(...csEnts[c]);
      }

      putStr(grid, Trait.Concrete, 'Esc-Menu', w, h - 2, 1);
      putStr(grid, Trait.Concrete, 'R-Restart', w, h - 1, 1);
    });
  },
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