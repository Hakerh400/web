'use strict';

const assert = require('assert');
const State = require('./state');

class Tile{
  constructor(grid, x, y, state=null, mass=0){
    this.grid = grid;
    this.x = x;
    this.y = y;
    this.state = state;
    this.mass = mass;

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

  setMass(massNew){
    this.mass = massNew;
  }

  set(stateNew, massNew){
    this.setState(stateNew);
    this.setMass(massNew);
  }

  addAction(state, mass){
    this.actions.push([state, mass]);
  }

  execActions(){
    const {grid, x, y, state, mass, actions} = this;

    if(actions.length === 0)
      return;

    const map = new Map([[state, mass]]);

    for(const [state, mass] of actions){
      if(!map.has(state)){
        map.set(state, mass);
        continue;
      }

      const masOld = map.get(state);
      map.set(state, masOld + mass);
    }

    actions.length = 0;

    if(map.size === 1){
      this.setMass(map.get(state));
      return;
    }
  }

  adj2dir(d){
    if(d === null)
      return null;

    const {grid, x, y} = this;
    let dir = null;

    grid.adj(x, y, (x, y, d1, dir1) => {
      if(d1 === d)
        dir = dir1;
    });

    return dir;
  }

  render(g){
    const {grid, x, y, state, mass} = this;

    if(state === null){
      g.fillStyle = State.emptyCol;
      g.fillRect(0, 0, 1, 1);
      return;
    }

    g.fillStyle = state.col;
    g.fillRect(0, 0, 1, 1);

    g.fillStyle = 'black';
    g.fillText(mass, .5, .5);
  }

  renderLines(g){
    const {grid, x, y, state, mass} = this;

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