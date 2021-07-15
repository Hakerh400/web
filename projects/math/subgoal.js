'use strict';

const assert = require('assert');
const util = require('./util');
const su = require('./str-util');

class Subgoal{
  idents = O.obj();
  premises = [];
  goal = null;

  constructor(ctx, idents=null, premises=null, prop=null){
    this.ctx = ctx;

    if(idents !== null)
      this.idents = util.copyObj(idents);

    if(premises !== null)
      this.premises = premises.slice();

    if(prop !== null)
      O.rec([this, 'addProp'], prop);
  }

  *addProp(propRaw){
    assert(this.goal === null);

    const {ctx, idents, premises} = this;

    const prop = yield [[propRaw, 'simplify'], ctx];
    const [unis, imps] = prop.getPropInfo(ctx);
    const goal = imps.pop();

    const unisNum = unis.length;
    const impsNum = imps.length;

    const availIdents = util.getAvailIdents(ctx, O.obj(), 0, unisNum);

    for(let i = 0; i !== unisNum; i++){
      const sym = unis[i];
      const name = availIdents[i];
    }
  }
}

module.exports = Subgoal;

const Expr = require('./expr');

const {Ident, Call, Lambda} = Expr;