'use strict';

const assert = require('assert');
const modals = require('./modals');

await O.addStyle('modal.css');

const mainDiv = O.ce(O.body, 'div', 'top main fade-in-out');
const modalDiv = O.ce(O.body, 'div', 'top modal-outer fade-in-out');

const main = () => {
  modalDiv.innerText = 'abc';
  const dom = new DOM(mainDiv, modalDiv);

  O.ael('mousedown', () => {
    dom.openModal();
  });
};

class DOM{
  constructor(main, modal, init=1){
    this.main = main;
    this.modal = modal;

    this.navbar = null;
    this.pageContent = null;
    this.modalInner = null;

    this.loading = 0;
    this.modalOpen = 0;
    this.modalCb = null;

    if(init) this.init();
  }

  init(){
    this.modalInner = new modals.ModalInner(this.modal);
    this.aels();
  }

  aels(){
    O.ael('keydown', this.onModalKeydown.bind(this));
  }

  openModal(cb=O.nop){
    if(this.modalOpen) return;

    const {main, modal, modalInner: inner} = this;

    main.style.pointerEvents = 'none';
    modal.style.opacity = '1';
    modal.style.pointerEvents = 'all';
    inner.style.top = '50%';

    modal.focus();

    this.modalOpen = 1;
    this.modalCb = cb;
  }

  closeModal(cb=null){
    if(!this.modalOpen) return;

    const {main, modal, modalInner: inner} = this;

    inner.style.top = '0%';
    modal.style.opacity = '0';
    modal.style.pointerEvents = 'none';
    main.style.pointerEvents = 'all';

    this.modalCb.call(null);
    this.modalCb = null;
    this.modalOpen = 0;

    if(cb !== null)
      setTimeout(cb.bind(null, null), MODAL_TRANSITION_DURATION);
  }

  onModalKeydown(evt){
    if(!this.modalOpen) return;

    switch(evt.code){
      case 'Escape':
        this.closeModal();
        break;
    }
  }
}

main();