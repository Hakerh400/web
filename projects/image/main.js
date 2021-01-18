'use strict';

var format = 'png';
var imageFile = `${O.baseURL}/projects/${O.project}/1.${format}`;

var image = null;
var loaded = 0;

window.setTimeout(main);

function main(){
  O.doc.documentElement.style.cursor = 'none';

  O.body.style.margin = '0px';
  O.body.style.backgroundColor = 'black';
  O.body.style.overflow = 'hidden';

  image = O.ce(O.body, 'img');
  image.style.position = 'absolute';
  image.style.top = '50%';
  image.style.left = '50%';
  image.style.transform = 'translate(-50%, -50%)';
  image.addEventListener('load', () => { loaded = 1; });
  image.src = O.urlTime(imageFile);

  aels();
}

function aels(){
  O.ael('keydown', evt => {
    if(!loaded) return;

    switch(evt.key){
      case 'F5':
        evt.preventDefault();
        loaded = 0;
        image.src = O.urlTime(imageFile);
        break;
    }
  });
}