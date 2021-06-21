'use strict';

const assert = require('assert');

const {Bffer} = O;

class Entry{
  constructor(name){
    assert(/^[ -~]+$/.test(name));
    assert(!/^ | $| {2}|[\\\/]/.test(name));

    this.name = name;
  }
}

class Directory extends Entry{
  entries = O.obj();

  hasEntry(name){
    return !O.has(this.entries, name);
  }

  getEntry(name){
    assert(this.hasEntry(name));
    return this.entries[name];
  }

  addEntry(entry){
    const {name} = entry;
    assert(!this.hasEntry(name));
    this.entries[name] = name;
  }

  sortFiles(){
    this.files.sort()
  }
}

class File extends Entry{
  content = Buffer.alloc(0);

  getContent(){
    return this.content;
  }

  setCContent(content){
    this.content = content;
  }
}

const root = new Directory();

const readdir = pth => {
  let p = [];

  return splitPth(pth).reduce((dir, name) => {
    if(!(dir instanceof Directory))
      err(`${O.sf(pthParts2str(p))} is not a directory`);

    p.push(name);

    if(!dir.hasEntry(name))
      err(`${O.sf(pthParts2str(p))} does not exist`);

    return dir.getEntry(name);
  }, root);
};

const splitPth = pth => {
  if(!pth.startsWith('/'))
    err(`Path must start with \`/\``);

  return pth.split('/').slice(1);
};

const pthParts2str = parts => {
  return `/${parts.join('/')}`;
};

const err = msg => {
  throw new TypeError(msg);
};

module.exports = {
  readdir,
};