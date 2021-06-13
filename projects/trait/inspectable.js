'use strict';

const Serializable = require('./serializable');

class Inspectable extends Serializable{
  *inspect(){ O.virtual('inspect'); }

  inspectBool(val){
    return `${val ? 'True' : 'False'} :: Bool`;
  }

  inspectDir(dir){
    return `${[
      'Up',
      'Right',
      'Down',
      'Left',
    ][dir]} :: Direction`;
  }
}

module.exports = Inspectable;