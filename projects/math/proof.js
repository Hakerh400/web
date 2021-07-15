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

  hasSubgoal(){
    return this.subgoals.length !== 0;
  }

  setSubgoal(subgoal, copy=0){
    assert(this.hasSubgoal);
    if(copy) this.copySubgoals();

    this.subgoals[0] = subgoal;
  }

  isFinished(){
    return this.subgoals.length === 0;
  }

  get subgoal(){
    return O.fst(this.subgoals);
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

  *toStr(ctx){
    const {subgoal} = this;

    if(subgoal === null)
      return `No subgoals!`;

    const subgoalStr = yield [[subgoal, 'toStr'], ctx];

    return subgoalStr;
  }
}

module.exports = Proof;