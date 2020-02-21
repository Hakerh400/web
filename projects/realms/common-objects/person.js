'use strict';

const Object = require('../object');
const Entity = require('./entity');

class Person extends Entity{
  static traits = this.initTraits(['friendly', 'person']);

  draw(g, t, k){
    g.beginPath();
    g.arc(0, 0, .4, 0, O.pi2);
    g.fill();
    g.stroke();

    g.fillStyle = 'white';
    g.beginPath();
    g.arc(-.2, -.05, .1, 0, O.pi2);
    g.fill();
    g.stroke();
    g.beginPath();
    g.arc(.2, -.05, .1, 0, O.pi2);
    g.fill();
    g.stroke();

    g.fillStyle = 'black';
    g.beginPath();
    g.arc(-.2, -.05, .035, 0, O.pi2);
    g.fill();
    g.beginPath();
    g.arc(.2, -.05, .035, 0, O.pi2);
    g.fill();

    g.beginPath();
    g.moveTo(-.1, .2);
    g.lineTo(.1, .2);
    g.stroke();
  }
}

module.exports = Person;