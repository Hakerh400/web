'use strict';

const Sorter = require('./sorter');
const Sortable = require('./sortable');
const Image = require('./image');

const USE_SEED = 0;

if(USE_SEED){
  let seed = O.urlParam('s', null);

  if(seed === null){
    seed = O.rand(1e5);

    log(`Seed: ${seed}`);
    log();
  }

  O.enhanceRNG();
  O.randSeed(seed);
}

const {g} = O.ceCanvas();

const main = async () => {
  const sorter = new Sorter(g);

  if(1){
    for(let i = 0; i !== 10; i++){
      const n = O.rand(1e3) + 1;
      // log(n);
      sorter.insert(new Image(sorter, n));
    }
    
    // log();
  }else{
    sorter.insert(new Image(sorter, 2));
    sorter.insert(new Image(sorter, 3));
    sorter.insert(new Image(sorter, 1));
    sorter.insert(new Image(sorter, 4));
    sorter.insert(new Image(sorter, 5));
  }

  const arr = await sorter.getArr();
  const str = await O.joina(arr, ' ');

  log(str);

  O.assert(str === O.sortAsc(str.split(' ').map(a => a | 0)).join(' '));
};

main();