'use strict';

const O = require('../omikron');
const Vector = require('./vector');

const coords = new Int8Array(3);

module.exports = execute;

function execute(bot, inp, out, ticks){
  if(inp.length === 0) return ticks;

  const op = inp[0];

  switch(op){
    case 0x00: { // Dispatch
      out.length = 0;
      out.push(0);
      inp.splice(0, 1);
      ticks = 0;
      break;
    }

    case 0x01: { // Rotate
      if(inp.length < 2) break;
      out.length = 0;

      const dir = inp[1];
      if(dir === (dir & 3)){
        bot.dir = bot.dir + dir & 3;
        out.push(0);
      }else{
        out.push(1);
      }

      ticks = 0;
      inp.splice(0, 2);
      break;
    }

    case 0x02: { // Go forward
      out.length = 0;

      if(bot.canGo()){
        bot.go();
        out.push(0);
      }else{
        out.push(1);
      }

      inp.splice(0, 1);
      ticks = 0;
      break;
    }

    case 0x03: { // Jump
      out.length = 0;

      if(bot.canJump()){
        bot.jump();
        out.push(0);
      }else{
        out.push(1);
      }

      inp.splice(0, 1);
      ticks = 0;
      break;
    }

    case 0x04: { // Can the bot see the given tile
      if(inp.length < 4) break;
      out.length = 0;

      const [x, y, z] = getCoords(inp);

      // if(x||y||z)debugger;
      out.push(0);
      out.push(bot.canSee(x, y, z));

      inp.splice(0, 4);
      break;
    }

    case 0x05: { // Does the given tile have an object with the given traits
      if(inp.length < 5) break;

      const tlen = inp[4];
      if(inp.length < tlen + 5) break;

      out.length = 0;

      const [x, y, z] = getCoords(inp);
      const traits = O.Buffer.from(inp.slice(5, tlen + 5)).toString().split(' ');
      inp.splice(0, tlen + 5);

      if(!bot.canSee(x, y, z)){
        out.push(1);
        break;
      }

      const d = bot.get(x, y, z);
      const obj = d.findm(traits);

      out.push(0);
      out.push(obj !== null);
      break;
    }

    case 0x06: { // Send the given request to the first object with the given traits from the given tile
      if(inp.length < 5) break;

      const tlen = inp[4];
      if(inp.length < tlen + 5) break;

      const mlen = inp[tlen + 5];
      if(inp.length < tlen + mlen + 6) break;

      out.length = 0;

      const [x, y, z] = getCoords(inp);
      const traits = O.Buffer.from(inp.slice(5, tlen + 5)).toString().split(' ');
      const msg = O.Buffer.from(inp.slice(tlen + 6, tlen + mlen + 6)).toString();
      inp.splice(0, tlen + mlen + 6);

      if(!bot.canSee(x, y, z)){
        out.push(1);
        break;
      }

      const d = bot.get(x, y, z);
      const obj = d.findm(traits);
      if(obj === null){
        out.push(1);
        break;
      }

      out.push(0);
      out.push(obj.send(bot, msg) & 255);
      ticks = 0;
      break;
    }

    default: {
      out.length = 0;
      out.push(1);
      ticks = 0;
      break;
    }
  }

  return ticks;
}

function getCoords(inp){
  coords[0] = inp[1];
  coords[1] = inp[2];
  coords[2] = inp[3];

  return coords;
}