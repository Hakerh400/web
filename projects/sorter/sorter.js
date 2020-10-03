'use strict';

const {assert} = O;

class Sorter extends O.AsyncStringifiable{
  objs = new Map();
  pairs = [];

  has(obj){
    return this.objs.has(obj);
  }

  insert(objNew){
    assert(!this.has(objNew));

    const {objs, pairs} = this;

    for(const obj of objs.keys())
      pairs.push([obj, objNew]);

    objs.set(objNew, [new Set(), new Set()]);
  }

  remove(obj){
    assert(this.has(obj));

    const {objs, pairs} = this;

    objs.delete(obj);

    for(const info of objs.values()){
      info[0].delete(obj);
      info[1].delete(obj);
    }
  }

  get sorted(){
    return this.pairs.length === 0;
  }

  async sortPair(){
    assert(!this.sorted);

    const {objs, pairs} = this;

    const [obj1, obj2] = O.randElem(pairs, 1);
    const result = await obj1.cmp(obj2);

    assert(result !== 0);
    const type1 = result < 0 ? 0 : 1;
    const type2 = type1 ^ 1;

    const info1 = objs.get(obj1);
    const info2 = objs.get(obj2);

    const affectedPairs = new Map();
    const obj1Set = new Set();
    const obj2Set = new Set();

    affectedPairs.set(obj1, obj1Set);
    affectedPairs.set(obj2, obj2Set);

    const params = [
      [obj1, obj2, info1, info2, type1, type2, obj1Set, obj2Set],
      [obj2, obj1, info2, info1, type2, type1, obj2Set, obj1Set],
    ];

    for(const [obj1, obj2, info1, info2, type1, type2, obj1Set, obj2Set] of params){
      for(const obj of info1[type1]){
        const info = objs.get(obj);

        info[type2].add(obj2);
        info2[type1].add(obj);

        if(!affectedPairs.has(obj))
          affectedPairs.set(obj, new Set());

        affectedPairs.get(obj).add(obj2);
        obj2Set.add(obj);
      }
      // for(const obj of infoOther1[typeOther2]){
      //   const info = objs.get(obj);

      //   // log('..... ' + obj.val + ` ${'><'[typeOther2]} ` + objOther2.val);
      //   // log('..... ' + (infoOther2 === info1 ? obj1 : obj2).val + ` ${'><'[typeOther1]} ` + obj.val);
      //   info[typeOther2].add(objOther2);
      //   infoOther2[typeOther1].add(obj);

      //   obj2Set.add(obj);

      //   if(!affectedPairs.has(obj))
      //     affectedPairs.set(obj, new Set());

      //   affectedPairs.get(obj).add(objOther2);
      //   affectedSet.add(obj);
      // }
    }

    info1[type2].add(obj2);
    info2[type1].add(obj1);

    this.pairs = await O.filtera(pairs, async ([obj1, obj2]) => {
      const info = affectedPairs.get(obj1);
      const remove = info && info.has(obj2);

      // if(remove) log('RESOLVED ' + (await obj1.toString()) + ' ' + (await obj2.toString()));

      return !remove;
    });
  }

  async sort(){
    while(!this.sorted){
      // log(await this.toString());
      await this.sortPair();
      // O.logb();
    }

    // log(await this.toString());
  }

  async getArr(sort=1){
    if(sort) await this.sort();
    assert(this.sorted);

    const {objs, pairs} = this;

    return [...objs.keys()].sort((obj1, obj2) => {
      const info = objs.get(obj1);

      if(info[0].has(obj2)) return 1;
      if(info[1].has(obj2)) return -1;

      assert.fail();
    });
  }

  async toStr(){
    const {objs, pairs} = this;
    const arr = [];

    const push = (...args) => {
      if(arr.length !== 0) arr.push('\n');
      arr.push(...args);
    };

    for(const [obj1, info] of objs)
      for(const [type, rel] of [[0, '>'], [1, '<']])
        for(const obj2 of info[type])
          push(obj1, ` ${rel} `, obj2);

    for(const [obj1, obj2] of pairs){
      push(obj1, ' ? ', obj2);
      push(obj2, ' ? ', obj1);
    }

    return arr;
  }
}

module.exports = Sorter;