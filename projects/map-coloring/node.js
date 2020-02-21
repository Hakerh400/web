'use strict';

class Node{
  col = null;
  ptrsSet = new Set();
  ptrsArr = null;

  constructor(xStart, yStart){
    this.xStart = xStart;
    this.yStart = yStart;
  }

  connect(node){
    this.ptrsSet.add(node);
    node.ptrsSet.add(this);
  }

  resolvePtrs(){
    this.ptrsArr = [...this.ptrsSet];
    this.ptrsSet = null;
  }

  getAvailCol(start=0, checkAdj=1){
    const ptrs = this.ptrsArr
    const colPrev = this.col;

    let col = start;

    loop: while(1){
      if(col === 4) return null;

      let c0 = col <= 0;
      let c1 = col <= 1;
      let c2 = col <= 2;
      let c3 = col <= 3;

      for(const ptr of ptrs){
        const {col} = ptr;
        if(col === null) continue;

        if(col === 0) c0 = 0;
        else if(col === 1) c1 = 0;
        else if(col === 2) c2 = 0;
        else c3 = 0;
      }

      if(c0) col = 0;
      else if(c1) col = 1;
      else if(c2) col = 2;
      else if(c3) col = 3;
      else return null;

      if(!checkAdj) return col;

      this.col = col;

      for(const ptr of ptrs){
        if(ptr.getAvailCol(0, 0) === null){
          this.col = colPrev;
          col++;
          continue loop;
        }
      }

      return col;
    }
  }

  getNextCol(){
    const {col} = this;
    return this.getAvailCol(col !== null ? col + 1 : 0);
  }

  updateNextCol(){
    return this.col = this.getNextCol();
  }
}

module.exports = Node;