'use strict';

const assert = require('assert');
const Tile = require('./tile');
const Trait = require('./trait');
const TraitMap = require('./trait-map');

const {handlersArr, handlersMap} = Trait;
const handlersArrLen = handlersArr.length;

class World{
  notifiedTiles = new Set();

  evts = {
    nav: null,
  };

  #tickId = null;

  constructor(w, h){
    this.w = w;
    this.h = h;

    this.grid = new O.Grid(w, h, (x, y) => {
      return new Tile(this, [x, y]);
    });
  }

  get tickId(){ return this.#tickId; }

  getTile(pos){
    const [x, y] = pos;
    return this.grid.get(x, y);
  }

  markTileAsNotified(tile){
    this.notifiedTiles.add(tile);
  }

  tick(){
    const {notifiedTiles} = this;

    this.#tickId = O.obj();

    for(let pri = 0; pri !== handlersArrLen; pri++){
      const [traitCtor, handler, repeat] = handlersArr[pri];
      const once = !repeat;
      const executed = once ? new Set() : null;

      for(const tile of notifiedTiles){
        for(const trait of tile.traits.get(traitCtor)){
          if(once){
            if(executed.has(trait)) continue;
            executed.add(trait);
          }

          handler.call(trait);
        }
      }
    }

    notifiedTiles.clear();

    this.#tickId = null;
  }
}

module.exports = World;