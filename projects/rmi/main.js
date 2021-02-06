'use strict';

const main = async () => {
  const n = 100;
  const arr = [];

  const push = val => {
    arr.push(val);

    if(arr.length === n){
      log(arr.join(' '));
      log(arr.join('') === O.sortAsc(arr).join('') | 0);
    }
  };

  for(const i of O.repeatg(n))
    O.rmi('echo', i).then(push);
};

main();