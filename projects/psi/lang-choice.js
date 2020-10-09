'use strict';

const PL = require('/node/prog-langs/programming-language');
const langsList = require('/node/prog-langs/langs-list');
const LS = require('../../strings');
const Element = require('../element');

const DEFAULT_LANG = 'Functional()';

class LanguageChoice extends Element.InputDropdown{
  constructor(parent){
    super(parent, 'lang');

    const langs = O.sortAsc(O.keys(langsList));

    for(let i = 0; i !== langs.length; i++){
      const name = langs[i];
      const lang = langsList[name];

      this.addOpt(name, name, name === DEFAULT_LANG);
    }
  }

  getLang(){
    return PL.get(this.val);
  }

  css(){ return 'lang-choice'; }
}

module.exports = LanguageChoice;