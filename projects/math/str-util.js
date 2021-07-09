'use strict';

const tabSize = 2;

const openParenChars = '([{';
const closedParenChars = ')]}';
const strLiteralDelimChars = '"`';

const addSpaces = (str, before=1, after=1) => {
  return tab(before) + str + tab(after);
};

const addParens = str => {
  return encap(str, '()');
};

const addBrackets = str => {
  return encap(str, '[]');
};

const addBraces = str => {
  return encap(str, '{}');
};

const isStrDelim = char => {
  return strLiteralDelimChars.includes(char);
};

const getTabSize = line => {
  const lineLen = line.length;

  for(let i = 0; i !== lineLen; i++)
    if(line[i] !== ' ')
      return i;

  return lineLen;
};

const getTabStr = line => {
  return tab(getTabSize(line));
};

const tab = (size, str='') => {
  return ' '.repeat(size) + str;
};

const isOpenParen = char => {
  return getOpenParenType(char) !== null;
};

const isClosedParen = char => {
  return getClosedParenType(char) !== null;
};

const getOpenParenType = char => {
  return O.indexOf(openParenChars, char);
};

const getClosedParenType = char => {
  return O.indexOf(closedParenChars, char);
};

const quote = (str, c='"') => {
  return encap(str, c + c)
};

const encap = (str, chars) => {
  return chars[0] + str + chars[1];
};

const tabStr = tab(tabSize);

module.exports = {
  tabSize,
  tabStr,

  openParenChars,
  closedParenChars,
  strLiteralDelimChars,

  addSpaces,
  addParens,
  addBrackets,
  addBraces,
  isStrDelim,
  getTabSize,
  getTabStr,
  tab,
  isOpenParen,
  isClosedParen,
  getOpenParenType,
  getClosedParenType,
  quote,
  encap,
};