'use strict';

const assert = require('assert');
const util = require('./util');
const su = require('./str-util');

const specialChars = [
  ['\\lam', 'λ'],
  ['\\for', '∀'],
  ['\\exi', '∃'],
  ['\\uniq', '∃!'],
  ['\\tau', 'τ'],
  ['<->', su.addSpaces('⟷')],
  ['->', su.addSpaces('⟶')],
  ['=>', su.addSpaces('⟹')],
  ['/\\', '∧'],
  ['\\/', '∨'],
  ['\\not', '¬'],
  ['\\neq', '≠'],
  ['\\eqv', '≡'],
  ...O.ca(10, i => [`\\${i}`, O.sfcc(0x2080 | i)]),
];

module.exports = specialChars;