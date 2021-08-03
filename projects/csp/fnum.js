'use strict';

function fnum(num, forceSign=0){
  const s = sign(num);
  num = abs(num);

  num = reverseStr(`${num}`);
  num = num.replace(/.{3}/g, digits => `${digits} `);
  num = reverseStr(num).trim();
  num = num.replace(/ /g, ',');

  if(s === -1) num = `-${num}`;
  else if(forceSign) num = `+${num}`;

  return num;
}

function reverseStr(str){
  return str.split('').reverse().join('');
}

function sign(n){
  if(Number.isInteger(n)) return Math.sign(n);
  return n > 0n ? 1 : n < 0n ? -1 : 0;
}

function abs(n){
  if(Number.isInteger(n)) return Math.abs(n);
  return n >= 0n ? n : -n;
}

module.exports = fnum;