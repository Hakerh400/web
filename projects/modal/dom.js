'use strict';

const modals = require('./modals');

const MODAL_TRANSITION_DURATION = 500;

class DOM{
  constructor(modal){
    this.main = O.body;
    this.modal = modal;

    this.navbar = null;
    this.pageContent = null;
    this.modalInner = null;

    this.loading = 0;
    this.modalOpen = 0;
    this.modalCb = null;

    this.modalInner = new modals.ModalInner(modal);
  }

  openModal(cb=null){
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

    if(this.modalCb !== null){
      this.modalCb.call(null);
      this.modalCb = null;
    }
    
    this.modalOpen = 0;

    if(cb !== null)
      setTimeout(cb.bind(null, null), MODAL_TRANSITION_DURATION);
  }
}

module.exports = DOM;