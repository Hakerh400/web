'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const {min, max} = Math;

await O.addStyle('style.css');

const fontFamily = 'Arial';
const fontSize = 50;
const textSpacing = 2;
const boldText = 1;
const yOffset = 100;
const dpos = 5;

const cwd = __dirname;
const dir = path.join(cwd, '../../../torrents');
const subInfoFile = path.join(dir, 'subtitles-info.txt');

const subs = [];
let subsNum = 0;

let video;
let dur;
let subTimeOffset;

let w, h;
let wh, hh;
let overlay, g;

let subIndex = null;

const main = async () => {
  const subInfo = await O.rfs(subInfoFile, 1);

  const [videoFile, subFile, offsetStr] = O.sanl(subInfo);

  video = O.ce(O.body, 'video');
  subTimeOffset = Number(offsetStr);

  const source = O.ce(video, 'source');
  source.src = O.urlTime(mkPth(videoFile));
  await new Promise(res => O.ael(video, 'loadeddata', res));

  const subs = await loadSubs(mkPth(subFile));

  dur = video.duration;
  createOverlay();

  aels();
  render();
};

const mkPth = str => {
  return path.join(dir, str).replace(/ /g, '%20');
};

const loadSubs = async subFile => {
  let str = O.lf(await O.rfs(subFile, 1));

  while(1){
    str = str.trimLeft();
    if(str.length === 0) break;

    const match = str.match(/^(\d+)\n([^\n]+)\n(.*?)(?:(?<=\n)\n|$)/s);
    assert(match !== null);

    str = str.slice(match[0].length);

    // log(O.sf(match[0]));
    // log(O.sf(str.slice(0, 100)));
    // log()
    // if(prompt())z

    const index = match[1];
    assert(index === String(subsNum + 1));

    const interval = match[2];
    const parts = interval.split(' --> ');
    assert(parts.length === 2);

    const timeOffsets = parts.map(str => {
      const match = str.match(/^(\d{2})\:(\d{2})\:(\d{2})\,(\d{3})$/);
      assert(match !== 0);

      const ns = match.slice(1).map(a => a | 0).reverse();

      return 1e-3 * ns[0] + ns[1] + 60 * (ns[2] + 60 * ns[3]);
    });

    let [of1, of2] = timeOffsets;
    assert(of2 > of1);

    if(subsNum !== 0){
      const prev = O.last(subs)[1];
      assert(prev - of1 < 1);

      of1 = max(prev, of1);
    }

    const text = match[3];

    subs.push([of1, of2, text]);
    subsNum++;
  }

  return subs;
};

const createOverlay = () => {
  overlay = O.ce(O.body, 'canvas');
  g = overlay.getContext('2d');

  onResize();
};

const aels = () => {
  O.ael('resize', onResize);
  O.ael('keydown', onKeyDown);

  O.ael(video, 'keydown', evt => {
    const {code} = evt;

    if(code === 'Space' || code.startsWith('Arrow'))
      evt.stopPropagation();
  });
};

const onResize = evt => {
  w = O.iw;
  h = O.ih;

  wh = w / 2;
  hh = h / 2;

  overlay.width = w;
  overlay.height = h;

  g.lineWidth = 4;
  g.lineJoin = 'round';

  g.textBaseline = 'bottom';
  g.textAlign = 'center';

  const boldStr = boldText ? `bold ` : '';
  g.font = `${boldStr} ${fontSize}px ${fontFamily}`;

  g.globalCompositeOperation = 'destination-over';

  subIndex = null;
};

const onKeyDown = async evt => {
  const {ctrlKey, shiftKey, altKey, code} = evt;
  const flags = (ctrlKey << 2) | (shiftKey << 1) | altKey;

  if(flags === 0){
    if(code === 'Space'){
      O.pd(evt);
      if(video.paused) video.play();
      else video.pause();
      return;
    }

    if(code === 'ArrowLeft'){
      O.pd(evt);
      video.currentTime = max(video.currentTime - dpos, 0);
      return;
    }

    if(code === 'ArrowRight'){
      O.pd(evt);
      video.currentTime = min(video.currentTime + dpos, dur);
      return;
    }

    if(code === 'KeyQ'){
      O.pd(evt);
      video.controls ^= 1;
      return;
    }

    if(code === 'KeyM'){
      O.pd(evt);
      video.muted ^= 1;
      return;
    }

    return;
  }
};

const render = () => {
  const t = video.currentTime;
  const subIndexNew = calcSubIndex(t);

  if(subIndexNew !== subIndex){
    subIndex = subIndexNew;

    g.clearRect(0, 0, w, h);

    if(subIndex !== null)
      drawSubs(subs[subIndex][2]);
  }

  O.raf(render);
};

const drawSubs = str => {
  const lines = O.sanl(str);
  let y = h - yOffset;

  for(let i = lines.length - 1; i !== -1; i--){
    const line = lines[i];

    g.fillStyle = '#ff8';
    g.fillText(line, wh, y);
    g.strokeText(line, wh, y);

    y -= fontSize + textSpacing;
  }
};

const calcSubIndex = t => {
  t -= subTimeOffset;

  const index = Number(O.bisect(i => {
    i = Number(i);
    if(i >= subsNum) return 1;
    return subs[i][0] > t;
  })) - 1;

  if(index === -1)
    return null;

  assert(index >= 0);
  assert(index < subsNum);

  const [t1, t2] = subs[index];

  if(t >= t1 && t <= t2)
    return index;

  return null;
};

main();