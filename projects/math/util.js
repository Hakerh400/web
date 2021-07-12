'use strict';

const assert = require('assert');

const identChars = O.chars('a', 'z');

let n = 0;
const newSym = () => {
  n++;
  // if(n === 24) debugger;
  return Symbol(n);
};

const copyObj = obj => {
  return Object.assign(O.obj(), obj);
};

const obj2 = () => {
  return [O.obj(), O.obj()];
};

const getAvailIdents = (ctx, strSymObj, isType, num) => {
  const obj = copyObj(strSymObj);

  return O.ca(num, () => {
    const ident = getAvailIdent(ctx, obj, isType);
    obj[ident] = 1;
    return ident;
  });
};

const getAvailIdent = (ctx, strSymObj, isType=0) => {
  for(let i = 0;; i++){
    const name = genIdent(i, isType);

    if(ctx.hasIdent(name)) continue;
    if(O.has(strSymObj, name)) continue;

    return name;
  }
};

const genIdent = (i, isType=0) => {
  i++;

  if(!isType)
    return O.arrOrder.str(identChars, i);

  const sub = Array.from(String(i), n => O.sfcc(0x2080/*0x30*/ | n))

  return `'τ${sub}`;
};

const mergeUniq = (obj1, obj2) => {
  const obj = O.obj();

  for(const key of O.keys(obj1))
    obj[key] = obj1[key];

  for(const key of O.keys(obj2)){
    assert(!O.has(obj, key));
    obj[key] = obj2[key];
  }

  return obj;
};

const empty = obj => {
  return O.keys(obj).length === 0;
};

const isStrOrSym = a => {
  return isStr(a) || isSym(a);
};

const isStr = a => {
  return typeof a === 'string';
};

const isSym = a => {
  return typeof a === 'symbol';
};

const isNum = a => {
  return typeof a === 'symbol';
};

module.exports = {
  identChars,

  newSym,
  copyObj,
  obj2,
  getAvailIdents,
  getAvailIdent,
  genIdent,
  mergeUniq,
  empty,
  isStrOrSym,
  isStr,
  isSym,
  isNum,
};