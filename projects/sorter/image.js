'use strict';

const {min, max} = Math;

const VisualSortable = require('./visual-sortable');

const OFFSET = 20;
const BG_COL = new O.Color(14, 14, 14);

class Image extends VisualSortable{
  constructor(sorter, img, label){
    super(sorter);

    this.img = img;
    this.label = label;
  }

  cmp(other){
    return new Promise(res => {
      const {sorter, g} = this;
      const {canvas} = g;

      const imgs = [this.img, other.img];
      if(O.rand(2)) imgs.reverse();

      let finished = 0;
      let clicked = 0;
      let selected = null;

      const wrap = func => {
        return evt => {
          if(finished) return;
          func(evt);
        };
      };

      const render = wrap(() => {
        const {iw, ih} = O;
        const iwh = iw / 2;

        g.fillStyle = BG_COL;
        g.fillRect(0, 0, iw, ih);

        for(let i = 0; i !== 2; i++){
          const img = imgs[i];
          const w = img.width;
          const h = img.height;

          const wmax = iwh - OFFSET * 2;
          const hmax = ih - OFFSET * 2;

          const k1 = wmax / w;
          const k2 = hmax / h;
          const k = min(k1, k2, 1);

          g.translate(
            iwh * i + OFFSET + wmax / 2,
            OFFSET + hmax / 2,
          );
          g.scale(k, k);
          g.drawImage(img, -w / 2, -h / 2);
          g.resetTransform();

          if(i === selected){
            g.globalAlpha = .25;
            g.fillStyle = 'black';
            g.fillRect(iwh * i, 0, iwh, ih);
            g.globalAlpha = 1;
          }
        }
      });

      const inside = (w, h, x, y) => {
        return x >= 0 && y >= 0 && x < w && y < h;
      };

      const updateCursor = evt => {
        if(!clicked) return;

        const {iw, ih} = O;
        const x = evt.clientX;
        const y = evt.clientY;

        if(!inside(iw, ih, x, y)){
          selected = null;
          return;
        }

        selected = x < iw / 2 ? 0 : 1;
      };

      const onMouseDown = wrap(evt => {
        clicked = 1;
        updateCursor(evt);
      });

      const onMouseMove = wrap(evt => {
        updateCursor(evt);
      });

      const onMouseUp = wrap(evt => {
        clicked = 0;
        updateCursor(evt);

        if(selected !== null)
          finish(imgs[selected] === this.img ? -1 : 1);
      });

      const onBlur = wrap(() => {
        clicked = 0;
        selected = null;
      });

      const aels = () => {
        sorter.renderFunc = render;

        O.ael('mousedown', onMouseDown);
        O.ael('mousemove', onMouseMove);
        O.ael('mouseup', onMouseUp);
        O.ael('blur', onBlur);
      };

      const rels = () => {
        sorter.renderFunc = null;

        O.rel('mousedown', onMouseDown);
        O.rel('mousemove', onMouseMove);
        O.rel('mouseup', onMouseUp);
        O.rel('blur', onBlur);
      };

      const finish = result => {
        O.assert(!finished);
        finished = 1;

        rels();
        res(result);
      };

      aels();
      render();
    });
  }
}

module.exports = Image;