'use strict';

const seqs = require('./sequences');

const TEST_MODE = 0;
const LENGTH = 1e4;
const SCALE = .8;

const {g, w, h, wh, hh, w1, h1} = O.ceCanvas();

main();

function main(){
  if(TEST_MODE){
    g.fillStyle = '#fff';
    g.fillRect(0, 0, w, h);

    g.textBaseline = 'top';
    g.textAlign = 'left';
    g.font = '32px arial';

    let s = '';
    let i = 0;
    for(const val of O.last(seqs)()){
      if(s !== '') s += ', ';
      s += val;
      if(++i === 100) break;
    }

    g.fillStyle = '#000';
    g.fillText(s, 5, 5);
    return;
  }

  g.fillStyle = '#000';
  g.fillRect(0, 0, w, h);

  const seqsNum = seqs.length;

  for(let si = 0; si !== seqsNum; si++){
    const seq = seqs[si];
    const vals = [];
    let max = 1;
    let i = 0;

    for(const val of seq()){
      if(val > max) max = val;
      vals.push(val);
      if(++i === LENGTH) break;
    }

    const sx = w1 / (LENGTH - 1);
    const sy = h1 * SCALE / max;

    g.fillStyle = O.Color.from(O.hsv(si / seqsNum));

    i = 0;
    for(const val of vals){
      g.beginPath();
      g.arc(i++ * sx, h1 - val * sy, 2, 0, O.pi2);
      g.fill();
    }
  }
}