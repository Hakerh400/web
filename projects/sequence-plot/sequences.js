'use strict';

const sequences = [
  function*(){
    let i = 2;
    let a = 1;

    yield 1;

    while(1){
      const g = gcd(i, a);

      if(g === 1) yield a += i + 1;
      else yield a /= g;

      i++;
    }
  },

  function*(){
    let a = 2;

    while(1){
      yield a - parseInt(a.toString(2).split('').reverse().join(''), 2) + 1e5;
      a = nextPrime(a);
    }
  },

  function*(){
    let i = 0;

    while(1){
      yield (i++).toString(3).split('').reduce((a, b) => {
        b |= 0;
        return a * 3 + (b === 2 ? -1 : b);
      }, 0);
    }
  },

  function*(){
    let i = 1;

    while(1){
      yield i - (i++).toString().split('').reduce((a, b) => {
        b |= 0;
        return b === 0 ? a : a * b;
      }, 1);
    }
  },

  function*(){
    const a = [1, 1];
    let n = 2;

    yield 1;
    yield 1;

    while(1){
      const k = n + 1 >> 1;
      let b = 1;

      outerLoop: while(1){
        for(let i = 1; i <= k; i++){
          if(b + a[n - (i << 1)] === (a[n - i] << 1)){
            b++;
            continue outerLoop;
          }
        }
        break;
      }

      yield b;
      a.push(b);
      n++;
    }
  },
];

const gcd = (a, b) => {
  if(b > a){
    let t = a;
    a = b;
    b = t;
  }

  while(b !== 0){
    let t = a;
    a = b;
    b = t % b;
  }

  return a;
};

const isPrime = a => {
  if(a === 1) return 0;

  const b = Math.sqrt(a) | 0;
  for(let i = 2; i <= b; i++)
    if(a % i === 0) return 0;

  return 1;
};

const nextPrime = a => {
  while(!isPrime(++a));
  return a;
};

module.exports = sequences;