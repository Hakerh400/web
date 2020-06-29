'use strict';

const {sin, cos} = Math;
const {pi, pih, pi2} = O;

const pi3 = pi / 3;
const pi6 = pi / 6;
const pi11 = pi * 1.1;

const gemsNum = 6;

const cols = formatCols({
  bg:   [169, 169, 169],
  tile: [255, 255, 255],

  gems: [
    [30, 131, 242],
    [90, 244, 38],
    [228, 247, 4],
    [255, 48, 33],
    [230, 104, 240],
    [53, 249, 239],
  ],
});

const gemCols = cols.gems;

const tileSize = O.urlParam('s', 60) | 0;

const {g} = O.ceCanvas(1);

let grid = createGrid();

function main(){
  aels();
  render();
};

function aels(){
  O.ael('resize', evt => {
    g.resize(O.iw, O.ih);
  });
};

function createGrid(){
  const w = 9;
  const h = 9;

  return new O.Grid(w, h, (x, y) => {
    return {
      gemType: O.rand(gemsNum),
    };
  });
};

function render(){
  const {w, h} = grid;

  g.clearCanvas(cols.bg);

  g.resetTransform();
  g.translate((g.w - w * tileSize) / 2, (g.h - h * tileSize) / 2);
  g.scale(tileSize);

  grid.iter((x, y, d) => {
    g.fillStyle = cols.tile;
    g.fillRect(x, y, 1, 1);

    const {gemType} = d;
    g.fillStyle = cols.gems[gemType];

    switch(gemType){
      case 0: {
        g.beginPath();
        g.moveTo(x + 0.5, y + 0.14);
        g.lineTo(x + 0.7, y + 0.38);
        g.lineTo(x + 0.5, y + 0.86);
        g.lineTo(x + 0.3, y + 0.38);
        g.closePath();
        g.stroke();
        g.fill();

        g.beginPath();
        g.moveTo(x + 0.5, y + 0.14);
        g.lineTo(x + 0.38, y + 0.44);
        g.lineTo(x + 0.5, y + 0.86);
        g.moveTo(x + 0.5, y + 0.14);
        g.lineTo(x + 0.62, y + 0.44);
        g.lineTo(x + 0.5, y + 0.86);
        g.moveTo(x + 0.3, y + 0.38);
        g.lineTo(x + 0.38, y + 0.44);
        g.lineTo(x + 0.62, y + 0.44);
        g.lineTo(x + 0.7, y + 0.38);
        g.stroke();
      } break;

      case 1: {
        g.beginPath();
        O.drawPolygon(g, x + .5, y + .5, .375, 6, pih);
        g.fill();
        g.stroke();
        g.beginPath();
        O.drawPolygon(g, x + .5, y + .5, .375, 3, pih);
        g.stroke();
      } break;

      case 2: {
        g.beginPath();
        g.moveTo(x + .5, y + .15);
        g.lineTo(x + .2, y + .7);
        g.lineTo(x + .6, y + .8);
        g.lineTo(x + .8, y + .6);
        g.closePath();
        g.fill();
        g.stroke();
        g.beginPath();
        g.moveTo(x + .5, y + .15);
        g.lineTo(x + .6, y + .8);
        g.stroke();
      } break;

      case 3: {
        g.beginPath();
        for(let i = 0; i !== 6; i++){
          const angle = pih + i / 6 * pi2;
          g.lineTo(x + .5 + cos(angle) * .375, y + .5 + sin(angle) * .375);
        }
        g.closePath();
        g.fill();
        g.stroke();
        for(let i = 0; i !== 6; i += 2){
          const angle = pih + i / 6 * pi2;
          g.moveTo(x + .5 + cos(angle) * .375, y + .5 + sin(angle) * .375);
          g.lineTo(x + .5, y + .5);
        }
        g.stroke();
      } break;

      case 4: {
        g.beginPath();
        g.arc(x + .5, y + .5, .3, 0, pi2);
        g.fill();
        g.stroke();
      } break;

      case 5: {
        g.beginPath();
        O.drawPolygon(g, x + .5, y + .5, .375, 5, pi11);
        g.closePath();
        g.fill();
        g.stroke();
      } break;

      default: {
        O.assert.fail(gemType);
      } break;
    }

    g.strokeRect(x, y, 1, 1);
  });

  O.raf(render);
};

function formatCols(cols){
  const colsObj = O.obj();

  for(const colName in cols){
    const col = cols[colName];

    colsObj[colName] = col.length === 3 && !Array.isArray(col[0]) ? `#${
      cols[colName].
        map(a => O.hex(a, 1).toLowerCase()).
        join('')
      }` : formatCols(col);
  }

  return colsObj;
};

main();