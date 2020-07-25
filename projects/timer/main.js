'use strict';

const {g, w, h, wh, hh} = O.ceCanvas();

g.font = '300px arial';
g.textBaseline = 'middle';
g.textAlign = 'left';
g.fillStyle = '#000';

const xOffset = g.measureText(formatTime(0)).width / 2;

let t = parseTime(O.urlParam('time', '00:05:00'));
let start = null;
let stage = 0;

speechSynthesis.onvoiceschanged = main;

function main(){
  O.ael('keydown', evt => {
    if(evt.code !== 'Space') return;
    setTimeout(() => {
      start = O.now;
      stage = 1;
    }, 1e3);
  });

  O.raf(render);
}

function render(){
  const dt = t - (O.now - start) / 1e3;

  if(stage === 1 && dt < 0){
    const a = new SpeechSynthesisUtterance('a');
    a.voice = speechSynthesis.getVoices()[21];
    speechSynthesis.speak(a);
    stage = 2;
  }

  const tt = start !== null ? Math.max(dt, 0) : t;

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