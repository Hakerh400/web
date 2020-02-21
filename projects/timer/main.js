'use strict';

const {g, w, h, wh, hh} = O.ceCanvas();
g.font = '300px arial';
g.textBaseline = 'middle';
g.textAlign = 'left';
g.fillStyle = '#000';

const xOffset = g.measureText(formatTime(0)).width / 2;

let t = parseTime(O.urlParam('time', '00:05:00'));
let start = null;

main();

function main(){
  O.ael('keydown', evt => {
    if(evt.code !== 'Space') return;
    setTimeout(() => start = O.now, 1e3);
  });

  O.raf(render);
}

function render(){
  const tt = start === null ? t : Math.max(t - (O.now - start) / 1e3, 0);

  g.clearRect(0, 0, w, h);
  g.fillText(formatTime(tt), wh - xOffset, hh);
  
  O.raf(render);
}

function parseTime(str){
  return str.match(/\d+/g).reduce((t, a, b) => {
    return t + (a | 0) * 60 ** (2 - b);
  }, 0);
}

function formatTime(time){
  const h = time / 3600 | 0;
  const m = time / 60 % 60 | 0;
  const s = time % 60 | 0;

  return [h, m, s].map(a => String(a).padStart(2, '0')).join(':');
}