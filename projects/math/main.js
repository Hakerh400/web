'use strict';

const mathjax = require('./mathjax');

await O.addStyle('style.css');

const mainDiv = O.ceDiv(O.body, 'main');
const mainFrame = O.ceDiv(mainDiv, 'main-frame');
const locationBar = O.ceDiv(mainFrame, 'location-bar');
const consoleDiv = O.ceDiv(mainDiv, 'console hidden');

const main = () => {
};

main();