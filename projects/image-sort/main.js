'use strict';

const main = () => {
  const tree = new O.AVLTree();

  for(const i of O.repeatg(64))
    tree.insert(new Test(i * 2 + 1));

  for(const i of O.repeatg(64))
    tree.insert(new Test((64 - i - 1) * 2 + 2));

  log([...tree].join(' '));
  log(tree.toString());
  log(tree.root.height);
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