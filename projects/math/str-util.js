'use strict';

const tabSize = 2;

const openParenChars = '([{';
const closedParenChars = ')]}';
const strLiteralDelimChars = '"`';

const addSpaces = (str, before=1, after=1) => {
  return tab(before) + str + tab(after);
};

const addParens = str => {
  return `(${str})`;
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

const tabStr = tab(tabSize);

module.exports = {
  tabSize,
  tabStr,

  openParenChars,
  closedParenChars,
  strLiteralDelimChars,

  addSpaces,
  addParens,
  isStrDelim,
  getTabSize,
  getTabStr,
  tab,
  isOpenParen,
  isClosedParen,
  getOpenParenType,
  getClosedParenType,
};