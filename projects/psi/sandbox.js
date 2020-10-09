'use strict';

const RenderEngine = require('./render-engine');
const execute = require('./execute');

const SCRIPT_IDENTIFIER = 'ai-playground.user-script';
const SCRIPT_VERSION = 1;

const WIDTH = 926;
const HEIGHT = 671;

const DEFAULT_TAB = 'script';

class Sandbox{
  constructor(parent){
    this.parent = parent;

    this.running = 0;
    this.awaitingPause = 0;
    this.disposed = 0;

    const reng = this.reng = new RenderEngine(O.body, WIDTH, HEIGHT);
    reng.init()//.catch(log);
  }
}

module.exports = Sandbox;