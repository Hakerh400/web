'use strict';

const RenderEngine = require('./render-engine');
const Realm = require('./realm');
const WorldGenerator = require('./world-generator');
const RealmGenerator = require('./realm-generator');
const Event = require('./event');
const Transition = require('./transition');
const LayerPool = require('./layer-pool');
const Grid = require('./grid');
const Tile = require('./tile');
const Object = require('./object');
const realmsList = require('./realms-list');
const realms = require('./realms');

const {isElectron} = O;
const isBrowser = !isElectron;

const {floor, ceil, round} = Math;

main();

function main(){
  if(isBrowser){
    const seed = O.urlParam('seed');
    if(seed === null) return refresh();

    O.enhanceRNG();
    O.randSeed(seed);

    O.ael('keydown', evt => {
      switch(evt.code){
        case 'F5':
          O.pd(evt);
          refresh();
          break;
      }
    });
  }

  O.body.style.margin = '0px';
  O.body.style.overflow = 'hidden';

  const canvas = O.ce(O.body, 'canvas');
  canvas.width = O.iw;
  canvas.height = O.ih;

  const reng = new RenderEngine(canvas, [Grid.SquareGrid, Grid.HexagonalGrid][0]);
  const {grid} = reng;

  const map = new O.Map2D();
  const chunkSize = 30;

  const addInfo = (xs, ys, realm) => {
    map.set(xs, ys, [realm, '']);
  };

  addInfo(0, 0, 'sokoban');

  new WorldGenerator(grid, tile => {
    const {x, y} = tile;

    const xs = round(x / chunkSize);
    const ys = round(y / chunkSize);

    if(!map.has(xs, ys))
      addInfo(xs, ys, O.randElem(realmsList));

    return map.get(xs, ys);
  });

  grid.get(0, 0);
}

function refresh(){
  const url = location.href;

  location.href = url.replace(/\bseed=(?:[^\&]|$)*|$/, a => {
    const seed = O.rand(2 ** 30);
    const c = a.length === 0 ? url.includes('?') ? '&' : '?' : '';

    return `${c}seed=${seed}`;
  });
}