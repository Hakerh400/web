'use strict';

const main = () => {
  const tree = new O.AsyncAVLTree();
  const arr = O.ca(200, i => new Test(i));

  const n = 5;

  for(const i of O.repeatg(n))
    tree.insert(arr[(n - i - 1) * 2 + 2]);

  for(const i of O.repeatg(n))
    tree.insert(arr[i * 2 + 1]);

  for(const i of O.repeatg(n))
    tree.delete(arr[(n - i - 1) * 2 + 2]);

  log([...tree].join(' '));
  log(tree.toString());
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

main();