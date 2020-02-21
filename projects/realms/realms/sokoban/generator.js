'use strict';

const RealmGenerator = require('../../realm-generator');
const cs = require('./ctors');

class Generator extends RealmGenerator{
  constructor(realm, wgen, key){
    super(realm, wgen, key);
  }

  defaultTile(tile){
    new cs.Ground(tile);
    new cs.Wall(tile);
  }

  gen(tile){
    const {grid, first} = this;
    this.startGen();

    const set = this.allocIsland(tile, 400).tiles;
    const map = new Map();
    const start = tile;

    for(const tile of set){
      const isFirst = tile === start;

      const obj = O.obj();
      map.set(tile, obj);

      obj.boxInit = !isFirst && O.rand(20) === 0;
      obj.box = obj.boxInit;
      obj.visited = isFirst;
    }

    const pathLen = set.size * 4;
    let pushed = 0;
    tile = start;

    for(let i = 0; i !== pathLen; i++){
      const obj = map.get(tile);

      const dir = grid.rand(tile.adjsNum);
      const next = tile.adjRaw(dir);
      if(!set.has(next)) continue;

      const objNext = map.get(next);

      if(!objNext.box){
        objNext.visited = 1;
        tile = next;
        continue;
      }

      const nextNext = next.adjRaw(dir);
      if(!set.has(nextNext) || nextNext === start) continue;

      const objNextNext = map.get(nextNext);
      if(objNextNext.box) continue;

      objNext.box = 0;
      objNextNext.box = 1;
      objNext.visited = 1;
      objNextNext.visited = 1;
      tile = next;
      pushed = 1;
    }

    if(first) new cs.Player(start);

    for(const tile of set){
      const obj = map.get(tile);

      if(!(first && tile === start || pushed && obj.visited)){
        this.defaultTile(tile);
        continue;
      }

      new cs.Ground(tile, obj.box);
      if(obj.boxInit) new cs.Box(tile);
    }

    this.endGen();
  }
}

module.exports = Generator;