'use strict';

const assert = require('assert');

class Grid{
  csp = null;
  tiles = new Set();
  unsolvedNum = 0;

  err = null;
  errTiles = new Set();

  get ctor(){ return this.constructor; }

  addTile(tile){
    this.tiles.add(tile);

    if(!tile.solved)
      this.unsolvedNum++;
  }

  render(g){ O.virtual('render'); }

  addErrTile(tile){
    const {errTiles} = this;

    assert(!errTiles.has(tile));
    errTiles.add(tile);
  }

  removeErrTile(tile){
    const {errTiles} = this;

    assert(errTiles.has(tile));
    errTiles.delete(tile);
  }

  shuffle(){
    const tiles = this.tiles = O.shuffleSet(this.tiles);

    for(const tile of tiles)
      tile.shuffle();
  }

  updateUnsolvedNum(){
    let unsolvedNum = 0;

    for(const tile of this.tiles)
      if(!tile.solved)
        unsolvedNum++;

    this.unsolvedNum = unsolvedNum;
  }
}

class SLGrid extends Grid{
  static squareCtor = null;
  static lineCtor = null;

  constructor(w, h){
    super();

    assert(w === h);

    this.w = w;
    this.h = h;

    const {ctor} = this;
    const {squareCtor, lineCtor} = ctor;

    const squares = [];
    const hlines = [];
    const vlines = [];

    for(let y = 0; y <= h; y++){
      const squaresRow = [];
      const hlinesRow = [];
      const vlinesRow = y < h ? [] : null;

      squares.push(squaresRow);
      hlines.push(hlinesRow);
      if(y < h) vlines.push(vlinesRow);

      for(let x = 0; x <= w; x++){
        if(x < w && y < h){
          const tile = new squareCtor(this, x, y);
          squaresRow.push(tile);
          this.addTile(tile);
        }

        if(x < w){
          const tile = new lineCtor(this, x, y, 0);
          hlinesRow.push(tile);
          this.addTile(tile);
        }

        if(y < h){
          const tile = new lineCtor(this, x, y, 1);
          vlinesRow.push(tile);
          this.addTile(tile);
        }
      }
    }

    this.squares = squares;
    this.hlines = hlines;
    this.vlines = vlines;
  }

  *iterSquares(){
    for(const row of this.squares)
      yield* row;
  }

  *iterHLines(){
    for(const row of this.hlines)
      yield* row;
  }

  *iterVLines(){
    for(const row of this.vlines)
      yield* row;
  }

  *iterLines(){
    yield* this.iterHLines();
    yield* this.iterVLines();
  }

  render(g){
    const {csp, w, h, err} = this;
    const {gs} = g;

    g.fillStyle = '#e6e6e6';
    g.fillRect(0, 0, w, h);

    const renderTile = tile => {
      if(tile === null) return;
      if(tile.err) return;

      const {x, y} = tile;

      g.save();
      g.translate(x, y);
      tile.render(g);
      g.restore();
    };

    for(const d of this.iterSquares())
      renderTile(d);

    g.globalCompositeOperation = 'darken';

    for(const line of this.iterLines())
      renderTile(line);

    g.globalCompositeOperation = 'source-over';

    if(err !== null){
      for(const tile of this.errTiles){
        g.save();
        g.translate(tile.x, tile.y);
        tile.render(g);
        g.restore();
      }

      const {fontSize} = g;
      const fontSizeNew = fontSize / 2;

      g.font(fontSizeNew);
      g.fillStyle = '#800';
      g.fillText(csp.cnstrs[err], w / 2, -.5);

      g.font(fontSize);
    }
  }

  has(x, y){
    if(x < 0 || x >= this.w) return 0;
    if(y < 0 || y >= this.h) return 0;
    return 1;
  }

  getSquare(x, y){
    if(!this.has(x, y)) return null;
    return this.squares[y][x];
  }

  getHLine(x, y){
    if(x < 0 || x >= this.w) return null;
    if(y < 0 || y >  this.h) return null;
    return this.hlines[y][x];
  }

  getVLine(x, y){
    if(x < 0 || x >  this.w) return null;
    if(y < 0 || y >= this.h) return null;
    return this.vlines[y][x];
  }

  *iterByCoords(){
    const {w, h} = this;

    for(let y = 0; y <= h; y++){
      for(let x = 0; x <= w; x++){
        const d = this.getSquare(x, y);
        const h = this.getHLine(x, y);
        const v = this.getVLine(x, y);

        yield [d, h, v];
      }
    }
  }
}

module.exports = Object.assign(Grid, {
  SLGrid,
});