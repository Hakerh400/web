'use strict';

O.enhanceRNG();

const MAX_LENGTH = 150;
const FONT_SIZE = 32;
const TEXT_OFFSET = 8;
const DICE = O.urlParam('dice', 0) | 0;
const HEX = O.urlParam('hex', 1) | 0;
const offset = O.urlParam('offset', DICE) | 0;

const cols = {
  bg: '#ffffff',
  text: '#000000',
};

const {w, h, g} = O.ceCanvas(1);

main();

function main(){
  g.textBaseline = 'top';
  g.textAlign = 'left';

  g.fontFamily = 'Consolas';
  g.font(FONT_SIZE);

  clearCanvas();

  aels();
}

function aels(){
  const strs = O.ca(DICE ? 1 : 15, i => {
    return O.ca(MAX_LENGTH, () => {
      return toStr(O.rand(DICE ? 6 : i + 2) + offset);
    }).join('');
  });

  updateStrs();

  O.ael('keydown', evt => {
    switch(evt.code){
      case 'ArrowRight':
        strs.forEach((str, i) => {
          strs[i] = `${str.substring(1)}${O.rand(DICE ? 6 : i + 2) + offset}`;
        });

        updateStrs();
        break;

      case 'KeyN':
        location.href = location.href.replace(
          /\?[\s\S]*|$/,
          `?project=${O.project}&hex=0&offset=1`,
        );
        break;
    }
  });

  function updateStrs(){
    clearCanvas();

    strs.forEach((str, i) => {
      drawStr(DICE ? str : `${toStr(i + 1)} - ${str}`, i, cols.text);
    });
  }
}

function drawStr(str, i=0, col=null){
  if(col !== null) g.fillStyle = col;
  g.fillText(str, TEXT_OFFSET, TEXT_OFFSET + FONT_SIZE * i);
}

function clearCanvas(){
  g.clearCanvas(cols.bg);
}

function toStr(n){
  if(HEX) return n.toString(16).toUpperCase();
  return n.toString();
}