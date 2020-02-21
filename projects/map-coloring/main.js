'use strict';

const Cell = require('./cell');
const Node = require('./node');

const {g, w, h, wh, hh} = O.ceCanvas();

const cols = [
  [0, 255, 255],
  [0, 255, 0],
  [255, 255, 0],
  [255, 0, 0],
].map(a => O.Buffer.from(a));

const main = async () => {
  try{
    const img = await new Promise((re, rj) => {
      const img = new Image();
      img.onload = () => re(img);
      img.onerror = rj;
      img.src = O.urlTime('/projects/image/1.png');
    });

    g.drawImage(img, w - img.width >> 1, h - img.height >> 1);
  }catch{
    for(const i of O.repeatg(1e3)){
      g.fillStyle = O.Color.rand();
      g.fillRect(O.rand(w - 100), O.rand(h) - 100, O.rand(50, 100), O.rand(50, 100));
    }
  }

  const imgd = new O.ImageData(g);
  const grid = new O.Grid(w, h, () => new Cell());
  const nodesSet = new Set();

  const c1 = O.Buffer.alloc(3);
  const c2 = O.Buffer.alloc(3);

  imgd.iter((x, y) => {
    const cell = grid.get(x, y);
    if(cell.node !== null) return;

    const node = new Node(x, y);
    cell.node = node;
    nodesSet.add(node);

    imgd.get(x, y, c1);

    grid.iterAdj(x, y, (x, y) => {
      if(!imgd.get(x, y, c2).equals(c1)) return 0;

      grid.get(x, y).node = node;
      return 1;
    });
  });

  const nodesNum = nodesSet.size;

  for(const node of nodesSet){
    grid.iterAdj(node.xStart, node.yStart, (x, y, d) => {
      const node1 = d.node;
      if(node1 === node) return 1;

      node.connect(node1);
      return 0;
    });
  }

  for(const node of nodesSet)
    node.resolvePtrs();

  const nodesArr = [];

  while(nodesSet.size !== 0){
    let node = O.first(nodesSet);

    loop: while(1){
      nodesSet.delete(node);
      nodesArr.push(node);

      for(const ptr of node.ptrsArr){
        if(nodesSet.has(ptr)){
          node = ptr;
          continue loop;
        }
      }

      break;
    }
  }

  const black = O.Buffer.from([0, 0, 0]);

  const render = () => {
    imgd.iter((x, y) => {
      const c = grid.get(x, y).node.col;
      if(c === null) return black;
      return cols[c];
    });
    imgd.put();
  };

  let index = 0;
  let animIndex = 0;

  while(index !== nodesNum){
    if(++animIndex === 1e3){
      animIndex = 0;
      await new Promise(r => O.raf(() => {
        render();
        r();
      }));
    }

    const node = nodesArr[index];
    const col = node.updateNextCol();

    if(col !== null) index++;
    else index--;
  }

  render();
};

main().catch(log);