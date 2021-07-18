'use strict';

const assert = require('assert');
const util = require('./util');
const su = require('./str-util');

class Proof{
  constructor(name, prop, subgoals=[]){
    this.name = name;
    this.prop = prop;
    this.subgoals = subgoals;
  }

  copy(){
    return new Proof(
      this.name,
      this.prop,
      this.subgoals,
    );
  }

  copySubgoals(){
    this.subgoals = this.subgoals.slice();
  }

  get hasSubgoal(){
    return this.subgoals.length !== 0;
  }

  get finished(){
    return this.subgoals.length === 0;
  }

  get subgoal(){
    return O.fst(this.subgoals);
  }

  setSubgoal(subgoal, copy=0){
    assert(this.hasSubgoal);
    if(copy) this.copySubgoals();

    this.subgoals[0] = subgoal;
  }

  addSubgoals(subgoals){
    for(let i = subgoals.length - 1; i !== -1; i--)
      this.addSubgoal(subgoals[i]);
  }

  addSubgoal(subgoal){
    this.subgoals.unshift(subgoal);
  }

  removeSubgoal(){
    assert(this.hasSubgoal);
    this.subgoals.shift();
  }

  *toStr(ctx, toStrIdents=util.obj2()){
    const {subgoals} = this;
    const subgoalsNum = subgoals.length;

    if(subgoalsNum === 0)
      return `No subgoals!`;

    const subgoal = subgoals[0];
    const subgoalStr = yield [[subgoal, 'toStr'], ctx, toStrIdents];

    return subgoalStr;
    // return `${subgoalStr}\n\n[${subgoalsNum - 1}]`;
  }
}

module.exports = Proof;