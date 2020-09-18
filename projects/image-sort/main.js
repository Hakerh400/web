'use strict';

const main = async () => {
  const tree = new O.AsyncAVLTree();
  const pool = O.ca(200, i => new Test(i));

  const n = 5;

  for(const i of O.repeatg(n))
    await tree.insert(pool[(n - i - 1) * 2 + 2]);

  for(const i of O.repeatg(n))
    await tree.insert(pool[i * 2 + 1]);

  for(const i of O.repeatg(n))
    await tree.delete(pool[(n - i - 1) * 2 + 2]);

  const arr = [];

  for await(const node of tree)
    arr.push(await node.toString());

  log(arr.join(' '));
  log(await tree.toString());
};

class Test extends O.AsyncComparable{
  constructor(val){
    super();
    this.val = val;
  }

  cmp(other){
    return new Promise((res, rej) => {
      setTimeout(() => {
        res(this.val - other.val);
      });
    });
  }

  toStr(){
    return String(this.val);
  }
}

main().catch(O.error);