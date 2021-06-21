'use strict';

const fs = require('./fs');
const mathjax = require('./mathjax');

await O.addStyle('style.css');

const cssHidden = 'hidden';

const mainDiv = O.ceDiv(O.body, 'main');
const mainFrame = O.ceDiv(mainDiv, 'main-frame');
const locationBar = O.ceDiv(mainFrame, 'location-bar');
const contentDiv = O.ceDiv(mainFrame, 'content');
const consoleDiv = O.ceDiv(mainDiv, 'console');

const main = () => {
  hide(consoleDiv);
  setLocation('/systems');
  clearContent();

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
        O.pd(evt);;
        log(fs.readdir('/'));
        return;
      }

      return;
    }
  });
};

const clearContent = () => {
  clear(contentDiv);
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