'use strict';

const {min, max} = Math;

const FACTOR = .8;

const {g, w, h, wh, hh} = O.ceCanvas();

const main = () => {
  const path = 'D F I J K M O R T S Q P N H G E A B C L';

  const orig = [
    [62.0, 58.4],
    [57.5, 56.0],
    [51.7, 56.0],
    [67.9, 19.6],
    [57.7, 42.1],
    [54.2, 29.1],
    [46.0, 45.1],
    [34.7, 45.1],
    [45.7, 25.1],
    [34.7, 26.4],
    [28.4, 31.7],
    [33.4, 60.5],
    [22.9, 32.7],
    [21.5, 45.8],
    [15.3, 37.8],
    [15.1, 49.6],
    [9.1, 52.8],
    [9.1, 40.3],
    [2.7, 56.8],
    [2.7, 33.1],
  ];

  const cs = orig.map(a => a.slice());

  const [xMin, yMin, xMax, yMax] = cs.reduce(([xMin, yMin, xMax, yMax], [x, y]) => {
    return [min(x, xMin), min(y, yMin), max(x, xMax), max(y, yMax)];
  }, cs[0].concat(cs[0]));

  const dx = xMax - xMin;
  const dy = yMax - yMin;

  const s = min(w / dx * FACTOR, h / dy * FACTOR);
  const x1 = wh - dx * s / 2;
  const y1 = hh - dy * s / 2;

  for(const c of cs){
    c[0] = x1 + (c[0] - xMin) * s;
    c[1] = y1 + (yMax - c[1]) * s;
  }

  log(O.match(path.toLowerCase(), /[a-z]/g).map(a => O.cc(a) - O.cc('a') + 1).join(' '));

  g.lineWidth = 3;
  g.strokeStyle = 'red';
  g.beginPath();
  let cost = 0;
  let first = 1;
  O.match(path.toLowerCase(), /[a-z]/g).map(a => O.cc(a) - O.cc('a')).reduce((a, b) => {
    const [x1, y1] = cs[a];
    const [x2, y2] = cs[b];
    cost += O.dist(orig[a][0], orig[a][1], orig[b][0], orig[b][1]);
    if(first){
      first = 0;
      g.moveTo(x1, y1);
    }
    g.lineTo(x2, y2);
    return b;
  });
  log(cost);

  g.font = '50px arial';
  g.fillStyle = 'black';
  for(let i = 0; i !== cs.length; i++){
    const [x, y] = cs[i];
    g.fillText(i + 1, x, y);
  }

  g.stroke();
};

main();