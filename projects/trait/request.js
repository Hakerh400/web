'use strict';

const assert = require('assert');
const Tile = require('./tile');
const Entity = require('./entity');
const Trait = require('./trait');
const CtorsMap = require('./ctors-map');
const ctorsPri = require('./ctors-pri');

class Request{
  static exec(world, reqs){ O.virtual('exec', 1); }

  constructor(world){
    this.world = world;
  }

  get ctor(){ return this.constructor; }
  get pri(){ return this.ctor.pri; }
}

class SimpleRequest extends Request{
  static exec(world, reqs){
    for(const req of reqs)
      req.simpleExec();
  }

  simpleExec(){ O.virtual('simpleExec'); }
}

class ModifyEntGlobData extends Request{
  static exec(world, reqs){
    const entTraitDataMap = new Map();
    // let m = null;

    for(const req of reqs){
      const {ent, traitCtor, action} = req;
      const [name, info] = action;
      if(!ent.valid) continue;

      // if(m === null) m = name;
      // assert(name === m);

      if(name === 'set.insert'){
        let set = ent.getGlobData(traitCtor);
        if(set === null) set = new Set();

        for(const elem of info)
          set.add(elem);

        ent.setGlobData(traitCtor, set);

        continue;
      }

      if(name === 'set.remove'){
        let set = ent.getGlobData(traitCtor);

        if(set === null)
          continue;

        for(const elem of info)
          set.delete(elem);
        
        ent.setGlobData(traitCtor, set);

        continue;
      }

      if(name === 'val.set'){
        if(!entTraitDataMap.has(ent))
          entTraitDataMap.set(ent, new Map());

        const traitDataMap = entTraitDataMap.get(ent);

        if(!traitDataMap.has(traitCtor))
          traitDataMap.set(traitCtor, new Set());

        const vals = traitDataMap.get(traitCtor);
        vals.add(info);

        continue;
      }

      assert.fail();

      // if(!entTraitDataMap.has(ent))
      //   entTraitDataMap.set(ent, new Map());
    }

    for(const [ent, map] of entTraitDataMap){
      for(const [traitCtor, set] of map){
        const size = set.size;
        assert(size !== 0);

        const hasNull = set.has(null);

        if(size !== 1){
          if(size !== 2){
            if(hasNull)
              ent.setGlobData(traitCtor, O.uni(set));

            continue;
          }

          if(!hasNull) continue;

          set.delete(null);
        }

        ent.setGlobData(traitCtor, O.uni(set));
      }
    }
  }

  constructor(world, ent, traitCtor, action){
    super(world);

    this.ent = ent;
    this.traitCtor = traitCtor;
    this.action = action;
  }
}

// class ModifyEntLocData extends Request{
//   static exec(world, reqs){
//     const entTraitDataMap = new Map();
//     let m = null;
//
//     for(const req of reqs){
//       const {ent, trait, action} = req;
//       const [name, info] = action;
//       if(!ent.valid) continue;
//
//       if(m === null) m = name;
//       assert(name === m);
//
//       if(!entTraitDataMap.has(ent))
//         entTraitDataMap.set(ent, new Map());
//
//       const traitDataMap = entTraitDataMap.get(ent);
//
//       if(!traitDataMap.has(trait))
//         traitDataMap.set(trait, new Set());
//
//       const vals = traitDataMap.get(trait);
//
//       if(name === 'val.set'){
//         vals.add(info);
//         continue;
//       }
//
//       assert.fail();
//
//       // if(!entTraitDataMap.has(ent))
//       //   entTraitDataMap.set(ent, new Map());
//     }
//
//     for(const [ent, map] of entTraitDataMap){
//       for(const [trait, set] of map){
//         assert(set.size !== 0);
//         if(set.size !== 1) continue;
//
//         ent.setLocData(trait, O.uni(set));
//       }
//     }
//   }
//
//   constructor(world, ent, trait, action){
//     super(world);
//
//     this.ent = ent;
//     this.trait = trait;
//     this.action = action;
//   }
// }

class CreateEntity extends SimpleRequest{
  constructor(world, tile, entCtor, args){
    super(world);

    this.tile = tile;
    this.entCtor = entCtor;
    this.args = args;
  }

  simpleExec(){
    this.tile.createEnt(this.entCtor, ...this.args);
  }
}

class MoveEntity extends Request{
  static exec(world, reqs){
    const map = new Map();

    for(const req of reqs){
      const {ent, tileFrom, tileTo} = req;
      if(!ent.valid) continue;

      assert(ent.tile === tileFrom);

      if(!map.has(ent)){
        map.set(ent, tileTo);
        continue;
      }

      if(map.get(ent) === tileTo)
        continue;

      map.set(ent, null);
    }

    for(const [ent, target] of map){
      if(target === null) continue;

      ent.tile.removeEnt(ent);
      ent.tile = target;
      target.addEnt(ent);
    }
  }

  constructor(world, ent, tileFrom, tileTo){
    super(world);

    this.ent = ent;
    this.tileFrom = tileFrom;
    this.tileTo = tileTo;
  }
}

class RemoveEntity extends Request{
  static exec(world, reqs){
    const removed = new Set();

    for(const req of reqs){
      const {ent} = req;
      if(!ent.valid) continue;

      if(removed.has(ent)) continue;
      removed.add(ent);

      ent.remove();
    }
  }

  constructor(world, ent){
    super(world);
    this.ent = ent;
  }
}

class SetItem extends Request{
  static exec(world, reqs){
    const traitItemMap = new Map();
    const itemTraitMap = new Map();
    const allItems = new Set();

    const add = (map, key, val) => {
      if(!map.has(key))
        map.set(key, new Set());

      map.get(key).add(val);
    };

    for(const req of reqs){
      const {trait, item} = req;

      if(!trait.valid) continue;
      if(item !== null && !item.valid) continue;

      add(traitItemMap, trait, item);
      add(itemTraitMap, item, trait);

      allItems.add(trait.item);
      allItems.add(item);
    }

    // const processedTraits = new Set();
    // const processedItems = new Set();
    //
    // const addProcessed = (trait, item) => {
    //   assert(!processedTraits.has(trait));
    //   processedTraits.add(trait);
    //
    //   if(item !== null){
    //     assert(!processedItems.has(item));
    //     processedItems.add(item);
    //   }
    // };

    for(const [trait, items] of traitItemMap){
      assert(items.size !== 0);
      if(items.size !== 1) continue;

      const item = O.uni(items);

      if(item === null){
        if(trait.item !== null)
          trait.item = null;

        // addProcessed(trait, item);
        continue;
      }

      assert(itemTraitMap.has(item));
      const traits = itemTraitMap.get(item);

      assert(traits.size !== 0);
      if(traits.size !== 1) continue;

      assert(O.uni(traits) === trait);

      if(trait.item !== null)
        trait.item = null;

      const trait1 = item.trait;

      if(trait1 !== null)
        trait1.item = null;

      trait.item = item;

      // addProcessed(trait, item);
    }

    allItems.delete(null);

    for(const item of allItems){
      if(item.trait !== null){
        assert(item.valid);
        continue;
      }

      world.detachedItems.add(item);
    }
  }

  constructor(world, trait, item){
    super(world);
    this.trait = trait;
    this.item = item;
  }
}

class DeleteItem extends Request{
  static exec(world, reqs){
    for(const req of reqs){
      const {item} = req;
      item.delete();
    }
  }

  constructor(world, item){
    super(world);
    this.item = item;
  }
}

// class PushRoom extends Request{
//   static exec(world, reqs){
//     if(reqs.size !== 1) O.noimpl();
//
//     const req = O.fst(reqs);
//     const {ent, gridCtor, gridCtorArgs, builder} = req;
//
//     if(ent !== null && ent.valid)
//       ent.createTrait(Trait.Entered);
//
//     world.pushRoom(gridCtor, gridCtorArgs, builder);
//   }
//
//   constructor(world, ent, gridCtor, gridCtorArgs, builder){
//     super(world);
//
//     if(ent !== null)
//       assert(ent instanceof Entity);
//
//     this.ent = ent;
//     this.gridCtor = gridCtor;
//     this.gridCtorArgs = gridCtorArgs;
//     this.builder = builder;
//   }
// }
//
// class PopRoom extends Request{
//   static exec(world, reqs){
//     if(reqs.size !== 1) O.noimpl();
//
//     const req = O.fst(reqs);
//     const {cb} = req;
//
//     world.popRoom();
//
//     const {grid} = world.selectedRoom;
//     const ent = grid.getEnt(Trait.Entered);
//
//     if(ent !== null)
//       ent.getTrait(Trait.Entered).remove();
//
//     if(cb !== null)
//       cb(grid, ent);
//   }
//
//   constructor(world, cb=null){
//     super(world);
//
//     this.cb = cb;
//   }
// }

class CreateRoom extends Request{
  static exec(world, reqs){
    for(const req of reqs){
      const {gridCtor, gridCtorArgs, builder} = req;
      world.createRoom(gridCtor, gridCtorArgs, builder);
    }
  }

  constructor(world, gridCtor, gridCtorArgs, builder){
    super(world);

    this.gridCtor = gridCtor;
    this.gridCtorArgs = gridCtorArgs;
    this.builder = builder;
  }
}

class SelectRoom extends Request{
  static exec(world, reqs){
    const candidates = new Set();

    for(const req of reqs){
      const {room} = req;
      if(!room.valid) continue;

      candidates.add(room);
    }

    const room = O.uni(candidates);
    if(!room) return;

    world.selectRoom(room);
  }

  constructor(world, room){
    super(world);

    this.room = room;
  }
}

class RemoveRoom extends Request{
  static exec(world, reqs){
    const {selectedRoom} = world;

    for(const req of reqs){
      const {room} = req;

      if(!room.valid) continue;
      if(room === selectedRoom) continue;

      world.removeRoom(room);
    }
  }

  constructor(world, room){
    super(world);

    this.room = room;
  }
}

const ctorsArr = [
  DeleteItem,
  SetItem,

  RemoveEntity,
  ModifyEntGlobData,
  // ModifyEntLocData,
  CreateEntity,
  MoveEntity,

  // PushRoom,
  // PopRoom,

  CreateRoom,
  SelectRoom,
  RemoveRoom,
];

const ctorsObj = ctorsPri(ctorsArr);

module.exports = Object.assign(Request, {
  ctorsArr,
  ...ctorsObj,
});