'use strict';

const StackFrame = require('./stack-frame');

const {g, w, h, wh, hh} = O.ceCanvas();

const w3 = w / 3;
const h3 = h / 3;
const w2 = w3 * 2;
const h2 = h3 * 2;

const main = () => {
  const root = getRoot();
  let state = root;

  render(state.data);

  O.ael('mousedown', evt => {
    if(evt.button === 2){
      state = root;
      render(state.data);
      return;
    }

    if(evt.button !== 0) return;
    if(state.next.length === 0) return;

    const x = evt.clientX / w3 | 0;
    const y = evt.clientY / h3 | 0;
    if(x < 0 || y < 0 || x >= 3 || y >= 3) return;

    const p1 = (state.level & 1) === 0;
    const p = p1 ? 1 : 2;
    const index = y * 3 + x;
    if(state.data[index] !== 0) return;

    state = state.next.find(s => s.data[index] === p);

    if(state.next.length === 0){
      render(state.data);
      return;
    }

    state = state.next.find(s => s.cost === state.cost);
    render(state.data);
  });

  O.ael('contextmenu', evt => {
    O.pd(evt);
  });
};

const render = data => {
  g.fillStyle = '#fff';
  g.fillRect(0, 0, w, h);

  for(let y = 0; y !== 3; y++){
    for(let x = 0; x !== 3; x++){
      const p = data[y * 3 + x];
      if(p === 0) continue;
      g.fillStyle = p === 1 ? '#0f0' : '#f00';
      g.fillRect(w3 * x, h3 * y, w3, h3);
    }
  }

  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(w3, 0); g.lineTo(w3, h);
  g.moveTo(w2, 0); g.lineTo(w2, h);
  g.moveTo(0, h3); g.lineTo(w, h3);
  g.moveTo(0, h2); g.lineTo(w, h2);
  g.stroke();
};

const getRoot = () => {
  const root = new StackFrame(null, 0, O.ca(9, () => 0));
  const stack = [root];

  while(stack.length !== 0){
    const frame = O.last(stack);
    const {level, data, cost, next} = frame;
    const p1 = (level & 1) === 0;

    if(next === null){
      const next = frame.next = [];
      let win = 0;

      for(let p = 1; p <= 2; p++){
        if(data[0] === p && data[4] === p && data[8] === p) win = p;
        if(data[2] === p && data[4] === p && data[6] === p) win = p;
        for(let y = 0; y !== 3; y++){
          for(let x = 0; x !== 3; x++){
            if(data[y * 3] === p && data[y * 3 + 1] === p && data[y * 3 + 2] === p) win = p;
            if(data[x] === p && data[x + 3] === p && data[x + 6] === p) win = p;
          }
        }
      }

      if(win !== 0){
        frame.cost = (win === 1 ? 1 : -1) / (level + 1);
        stack.pop();
        continue;
      }

      for(let i = 0; i !== data.length; i++){
        if(data[i] === 0){
          const dataNew = data.slice();
          dataNew[i] = p1 ? 1 : 2;

          const frameNew = new StackFrame(frame, level + 1, dataNew);
          next.push(frameNew);
          stack.push(frameNew);
        }
      }

      continue;
    }

    stack.pop();

    if(next.length === 0){
      frame.cost = 0;
      continue;
    }

    let costNew = p1 ? -Infinity : Infinity;
    for(const frameNew of next)
      if(p1 ? frameNew.cost > costNew : frameNew.cost < costNew)
        costNew = frameNew.cost;

    frame.cost = costNew;
  }

  return root;
};

main();