'use strict';

const Tile = require('./tile');

class Grid extends O.Grid{
  currentPlayer = 0;
  #moves = [];

  constructor(w, h){
    super(w + 1, h + 1, () => {
      return new Tile();
    });

    this.availsNum = w * h * 2 + w + h;
  }

  setLine(x, y, type){
    const tile = this.get(x, y);
    const tile1 = type === 0 ? this.get(x, y - 1) : this.get(x - 1, y);

    if(type) tile.dir2 = 1;
    else tile.dir1 = 1;
    tile.total++;
    if(tile1 !== null) tile1.total++;

    this.availsNum--;

    let n = 0;

    if(tile.total === 4){
      tile.player = this.currentPlayer;
      n++;
    }

    if(tile1 !== null && tile1.total === 4){
      tile1.player = this.currentPlayer;
      n++;
    }

    this.#moves.push(type === 0 ?
      `${y}${O.sfcc(x + 65)}` :
      `${O.sfcc(y + 65)}${x}`
    );

    return n;
  }

  removeLine(x, y, type){
    const tile = this.get(x, y);
    const tile1 = type === 0 ? this.get(x, y - 1) : this.get(x - 1, y);

    if(type) tile.dir2 = 0;
    else tile.dir1 = 0;
    tile.total--;
    if(tile1 !== null) tile1.total--;

    this.availsNum++;

    let n = 0;

    if(tile.total === 3){
      tile.player = null;
      n++;
    }

    if(tile1 !== null && tile1.total === 3){
      tile1.player = null;
      n++;
    }

    this.#moves.pop();

    return n;
  }

  calcTotal(x, y, type, total){
    const tile = this.get(x, y);
    const tile1 = type === 0 ? this.get(x, y - 1) : this.get(x - 1, y);

    return (tile.total === total - 1) + (tile1 !== null && tile1.total === total - 1);
  }

  getLines(total=null, include=1){
    const {w, h} = this;
    const lines = [];

    const addLine = (x, y, type) => {
      if(total !== null){
        const check = this.calcTotal(x, y, type, total) !== 0;
        if(check ^ include) return;
      }

      lines.push([x, y, type]);
    };

    this.iter((x, y, tile) => {
      if(!tile.dir1 && x !== w - 1) addLine(x, y, 0);
      if(!tile.dir2 && y !== h - 1) addLine(x, y, 1);
    });

    return lines;
  }

  getExportStr(){
    let str = `${this.w - 1} ${this.h - 1}`;

    if(this.#moves.length !== 0)
      str += `\n${this.#moves.join('\n')}`;

    return str;
  }
}

module.exports = Grid;