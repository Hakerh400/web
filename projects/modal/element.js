'use strict';

/*
  Element is an abstract class. It represents base class
  for element wrappers. All classes that represent HTML
  elements should be extended from this class.
*/

class Element extends O.EventEmitter{
  constructor(parent=null){
    super();

    let parentElem;

    if(parent instanceof Element){
      parentElem = parent.elem;
    }else{
      parentElem = parent;
      parent = null;
    }

    this.parent = parent;
    this.parentElem = parentElem;

    if(parentElem === null)
      this.elem = null;
    else
      this.elem = O.ce(this.parentElem, this.getTag(), this.getCss());
  }

  // Add event listener wrapper
  ael(type, func){
    O.ael(this.elem, type, evt => {
      O.pd(evt);
      func(evt);
    });
  }

  purge(){
    for(const child of this.children)
      child.remove();

    return this;
  }

  reset(){ return this.purge(); }
  clear(){ return this.purge(); }

  get children(){ return Array.from(this.elem.children); }
  get style(){ return this.elem.style; }
  get val(){ return this.elem.textContent; }
  set val(val){ this.elem.textContent = val; }

  remove(){ return this.parent.removeChild(this.elem); }
  removeChild(child){ return this.elem.removeChild(child); }
  focus(){ return this.elem.focus(); }
  br(num){ return O.ceBr(this.elem, num); }
  getTag(){ return this.tag(); }

  getCss(){
    const set = new Set();
    O.proto(this).getCssRec(set);
    return Array.from(set).join(' ');
  }

  getCssRec(set){
    if(this.css === Element.prototype.css) return;

    set.add(this.css());
    O.proto(this).getCssRec(set);
  }

  tag(){ O.virtual('tag'); } // Tag name
  css(){ O.virtual('css'); } // CSS style
}

class Div extends Element{
  tag(){ return 'div'; }
}

class Left extends Div{
  css(){ return 'left'; }
}

class Right extends Div{
  css(){ return 'right'; }
}

class Text extends Element{
  constructor(parent, text=''){
    super(parent);
    this.val = text;
  }

  css(){ return 'text'; }
}

class Span extends Text{
  tag(){ return 'span'; }
}

class Input extends Element{
  constructor(parent, name=null, placeholder=null){
    super(parent);

    this.name = name;
    this.placeholder = placeholder;

    if(name !== null) this.elem.name = name;
    if(placeholder !== null) this.elem.placeholder = placeholder;
  }

  get val(){ return this.elem.value; }
  set val(val){ this.elem.value = val; }

  tag(){ return 'input'; }
  css(){ return 'input'; }
}

class InputText extends Input{
  constructor(parent, name, placeholder){
    super(parent, name, placeholder);
    this.elem.type = 'text';
  }
}

class InputPass extends Input{
  constructor(parent, name, placeholder){
    super(parent, name, placeholder);
    this.elem.type = 'password';
  }
}

class InputTextarea extends Input{
  constructor(parent, name, placeholder, val=''){
    super(parent, name, placeholder);
    this.val = val;
  }

  tag(){ return 'textarea'; }
  css(){ return 'textarea'; }
}

class InputDropdown extends Input{
  constructor(parent, name, opts=[], selected=null){
    super(parent, name);

    for(const [label, desc] of opts)
      this.addOpt(label, desc, label === selected);
  }

  addOpt(label, desc, selected=0){
    const opt = O.ce(this.elem, 'option');
    opt.value = label;
    O.ceText(opt, desc);
    if(selected) opt.selected = '1';
  }

  tag(){ return 'select'; }
  css(){ return 'dropdown'; }
}

class InputFile extends Input{
  constructor(parent, name){
    super(parent, name);
    this.elem.type = 'file';
  }

  css(){ return 'input-file'; }
}

class Link extends Text{
  constructor(parent, text, url='javascript:void(0)'){
    super(parent, text);
    this.elem.href = url;
  }

  tag(){ return 'a'; }
}

class Heading extends Text{
  constructor(parent, text, size=1){
    Heading[O.static] = size;
    super(parent, text);
    this.headingSize = size;
  }

  tag(){
    const size = O.has(this, 'headingSize') ? this.headingSize : Heading[O.static];
    return `h${size}`;
  }

  css(){ return 'heading'; }
}

class Title extends Heading{
  css(){ return 'title'; }
}

class Rectangle extends Div{
  css(){ return 'rect'; }
}

class Region extends Rectangle{
  css(){ return 'region'; }
}

class Button extends Span{
  constructor(parent, text){
    super(parent, text);
    this.aels();
  }

  aels(){
    this.ael('click', evt => {
      this.emit('click', evt);
    });
  }

  css(){ return 'btn'; }
}

class Image extends Element{
  constructor(parent, src){
    super(parent);
    this.elem.src = src;
  }

  get src(){ return this.elem.src; }
  set src(val){ this.elem.src = val; }

  tag(){ return 'img'; }
}

module.exports = Object.assign(Element, {
  Div,
  Left,
  Right,
  Text,
  Span,
  Input,
  InputText,
  InputPass,
  InputTextarea,
  InputDropdown,
  InputFile,
  Link,
  Heading,
  Title,
  Rectangle,
  Region,
  Button,
  Image,
});