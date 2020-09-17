'use strict';

const main = () => {
  const tree = new O.AVLTree();
  const arr = O.ca(200, i => new Test(i));

  const n = 5;

  for(const i of O.repeatg(n))
    tree.insert(arr[i * 2 + 1]);

  for(const i of O.repeatg(n))
    tree.insert(arr[(n - i - 1) * 2 + 2]);

  for(const i of O.repeatg(n))
    tree.delete(arr[i * 2 + 1]);

  for(const i of O.repeatg(n))
    tree.delete(arr[(n - i - 1) * 2 + 2]);

  log([...tree].join(' '));
  log(tree.toString());
};

class Test extends O.Comparable{
  constructor(val){
    super();
    this.val = val;
  }

  cmp(other){
    return this.val - other.val;
  }

  toStr(){
    return String(this.val);
  }
}

main();