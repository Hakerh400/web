'use strict';

const assert = require('assert');
const State = require('./state');

class Tile{
  constructor(grid, x, y, state=null, val=0){
    this.grid = grid;
    this.x = x;
    this.y = y;
    this.state = state;
    this.val = val;

    this.actions = [];
  }

  setState(stateNew){
    const {state} = this;

    if(stateNew === state)
      return;

    if(state !== null)
      state.removeTile(this);

    if(stateNew !== null)
      stateNew.addTile(this);

    this.state = stateNew;
  }

  setVal(valNew){
    this.val = valNew;
  }

  set(stateNew, valNew){
    this.setState(stateNew);
    this.setVal(valNew);
  }

  render(g){
    const {grid, x, y, state, val} = this;

    if(O.z === this){
      g.fillStyle = 'white';
      g.fillRect(.1, .1, .8, .8);
    }

    if(state === null){
      g.fillStyle = State.emptyCol;
      g.fillRect(0, 0, 1, 1);
      return;
    }

    g.fillStyle = state.col;
    g.fillRect(0, 0, 1, 1);

    g.fillStyle = 'black';
    g.fillText(val, .5, .5);
  }

  renderLines(g){
    const {grid, x, y, state, val} = this;

    g.beginPath();
    g.rect(0, 0, 1, 1);
    g.stroke();

    grid.adj(x, y, (x, y, d, dir) => {
      if(d === null || d.state !== state)
        drawLine(g, dir);
    });
  }
}

const drawLine = (g, dir) => {
  let x, y, hor;

  switch(dir){
    case 0: x = 0; y = 0; hor = 1; break;
    case 1: x = 1; y = 0; hor = 0; break;
    case 2: x = 0; y = 1; hor = 1; break;
    case 3: x = 0; y = 0; hor = 0; break;
  }

  const t = g.gs;
  const s = t * 2;

  const w = hor ? 1 : 0;
  const h = hor ? 0 : 1;

  g.fillRect(
    x - t,
    y - t,
    w + s,
    h + s,
  );
};

module.exports = Tile;