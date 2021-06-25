'use strict';

const fs = require('./fs');
const mathjax = require('./mathjax');

await O.addStyle('style.css');

const cssHidden = 'hidden';

const mainDiv = O.ceDiv(O.body, 'main');
const mainFrame = O.ceDiv(mainDiv, 'frame main-frame');
const locationBar = O.ceDiv(mainFrame, 'header location-bar');
const contentDiv = O.ceDiv(mainFrame, 'content main-content');
const consoleDiv = O.ceDiv(mainDiv, 'frame console');
const consoleInput = O.ceDiv(consoleDiv, 'header console-input');
const consoleContent = O.ceDiv(consoleDiv, 'content console-content');

const main = () => {
  setLocation('/');
  aels();
};

const aels = () => {
  O.ael('keydown', evt => {
    const {ctrlKey, shiftKey, altKey, code} = evt;
    const flags = (ctrlKey << 2) | (shiftKey << 1) | altKey;

    if(flags === 0){
      if(code === 'Escape'){
        toggle(consoleDiv);
        return;
      }

      return;
    }

    if(flags === 4){
      if(code === 'KeyN'){
        O.pd(evt);
        log(fs.readdir('/'));
        return;
      }

      return;
    }
  });
};

const clear = elem => {
  setText(elem, '');
};

const getText = elem => {
  return elem.innerText;
};

const setText = (elem, str) => {
  elem.innerText = str;
};

const getLocation = () => {
  return getText(locationBar)
};

const setLocation = location => {
  setText(locationBar, location);
};

const toggle = elem => {
  if(isVisible(elem)) hide(elem);
  else show(elem);
};

const show = elem => {
  elem.classList.remove(cssHidden);
};

const hide = elem => {
  elem.classList.add(cssHidden);
};

const isVisible = elem => {
  return !elem.classList.contains(cssHidden);
};

main();