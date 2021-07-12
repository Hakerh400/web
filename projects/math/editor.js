'use strict';

const assert = require('assert');
const specialChars = require('./special-chars');
const util = require('./util');
const su = require('./str-util');

const {min, max} = Math;

class Editor{
  selected = 0;
  editable = 1;

  lines = [];
  cx = 0;
  cy = 0;
  cxPrev = 0;
  updatedLine = null;
  scrollY = 0;

  markedLine = null;

  render(g, w, h){
    const {lines, scrollY, markedLine} = this;
    const linesNum = lines.length;

    for(let y = 0; y !== h; y++){
      const lineIndex = scrollY + y;
      if(lineIndex >= linesNum) break;

      const line = lines[lineIndex];
      const lineLen = line.length;

      if(markedLine !== null){
        const [my, mCol] = markedLine;

        if(y === my){
          g.fillStyle = mCol;
          g.fillRect(0, y, w, 1);
        }
      }

      for(let x = 0; x !== w; x++){
        if(x >= lineLen) break;

        g.fillStyle = 'black';
        g.fillText(line[x], x + .5, y + .5);
      }
    }

    if(this.selected)
      this.drawCursor(g);
  }

  drawCursor(g){
    const {cx, cy, scrollY} = this;
    const y = cy - scrollY;

    g.beginPath();
    g.moveTo(cx, y);
    g.lineTo(cx, y + 1);
    g.stroke();
  }

  scrollUp(){
    if(this.scrollY === 0) return;
    this.scrollY--;
  }

  scrollDown(){
    this.scrollY++;
  }

  processKey(key){
    if(!this.selected) return;
    if(!this.editable) return;

    const {cx, cxPrev} = this;
    let {cy} = this;

    const line = this.getLine(cy);
    const lineLen = line.length;

    const tSize = su.getTabSize(line);
    const tStr = su.getTabStr(line);

    const p1 = line.slice(0, cx);
    const p2 = line.slice(cx);

    const processKey = () => {
      if(key === 'Enter'){
        this.setLine(cy, p1);

        if(cx !== 0){
          const char = p1.slice(-1);
          const pt = su.getOpenParenType(char);

          if(pt !== null && p2.startsWith(su.closedParenChars[pt])){
            this.insertLines(++cy, tStr + su.tabStr, tStr + p2);
            this.setCx(tSize + su.tabSize);
            return;
          }
        }

        this.insertLine(++cy, tStr + p2);
        this.setCx(tSize);
        return;
      }

      if(key === 'Backspace'){
        if(cx === 0){
          if(cy === 0){
            // this.setCx();
            return;
          }

          this.removeLine(cy);
          this.setCx(this.getLineLen(--cy));
          this.appendLine(cy, line);
          return;
        }

        const c1 = line[cx - 1];
        const c2 = cx !== lineLen ? line[cx] : null;

        const pt = su.getOpenParenType(c1);
        const isOpenParen = pt !== null && p2.startsWith(su.closedParenChars[pt]);
        const isStrDelim = su.isStrDelim(c1) && c1 === c2;

        const p2New = isOpenParen || isStrDelim ? p2.slice(1) : p2;

        this.decCx();
        this.setLine(cy, p1.slice(0, -1) + p2New);
        return;
      }

      if(key === 'Delete'){
        if(cx === lineLen){
          this.appendLine(cy, this.removeLine(cy + 1));
          return;
        }

        this.setLine(cy, p1 + p2.slice(1));
        return;
      }

      if(key === 'Home'){
        this.setCx(cx !== tSize ? tSize : 0);
        return;
      }

      if(key === 'End'){
        this.setCx(lineLen);
        return;
      }

      if(key === 'Tab'){
        this.setLine(cy, p1 + su.tabStr + p2);
        this.setCx(cx + su.tabSize);
        return;
      }

      if(key === 'Duplicate'){
        this.insertLine(++cy, line);
        this.setCx();
        return;
      }

      if(key.startsWith('Move')){
        const dir = key.slice(4) === 'Up' ? 0 : 2;

        if(dir === 0){
          if(cy === 0){
            // this.setCx();
            return;
          }

          this.swapLines(cy, --cy);
          // this.setCx();
          return;
        }

        this.swapLines(cy, ++cy);
        // this.setCx();
        return;
      }

      if(key.startsWith('Arrow')){
        const dir = ['Up', 'Right', 'Down', 'Left'].indexOf(key.slice(5));
        if(dir === -1) return;

        if(dir & 1){
          if(dir === 3){
            if(cx === 0){
              if(cy === 0){
                this.setCx(0);
                return;
              }

              this.setCx(this.getLineLen(--cy));
              return;
            }

            this.decCx();
            return;
          }

          if(cx === lineLen){
            ++cy;
            this.setCx(0);
            return;
          }

          this.incCx();
          return;
        }

        if(dir === 0){
          if(cy === 0) return;

          this.cx = min(this.getLineLen(--cy), cxPrev);
          return;
        }

        this.cx = min(this.getLineLen(++cy), cxPrev);
        return;
      }

      if(key.length !== 1){
        // log(key);
        return;
      }

      const char = key;
      let str = char;

      setStr: {
        if(su.isStrDelim(char)){
          str = char + char;
          break setStr;
        }

        const openParenType = su.getOpenParenType(char);

        if(openParenType !== null){
          const nextChar = cx !== lineLen ? p2[0] : null;

          if(nextChar === null || su.isClosedParen(nextChar) || nextChar === ' ')
            str = char + su.closedParenChars[openParenType];

          break setStr;
        }

        if(su.isClosedParen(char)){
          if(p2.startsWith(char)) str = '';
          break setStr;
        }

        const p1New = p1 + char;

        for(const [code, su] of specialChars){
          if(!p1New.endsWith(code)) continue;

          const codeLen = code.length;
          this.setLine(cy, p1.slice(0, 1 - codeLen) + su + p2);
          this.setCx(cx - codeLen + su.length + 1);
          return;
        }
      }

      this.setLine(cy, p1 + str + p2);
      this.incCx();
    };

    processKey();
    this.cy = cy;
  }

  setCx(cxNew=cx){
    this.cx = cxNew;
    this.cxPrev = cxNew;
  }

  incCx(){
    this.setCx(this.cx + 1);
  }

  decCx(){
    this.setCx(this.cx - 1);
  }

  setText(str){
    if(this.locked) return;
    this.lines = O.sanl(str);
  }

  appendLine(index, str){
    this.setLine(index, this.getLine(index) + str);
  }

  swapLines(index1, index2){
    const line1 = this.getLine(index1);
    const line2 = this.getLine(index2);

    this.setLine(index1, line2);
    this.setLine(index2, line1);
  }

  getLineLen(index){
    return this.getLine(index).length;
  }

  getLine(index){
    const {lines} = this;

    if(index >= lines.length)
      return '';

    return lines[index];
  }

  setLine(index, str){
    if(this.locked) return;

    const {lines} = this;
    assert(util.isStr(str));

    if(lines.length <= index && str.length === 0)
      return;

    this.expandLines(index);

    if(str === lines[index]) return;

    lines[index] = str;
    this.updateLine(index);
  }

  insertLine(index, line){
    this.insertLines(index, line);
  }

  removeLine(index){
    return this.removeLines(index)[0];
  }

  insertLines(index, ...xs){
    if(this.locked) return;

    this.expandLines(index);
    this.updateLine(index);
    this.lines.splice(index, 0, ...xs);
  }

  removeLines(index=0, num=1){
    if(this.locked) return;

    const {lines} = this;

    this.expandLines(index);
    this.updateLine(index);

    assert(index + num <= lines.length);

    return lines.splice(index, num);
  }

  spliceLines(index=0, num=this.lines.length - num){
    return this.removeLines(index, num);
  }

  expandLines(index){
    const {lines} = this;

    while(lines.length <= index)
      lines.push('');
  }

  updateLine(index){
    const {updatedLine} = this;

    if(updatedLine === null || index < updatedLine)
      this.updatedLine = index;
  }
}

module.exports = Editor;