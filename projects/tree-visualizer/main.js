'use strict';

const Node = require('./node');

const diameter = 32;
const radius = diameter / 2;

const cols = {
  bg: 'darkgray',
  nodeBg: 'white',
  nodeVal: 'black',
};

const {w, h, wh, hh, g} = O.ceCanvas();

const main = () => {
  aels();
  generate();
};

const aels = () => {
  O.ael('keydown', evt => {
    switch(evt.code){
      case 'ArrowRight': {
        generate();
        break;
      }
    }
  });
};

const generate = () => {
  const letters = O.chars('A', 26);

  const genNode = (parent=null) => {
    const node = new Node(O.randElem(letters));
    if(parent !== null) parent.add(node);
    return node;
  };

  const root = genNode();
  const nodes = [root];

  O.repeat(100, () => {
    nodes.push(genNode(O.randElem(nodes)));
  });

  for(const node of nodes)
    O.shuffle(node.ptrs);
  
  render(root);
};

const render = root => {
  g.fillStyle = cols.bg;
  g.fillRect(0, 0, w, h);

  const levels = [[root]];
  const edges = [];
  let d = diameter;

  while(1){
    const level = [];
    const levelEdges = [];
    let found = 0;

    O.last(levels).forEach((node, i) => {
      for(const ptr of node){
        if(!found) found = 1;
        level.push(ptr);
        levelEdges.push([i, level.length - 1]);
      }
    });

    if(!found) break;

    levels.push(level);
    edges.push(levelEdges);

    const sx = w / level.length;
    if(sx < d) d = sx;
  }

  const levelsNum = levels.length;
  const sy = h / levelsNum;

  if(sy < d) d = sy;
  const r = d / 2;

  g.font = `${r}px arial`;

  levels.forEach((level, y) => {
    const y1 = (y + .5) * sy;
    const sx1 = w / level.length;

    if(y !== levelsNum - 1){
      const y2 = (y + 1.5) * sy;
      const sx2 = w / levels[y + 1].length;

      g.beginPath();

      for(const [i, j] of edges[y]){
        g.moveTo(sx1 * (i + .5), y1);
        g.lineTo(sx2 * (j + .5), y2);
      }

      g.stroke();
    }

    level.forEach((node, x) => {
      const x1 = sx1 * (x + .5);

      g.fillStyle = cols.nodeBg;
      g.beginPath();
      g.arc(x1, y1, r, 0, O.pi2);
      g.fill();
      g.stroke();

      if(node.val !== null){
        g.fillStyle = cols.nodeVal;
        g.fillText(node.val, x1, y1);
      }
    });
  });
};

main();