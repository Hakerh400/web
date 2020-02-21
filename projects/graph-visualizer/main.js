'use strict';

const Node = require('./node');

const {min, max, sqrt, sin, cos, atan2} = Math;

const NODE_RADIUS = 16;
const FINAL_RADIUS_FACTOR = 1.5;
const GRAPH_RADIUS_FACTOR = .8;
const ARROW_SIZE = 15;
const ARROW_ANGLE = O.pi4;

const {g, w, h, wh, hh} = O.ceCanvas();

const main = () => {
  const graph = getGraph();
  render(graph);
};

const getGraph = () => {
  const {glob} = O;
  if('graph' in glob) return glob.graph;
  return generateGraph();
};

const generateGraph = () => {
  const n = 10;
  const map = new Map();

  const ns = O.ca(n, i => {
    const node = new Node();
    map.set(node, i);
    return node;
  });

  const root = ns[0].set(ns[5], ns[5]);

  for(let i = 1; i !== n; i++){
    const node = ns[i];
    const a = (i & 1) === 0;
    const b = (i & 2) === 0;

    if(b){
      if(a) node.set(ns[(i + n - 1) % n], ns[(i + 1) % n]);
      else node.set(ns[(i + 1) % n], ns[(i + n - 1) % n]);
    }else{
      if(a) node.set(node, ns[(i + 1) % n]);
      else ns[i].set(ns[(i + 1) % n], ns[i]);
    }

    if(a) node.final = 1;
  }

  const getNodes = root => {
    const visited = new Set();
    const map = new Map();
    const stack = [root];
    const ns = [];

    while(stack.length !== 0){
      const node = stack.pop();
      if(visited.has(node)) continue;

      ns.push(node);
      visited.add(node);
      map.set(node, ns.length - 1);
      
      stack.push(node[1], node[0]);
    }

    return [ns, map];
  };

  const rename = root => {
    const [ns, map] = getNodes(root);
    const nsNew = ns.map((n, i) => new Node().setName(O.sfcc(O.cc('A') + i)));

    ns.forEach((node, i) => {
      const nodeNew = nsNew[i];
      nodeNew.set(nsNew[map.get(node[0])], nsNew[map.get(node[1])]);
      if(node.final) nodeNew.final = 1;
    });

    return nsNew[0];
  };

  return rename(root);
};

const render = root => {
  g.resetTransform();
  g.fillStyle = 'darkgray';
  g.fillRect(0, 0, w, h);

  const visited = new Set();
  const map = new Map();
  const stack = [root];
  const ns = [];

  while(stack.length !== 0){
    const node = stack.pop();
    if(visited.has(node)) continue;

    ns.push(node);
    visited.add(node);
    map.set(node, ns.length - 1);
    
    stack.push(node[1], node[0]);
  }

  const num = ns.length;
  const s = NODE_RADIUS;
  const r = min(wh, hh) * GRAPH_RADIUS_FACTOR / s;
  const as = ARROW_SIZE / s;
  const aa = ARROW_ANGLE;

  g.translate(wh, hh);
  g.scale(s, s);
  g.lineWidth = 2 / s;
  g.font = `1px arial`;

  O.repeat(num, (i, k) => {
    const angle = k * O.pi2 - O.pih;
    const x = cos(angle) * r;
    const y = sin(angle) * r;

    const node = ns[i];
    const ptr0 = node[0];
    const ptr1 = node[1];
    const same = ptr0 === ptr1;

    for(let ptri = 0; ptri !== 2; ptri++){
      if(ptri && same) continue;

      const ptr = ptri ? ptr1 : ptr0;
      const radius = ptr.final ? FINAL_RADIUS_FACTOR : 1;
      const j = map.get(ptr);
      const a1 = j / num * O.pi2 - O.pih;
      const x1 = cos(a1) * r;
      const y1 = sin(a1) * r;

      const dir = atan2(y - y1, x - x1);

      g.fillStyle = same ? '#f0f' : ptri === 0 ? '#00f' : '#f00';
      g.strokeStyle = g.fillStyle;

      let ax = null;
      let ay = null;
      let dir1 = null;

      if(i > j && (ptr[0] === node || ptr[1] === node)){
        g.beginPath();
        g.moveTo(x, y);
        const [mx, my] = O.drawArc(g, x, y, x1, y1, .5);
        g.stroke();

        const R2 = O.dists(mx, my, x, y);
        const a = mx, b = my;
        const c = x1, d = y1;
        const P = 2 * (a - c);
        const Q = R2 - a * a - b * b + c * c + d * d - radius * radius;
        const dbm = d - b;
        const db = dbm === 0 ? 1e-5 : dbm;
        const db2 = db * db;
        const M = Q - 4 * db * b;
        const A = 4 * db2 + P * P;
        const B = P * (M + Q) - 8 * a * db2;
        const C = Q * M - 4 * db2 * (R2 - a * a - b * b);
        const D = B * B - 4 * A * C;

        const p1 = -B / (2 * A);
        const p2 = -sqrt(D) / (2 * A);
        const ax1 = p1 + p2;
        const ax2 = p1 - p2;
        const ay1 = (P * ax1 + Q) / (2 * db);
        const ay2 = (P * ax2 + Q) / (2 * db);

        const d1 = O.dists(ax1, ay1, x, y);
        const d2 = O.dists(ax2, ay2, x, y);

        if(d1 < d2) ax = ax1, ay = ay1;
        else ax = ax2, ay = ay2;

        dir1 = atan2(b - ay, a - ax) + O.pih;
      }else if(ptr === node){
        const r = radius * 1.5;
        const d = atan2(y1, x1);
        const xx = x1 + cos(d) * r;
        const yy = y1 + sin(d) * r;

        g.beginPath();
        g.arc(xx, yy, r, 0, O.pi2);
        g.stroke();
      }else{
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x1, y1);
        g.stroke();

        ax = x1 + cos(dir) * radius;
        ay = y1 + sin(dir) * radius;
        dir1 = dir;
      }

      if(dir1 !== null){
        g.beginPath();
        g.moveTo(ax, ay);
        g.lineTo(ax + cos(dir1 - aa) * as, ay + sin(dir1 - aa) * as);
        g.lineTo(ax + cos(dir1 + aa) * as, ay + sin(dir1 + aa) * as);
        g.fill();
      }
    }
  });

  O.repeat(num, (i, k) => {
    const node = ns[i];
    const angle = k * O.pi2 - O.pih;
    const x = cos(angle) * r;
    const y = sin(angle) * r;

    g.fillStyle = 'white';
    g.strokeStyle = 'black';

    if(node.final){
      g.beginPath();
      g.arc(x, y, FINAL_RADIUS_FACTOR, 0, O.pi2);
      g.fill();
      g.stroke();
    }

    g.beginPath();
    g.arc(x, y, 1, 0, O.pi2);
    g.fill();
    g.stroke();

    g.fillStyle = 'black';
    g.fillText(node.name, x, y);
  });
};

const ser = root => {
  const nodes = new Map();
  const stack = [root];
  let index = 0;
  let arr = [];

  while(stack.length !== 0){
    const node = stack.pop();

    if(nodes.has(node)){
      arr.push(nodes.get(node));
      continue;
    }

    nodes.set(node, index);
    arr.push(index++);
    stack.push(node[1], node[0]);
  }

  return arr;
};

main();