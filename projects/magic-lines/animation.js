'use strict';

class Animation{
  affected = new Set();

  constructor(startTime){
    this.startTime = startTime;
  }

  affects(tile){
    return this.affected.has(tile);
  }

  affect(tile){
    this.affected.add(tile);
  }
}

class Move extends Animation{
  constructor(startTime, start, end, pth){
    super(startTime);

    this.start = start;
    this.end = end;
    this.pth = pth;

    this.affect(start);

    this.x = start.x;
    this.y = start.y;
    this.index = 0;
  }

  progress(index){
    const {pth} = this;

    for(let i = this.index; i !== index; i++){
      switch(pth[i]){
        case 0: this.y--; break;
        case 1: this.x++; break;
        case 2: this.y++; break;
        case 3: this.x--; break;
      }
    }

    this.index = index;
  }
}

class Grow extends Animation{
  constructor(startTime, tile){
    super(startTime);

    this.tile = tile;
    this.affect(tile);
  }
}

class Explode extends Animation{
  constructor(startTime, tile){
    super(startTime);
    
    this.tile = tile;
    this.affect(tile);
  }
}

module.exports = Object.assign(Animation, {
  Move,
  Grow,
  Explode,
});