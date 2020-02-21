'use strict';

const cmn = require('../../common-objects');
const Transition = require('../../transition');
const Pivot = require('../../pivot');

class Ground extends cmn.Ground{
  static objName = 'floor';

  static gradients = this.initGradients([
    [-.5, -.5, .5, .5, '#fff', '#888'],
    [-.5, -.5, .5, .5, '#f0f', '#808'],
  ]);

  constructor(tile, target=0){
    super(tile);

    this.target = target & 1;
  }

  ser(s){ s.write(this.target); }
  deser(s){ this.target = s.read(); }

  draw(g, t, k){
    g.fillStyle = this.gradient(g, this.target);
    super.draw(g, t, k);
  }
}

class Box extends cmn.Object{
  static objName = 'box';
  static layer = 4;
  static traits = this.initTraits(['occupying', 'pushable', 'nonFloating', 'heavy']);
  static listenersL = this.initListenersL(['update']);
  static listenersM = this.initListenersM(['push']);

  update(evt){
    return this.checkGround();
  }

  draw(g, t, k){
    const s1 = .3;
    const s2 = .215;
    const s3 = .075;

    g.fillStyle = '#ff0';
    g.beginPath();
    g.rect(-s1, -s1, s1 * 2, s1 * 2);
    g.fill();
    g.stroke();

    g.fillStyle = '#880';
    g.beginPath();
    g.rect(-s2, -s2, s2 * 2, s2 * 2);
    g.fill();
    g.stroke();

    g.fillStyle = '#ff0';
    g.beginPath();
    g.moveTo(s2 - s3, -s2);
    g.lineTo(s2, -s2);
    g.lineTo(s2, -s2 + s3);
    g.lineTo(-s2 + s3, s2);
    g.lineTo(-s2, s2);
    g.lineTo(-s2, s2 - s3);
    g.closePath();
    g.fill();
    g.stroke();
    g.beginPath();
    g.moveTo(-s2 + s3, -s2);
    g.lineTo(-s2, -s2);
    g.lineTo(-s2, -s2 + s3);
    g.lineTo(s2 - s3, s2);
    g.lineTo(s2, s2);
    g.lineTo(s2, s2 - s3);
    g.closePath();
    g.fill();
    g.stroke();
  }

  push(evt){
    const {tile} = this;

    const dir = tile.adjDir(evt.src.tile);
    if(dir === -1) return 0;

    return this.tryToMove(tile.invDir(dir));
  }
}

class Player extends cmn.Person{
  static objName = 'player';
  static traits = this.initTraits(['nonFloating', 'heavy']);
  static listenersG = this.initListenersG(['navigate']);
  static listenersL = this.initListenersL(['update']);

  navigate(evt){
    const {tick} = this;
    const {dir, dmax} = evt;
    const tile = this.tile.adj(dir, dmax);
    const {has} = tile;

    if(!has.occupying){
      this.move(dir, dmax);
      return 1;
    }

    if(!has.pushable) return 0;
    if(!this.send(tile, 'pushable', 'push')) return 0;
    if(!has.occupying) this.move(dir, dmax);

    return 1;
  }

  update(evt){
    return this.checkGround();
  }

  draw(g, t, k){
    g.fillStyle = '#0f0';
    super.draw(g, t, k);
  }
}

class Wall extends cmn.Wall{
  static objName = 'wall';

  static gradients = this.initGradients([
    [-.5, -.5, .5, .5, '#777', '#222'],
  ]);

  draw(g, t, k){
    const {tile} = this;

    g.save();
    g.scale(1.02, 1.02);
    g.fillStyle = '#222';
    g.beginPath();
    tile.border(g);
    g.fill();
    g.restore();

    g.fillStyle = this.gradient(g, 0);
    g.save();
    g.scale(.9, .9);
    g.beginPath();
    tile.border(g);
    g.fill();
    g.restore();

    return 1;
  }
}

module.exports = {
  Ground,
  Box,
  Player,
  Wall,
};