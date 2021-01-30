'use strict';

const {abs, sqrt, sign} = Math;

const {g, w, h, wh, hh} = O.ceCanvas();

const arcs = []
let arc = null;

const main = () => {
  aels();
  render();
};

const aels = () => {
  let cx = wh;
  let cy = hh;
  let stage = 0;

  const updateCursor = evt => {
    cx = evt.clientX;
    cy = evt.clientY;
  };

  const clearArc = () => {
    arc = null;
    stage = 0;
  };

  const ael = (type, func) => {
    O.ael(type, evt => {
      updateCursor(evt);
      func(evt);
    });
  };

  O.ael('keydown', evt => {
    const {code} = evt;

    if(evt.ctrlKey){
      if(code === 'KeyZ'){
        if(stage !== 0){
          clearArc();
          return;
        }

        if(arcs.length !== 0){
          arcs.pop();
          return;
        }

        return;
      }

      return;
    }
  });

  ael('mousedown', evt => {
    if(stage === 0){
      if(evt.button === 0){
        stage = 1;
        arc = [cx, cy, cx, cy, 0];
        return;
      }

      return;
    }

    if(stage === 1){
      if(evt.button === 0){
        if(arc[0] === arc[2] && arc[1] === arc[3])
          arc[0] += 1e-4;

        stage = 2;
        return;
      }

      return;
    }

    if(stage === 2){
      if(evt.button === 0){
        arcs.push(arc);
        clearArc();
        return;
      }

      if(evt.button === 2){
        clearArc();
        return;
      }

      return;
    }
  });

  ael('mousemove', evt => {
    if(stage === 1){
      arc[2] = cx;
      arc[3] = cy;
      return;
    }

    if(stage === 2){
      const [ax, ay, bx, by] = arc;

      if(ax === bx){
        arc[4] = (cx - ax) / (by - ay) * 2;
        return;
      }

      const rad = O.dist(ax, ay, bx, by) / 2;
      const k = (by - ay) / (bx - ax);
      const dist = abs(cy - k * cx + k * ax - ay) / sqrt(1 + k * k);
      const sgn = sign((cx - ax) * (by - ay) - (cy - ay) * (bx - ax));

      arc[4] = dist / rad * sgn;

      return;
    }
  });

  ael('contextmenu', evt => {
    O.pd(evt);
  });

  O.ael('blur', evt => {
    clearArc();
  });
};

const render = () => {
  g.fillStyle = '#fff';
  g.fillRect(0, 0, w, h);

  for(const arc of arcs)
    drawArc(arc);

  if(arc !== null)
    drawArc(arc);

  O.raf(render);
};

const drawArc = arc => {
  g.beginPath();
  g.moveTo(arc[0], arc[1]);
  O.drawArc(g, ...arc);
  g.stroke();
};

main();