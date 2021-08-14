'use strict';

const fnum = (num, forceSign=0) => {
  const s = sign(num);
  num = abs(num);

  num = reverseStr(`${num}`);
  num = num.replace(/.{3}/g, digits => `${digits} `);
  num = reverseStr(num).trim();
  num = num.replace(/ /g, ',');

  if(s === -1) num = `-${num}`;
  else if(forceSign) num = `+${num}`;

  return num;
};

const reverseStr = str => {
  return str.split('').reverse().join('');
};

const sign = n => {
  if(Number.isInteger(n)) return Math.sign(n);
  return n > 0n ? 1 : n < 0n ? -1 : 0;
};

const abs = n => {
  if(Number.isInteger(n)) return Math.abs(n);
  return n >= 0n ? n : -n;
};

module.exports = fnum;