'use strict';

class Info{
  *toDOM(){ O.virtual('toDOM'); }
}

class BasicInfo extends Info{
  constructor(str){
    super();
    this.str = String(str);
  }

  *toDOM(){
    return ce('div', 'info-elem', this.str);
  }
}

class DetailedInfo extends Info{
  constructor(summary, details){
    super();
    this.summary = String(summary);
    this.details = details;
  }

  *toDOM(){
    const {summary, details} = this;
    const elem = ce('details');

    cpe(elem, 'summary', '', summary);

    if(details.length !== 0){
      for(const info of details)
        ac(elem, yield [[info, 'toDOM']]);
    }else{
      ac(elem, ce('div', 'info-elem info-elem-empty', '(empty)'));
    }

    return elem;
  }
}

const cpe = (parent, ...args) => {
  return ac(parent, ce(...args));
};

const ce = (tag, classNames='', innerText='') => {
  const elem = O.doc.createElement(tag);

  if(classNames.length !== 0)
    for(const cn of classNames.split(' '))
      elem.classList.add(cn);

  elem.innerText = innerText;

  return elem;
};

const ac = (parent, elem) => {
  return parent.appendChild(elem);
};

module.exports = {
  Info,
  BasicInfo,
  DetailedInfo,
};