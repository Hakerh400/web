'use strict';

const cmn = require('../../common-objects');
const Transition = require('../../transition');
const Pivot = require('../../pivot');

const DigitType = O.enum([
  'HIDDEN',
  'GIVEN',
  'WRITTEN',
  'ILLEGAL',
]);

class Ground extends cmn.Ground{
  static objName = 'tile';
  static listenersL = this.initListenersL(['digit']);
  static DigitType = DigitType;

  #digit;

  constructor(tile, tileType=0, digitType=DigitType.HIDDEN, digit=0){
    super(tile);

    this.tileType = tileType;
    this.digitType = digitType;
    this.#digit = digit;
  }

  ser(s){
    const {tileType, digitType, digit} = this;

    s.write(tileType);
    s.write(digitType, 3);
    if(digitType !== DigitType.HIDDEN) s.write(digit - 1, 8);
  }

  deser(s){
    const tileType = this.tileType = s.read();
    const digitType = this.digitType = s.read(3);
    this.digit = digitType !== DigitType.HIDDEN ? s.read(8) + 1 : 0;
  }

  digit(evt){
    const digit = this.#digit;
    const newDigit = evt.digit;

    if(this.digitType === DigitType.GIVEN) return 0;
    if(newDigit === digit) return 0;

    if(newDigit === 0) this.digitType = DigitType.HIDDEN;
    this.#digit = newDigit;

    this.tile.update();
    this.checkAdj(digit, 1);

    return 1;
  }

  draw(g, t, k){
    const {tileType, digitType} = this;
    const digit = this.#digit;

    g.fillStyle = tileType === 0 ? '#777' : '#bbb';
    super.draw(g, t, k);

    if(digitType !== DigitType.HIDDEN){
      switch(digitType){
        case DigitType.GIVEN: g.fillStyle = '#000'; break;
        case DigitType.WRITTEN: g.fillStyle = '#00f'; break;
        case DigitType.ILLEGAL: g.fillStyle = '#f00'; break;
      }

      g.fillText(digit, 0, 0);
    }
  }

  getDigit(){
    return this.#digit;
  }

  setDigit(digit){
    if(digit === this.#digit) return 0;
    this.#digit = digit;
    this.update();
    return 1;
  }

  checkAdj(prevDigit, recursive=0){
    const {tile, tileType} = this;
    const digit = this.#digit;
    let found = 0;
    let updated = 0;

    const checkObj = obj => {
      const dgt = obj.getDigit();

      if(recursive && obj.digitType === DigitType.ILLEGAL && dgt === prevDigit)
        if(obj.checkAdj(dgt)) updated = 1;

      if(digit !== 0 && dgt === digit){
        if(obj.digitType !== DigitType.GIVEN){
          tile.update();
          obj.digitType = DigitType.ILLEGAL;
        }

        found = 1;
      }
    };

    const checkTile = tile => {
      for(const obj of tile.getc(Ground))
        checkObj(obj);
    };

    for(let dir = 0; dir !== 4; dir++){
      for(let i = 0, d = tile; i !== 8; i++){
        d = d.adj(dir, 4);
        if(!d.hasCtor(Ground)) break;
        
        for(const obj of d.getc(Ground))
          checkObj(obj);
      }
    }

    tile.iter(100, (prev, tile, path) => {
      if(prev === null) return -1;
      if(!tile.hasCtor(Ground)) return 0;

      let done = 0;

      for(const obj of tile.getc(Ground)){
        if(obj.tileType === tileType) checkObj(obj);
        else done = 1;
      }

      if(done) return 0;
      return -1;
    });

    if(digit !== 0){
      if(found){
        this.digitType = DigitType.ILLEGAL;
        updated = 1;
      }else{
        this.digitType = DigitType.WRITTEN;
      }
    }

    return updated;
  }
}

module.exports = {
  Ground,
};