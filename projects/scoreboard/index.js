'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const electron = require('electron');
const modal = require('../modal');

const defaultSize = 10;

const cwd = __dirname;
await O.addStyle(path.join(cwd, 'style.css'), 0);

class Scoreboard{
  constructor(project=O.project, size=defaultSize){
    this.project = project;
    this.scoreboardSize = size;

    this.scoreTable = [];

    this.newScoreboard = null;
    this.newScoreIndex = null;
    this.newScoreEntry = null;

    this.isOpen = 0;
    this.cb = null;

    this.init();
    this.aels();
  }

  init(){
    this.initModalDiv();
  }

  initModalDiv(){
    const {scoreboardSize, scoreTable} = this;
    const {div} = modal;

    const table = O.ce(div, 'table');
    table.classList.add('scoreboard');
    table.cellSpacing = 0;

    const mkCell = (parent, str='', isHeader=0) => {
      const tag = isHeader ? 'th' : 'td';
      const cell = O.ce(parent, tag);
      cell.innerText = str;

      if(!isHeader)
        O.last(scoreTable).push(cell);

      return cell;
    };

    const mkCells = (parent, strs, isHeader=0) => {
      if(!isHeader)
        scoreTable.push([]);

      for(let i = 0; i !== strs.length; i++){
        const str = strs[i];
        const cell = mkCell(parent, str, isHeader);

        if(i === 1)
          cell.classList.add('name-cell');
      }
    };

    const thead = O.ce(table, 'thead');

    const tr = O.ce(thead, 'tr');
    mkCells(tr, ['#', 'Name', 'Points'], 1);

    // tr.children[1].classList.add('name-col');

    const tbody = O.ce(table, 'tbody');

    for(let i = 0; i !== scoreboardSize; i++){
      const tr = O.ce(tbody, 'tr');
      mkCells(tr, [i + 1, '', 0]);
    }
  }

  aels(){
    O.ael('keydown', evt => {
      const {ctrlKey, shiftKey, altKey, code} = evt;
      const flags = (ctrlKey << 2) | (shiftKey << 1) | altKey;

      if(flags === 0){
        if(this.isOpen){
          if(code === 'Escape' || code === 'Enter' || code === 'NumpadEnter'){
            O.pd(evt);
            this.close();

            return;
          }

          return;
        }

        return;
      }
    });

    O.ael('mousedown', evt => {
      if(this.isOpen) O.pd(evt);
    });

    O.ael('mouseup', evt => {
      if(this.isOpen) O.pd(evt);
    });

    O.ael('mousemove', evt => {
      if(this.isOpen) O.pd(evt);
    });

    O.ael('contextmenu', evt => {
      if(this.isOpen) O.pd(evt);
    });

    if(electron !== null){
      const {ipcRenderer} = electron;

      ipcRenderer.on('scoreboard', (evt, arg) => {
        if(arg === 'clear'){
          this.clear();
          alert('The scoreboard has been cleared');

          return;
        }

        log('UNKNOWN ' + arg);
      });
    }
  }

  open(points, cb=null){
    assert(!this.isOpen);

    const {scoreboardSize, scoreTable} = this;
    const scoreboard = this.loadScoreboard();

    modal.open();

    this.isOpen = 1;
    this.cb = cb;

    const index = O.bisect(i => {
      if(i >= scoreboardSize) return 1;
      return points > scoreboard[i][1];
    });

    const updateScoreTable = () => {
      for(let i = 0; i !== scoreboardSize; i++){
        const [name, points] = scoreboard[i];
        const row = scoreTable[i];

        row[1].innerText = name;
        row[2].innerText = points;
      }
    };

    if(index === scoreboardSize)
      return updateScoreTable();

    scoreboard.splice(index, 0, ['', points]);
    scoreboard.length = scoreboardSize;

    const row = scoreTable[index];
    const cell = row[1];

    cell.contentEditable = 'true';
    cell.focus();

    this.scoreboard = scoreboard;
    this.newScoreboard = scoreboard;
    this.newScoreIndex = index;
    this.newScoreEntry = cell;

    updateScoreTable();
    this.saveScoreboard(scoreboard);
  }

  close(){
    assert(this.isOpen);

    const {newScoreboard, cb} = this;

    if(newScoreboard !== null){
      const {newScoreEntry, newScoreIndex} = this;
      const name = newScoreEntry.innerText.trim().slice(0, 100);

      newScoreEntry.contentEditable = 'false';
      newScoreboard[newScoreIndex][0] = name;
      this.saveScoreboard(newScoreboard);

      this.newScoreboard = null;
      this.newScoreIndex = null;
      this.newScoreEntry = null;
    }

    modal.close();

    this.isOpen = 0;
    this.cb = null;

    if(cb !== null)
      cb();
  }

  clear(){
    const {project} = this;

    delete localStorage[project];
    this.newScoreboard = null;
  }

  initScoreboard(){
    const {scoreboardSize} = this;
    return O.ca(scoreboardSize, () => ['', 0]);
  }

  loadScoreboard(){
    const {project} = this;

    if(!O.has(localStorage, project)){
      const scoreboard = this.initScoreboard();
      this.saveScoreboard(scoreboard);

      return scoreboard;
    }

    return JSON.parse(localStorage[project]);
  }

  saveScoreboard(scoreboard){
    const {project} = this;
    localStorage[project] = JSON.stringify(scoreboard);
  }
}

module.exports = Scoreboard;