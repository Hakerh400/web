'use strict';

const PL = require('/node/prog-langs/programming-language');
const LS = require('../../strings');
const Element = require('../element');
const Form = require('../form');
const OptionContainer = require('./option-container');
const Integer = require('./integer');
const LanguageChoice = require('./lang-choice');

const MAX_SIZE = 1e7;
const CRITICAL_SIZE = MAX_SIZE - 1e3;
const INSTRUCTIONS_PER_TICK = 1e4;

class Configuration extends Element.Region{
  constructor(parent){
    super(parent);

    this.opts = O.obj();

    this.addOpt('progLang', LanguageChoice);
    this.addOpt('maxSize', Integer, 1, 1e8, MAX_SIZE);
    this.addOpt('criticalSize', Integer, 1, 1e8, CRITICAL_SIZE);
    this.addOpt('instructionsPerTick', Integer, 1, 1e4, INSTRUCTIONS_PER_TICK);

    this.br();
    this.saveBtn = new Form.ButtonConfirm(this, LS.labels.sandbox.buttons.exportScript);

    this.saveBtn.on('click', () => {
      this.emit('exportScript');
    });
  }

  addOpt(label, optCtor, ...args){
    const {opt} = new OptionContainer(this, label, optCtor, ...args);
    this.opts[label] = opt;
    return opt;
  }

  get(opt){
    return this.opts[opt].val;
  }

  set(opt, val){
    this.opts[opt].val = val;
  }

  getLang(){
    return this.opts.progLang.getLang();
  }

  css(){ return 'sandbox-configuration'; }
}

module.exports = Configuration;