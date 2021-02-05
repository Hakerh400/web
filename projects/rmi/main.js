'use strict';

const main = async () => {
  log(await O.rmi('ping'));
};

main();