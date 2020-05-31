'use strict';

const {abs} = Math;
const {g, w, h, wh, hh} = O.ceCanvas();

const DISKS_NUM = 10;

const GROUND_OFFSET = h / 10;
const ROD_WIDTH = w / 90;
const ROD_HEIGHT = h / 2;
const DISK_WIDTH_UNIT = w / DISKS_NUM / 4;
const DISK_HEIGHT = h / 40;

const SIMULATION_SPEED_BASE = .5;

const hGround = h - GROUND_OFFSET;
const hFloat = (hGround - ROD_HEIGHT) / 2;

const cols = {
  bg: '#fff',
  ground: '#ccc',
  rod: '#222',
  disk: '#f80',
};

const main = () => {
  O.ael('keydown', evt => {
    switch(evt.code){
      case 'Enter': case 'Space':
        if(simulation.active || simulation.done) simulation.reset();
        else simulation.solveAndStart();
        break;
    }
  });

  render();
};

const render = () => {
  simulation.render();
  O.raf(render);
};

class Simulation{
  #speed = SIMULATION_SPEED_BASE;

  transitions = [];
  transitionIndex = 0;
  time = null;
  done = 0;

  constructor(disksNum){
    this.disksNum = disksNum;
    this.rods = this.getInitialRods();
    this.rodsTr = this.getInitialRods();
  }

  getInitialRods(){
    const {disksNum} = this;

    return O.ca(3, i => {
      if(i !== 0) return [];
      return O.ca(disksNum, j => disksNum - j);
    });;
  }

  get active(){ return this.time !== null; }

  get speed(){
    return this.#speed / SIMULATION_SPEED_BASE;
  }

  set speed(speed){
    O.assert(!this.active);
    this.#speed = speed * SIMULATION_SPEED_BASE;
  }

  start(){
    O.assert(!this.active);
    O.assert(!this.done);

    this.time = O.now;
  }

  stop(){
    this.time = null;
  }

  reset(){
    this.transitions.length = 0;
    this.transitionIndex = 0;
    this.rods = this.getInitialRods();
    this.rodsTr = this.getInitialRods();
    this.time = null;
    this.done = 0;
  }

  solve(){
    O.assert(!this.active);
    O.assert(!this.done);

    const stack = [[0, 1, this.disksNum]];

    while(stack.length !== 0){
      const elem = stack.pop();
      const [from, to, num] = elem;
      if(num === 0) continue;

      if(num === 1){
        this.addTransition(from, to);
        continue;
      }

      const free = (
        from === 0 ? to === 1 ? 2 : 1 :
        from === 1 ? to === 0 ? 2 : 0 :
        to === 0 ? 1 : 0
      );

      stack.push(
        [free, to, num - 1],
        [from, to, 1],
        [from, free, num - 1],
      );
    }
  }

  solveAndStart(){
    this.solve();
    this.start();
  }

  addTransition(from, to){
    const rods = this.rodsTr;
    const trs = this.transitions;

    const tr = new Transition(
      from,
      to,
      trs.length !== 0 ? O.last(trs).end : 0,
      (
        ((hGround - (rods[from].length - .5) * DISK_HEIGHT) - hFloat) +
        (w / 3 * abs(from - to)) +
        ((hGround - (rods[to].length + .5) * DISK_HEIGHT) - hFloat)
      )
    );

    this.transitions.push(tr);

    O.assert(rods[from].length !== 0);
    rods[to].push(rods[from].pop());
  }

  render(){
    const {rods, transitions} = this;
    const speed = this.#speed;

    let tr = null;
    let curX = null;
    let curY = null;

    if(this.time !== null){
      const t = O.now;
      const dt = (t - this.time) * speed;

      while(this.transitionIndex !== transitions.length && transitions[this.transitionIndex].end < dt){
        const tr = transitions[this.transitionIndex++];

        O.assert(rods[tr.from].length !== 0);
        rods[tr.to].push(rods[tr.from].pop());
      }

      if(this.transitionIndex !== transitions.length){
        tr = this.transitions[this.transitionIndex];

        const {from, to} = tr;
        const rod1 = rods[from];
        const rod2 = rods[to];
        O.assert(rod1.length !== 0);

        let x = w / 3 * (from + .5);
        let y = hGround - (rod1.length - .5) * DISK_HEIGHT;

        const path = [
          x, y,
          x, y = hFloat,
          x = w / 3 * (to + .5), y,
          x, y = hGround - (rod2.length + .5) * DISK_HEIGHT,
        ];

        const dists = [];
        let pathLen = 0;

        for(let i = 2; i !== path.length; i += 2){
          const dist = O.dist(path[i - 2], path[i - 1], path[i], path[i + 1]);
          pathLen += dist;
          dists.push(dist);
        }

        const k = (dt - tr.start) / tr.duration;
        const curPathPos = pathLen * k;

        let pos = 0;

        for(let i = 0; i !== dists.length; i++){
          const dist = dists[i];

          if(pos + dist > curPathPos){
            const j = i << 1;
            const x1 = path[j];
            const y1 = path[j + 1];
            const x2 = path[j + 2];
            const y2 = path[j + 3];

            const k = (curPathPos - pos) / dist;
            const k1 = 1 - k;

            curX = x1 * k1 + x2 * k;
            curY = y1 * k1 + y2 * k;

            break;
          }

          pos += dist;
        }
      }else{
        this.stop();
        this.done = 1;
      }
    }

    g.fillStyle = cols.bg;
    g.fillRect(0, 0, w, h);

    g.fillStyle = cols.ground;
    g.fillRect(0, hGround, w, GROUND_OFFSET);
    g.beginPath();
    g.moveTo(0, hGround);
    g.lineTo(w, hGround);
    g.stroke();

    for(let i = 0; i !== 3; i++){
      const rod = rods[i];
      const xBase = w / 3 * (i + .5);

      g.fillStyle = cols.rod;
      g.beginPath();
      g.rect(
        xBase - ROD_WIDTH / 2,
        hGround - ROD_HEIGHT,
        ROD_WIDTH,
        ROD_HEIGHT
      );
      g.fill();
      g.stroke();

      const staticRodsNum = tr !== null && i === tr.from ?
        rod.length - 1 : rod.length;

      g.fillStyle = cols.disk;
      for(let j = 0; j !== staticRodsNum; j++){
        const diskWidth = DISK_WIDTH_UNIT * rod[j];

        g.beginPath();
        g.rect(
          xBase - diskWidth / 2,
          hGround - DISK_HEIGHT * (j + 1),
          diskWidth,
          DISK_HEIGHT,
        );
        g.fill();
        g.stroke();
      }
    }

    if(tr !== null){
      const diskWidth = DISK_WIDTH_UNIT * O.last(rods[tr.from]);

      g.beginPath();
      g.rect(
        curX - diskWidth / 2,
        curY - DISK_HEIGHT / 2,
        diskWidth,
        DISK_HEIGHT,
      );
      g.fill();
      g.stroke();
    }
  }
}

class Transition{
  constructor(from, to, start, duration){
    this.from = from;
    this.to = to;

    O.assert(duration > 0);
    this.start = start;
    this.end = start + duration;
    this.duration = duration;
  }
}

const simulation = new Simulation(DISKS_NUM);

main();