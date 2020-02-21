'use strict';

const TIME_INCREMENT = 5;

var format = 'mp4';
var videoName = getVideoName();
var videoFile = `/projects/${O.project}/${videoName}.${format}`;

var fs = O.urlParam('fs') === '1';

var video = null;
var source = null;
var loaded = false;
var playing = false;

window.setTimeout(main);

function main(){
  aels();

  O.body.style.margin = '0px';
  O.body.style.backgroundColor = 'black';
  O.body.style.overflow = 'hidden';

  video = O.ce(O.body, 'video');
  video.style.position = 'absolute';
  video.style.top = '50%';
  video.style.left = '50%';
  video.style.transform = 'translate(-50%, -50%)';
  video.loop = false;

  if(fs){
    video.style.width = '100%';
    video.style.height = '100%';
  }

  O.ael(video, 'canplay', () => {
    loaded = true;
  });
  
  source = O.ce(video, 'source');
  source.src = O.urlTime(videoFile);
}

function aels(){
  O.ael('keydown', evt => {
    if(!loaded) return;

    switch(evt.code){
      case 'Space':
        if(playing) video.pause();
        else video.play();
        playing = !playing;
        break;

      case 'ArrowLeft':
        video.currentTime -= TIME_INCREMENT;
        break;

      case 'ArrowRight':
        video.currentTime += TIME_INCREMENT;
        break;

      case 'F5':
        evt.preventDefault();
        if(playing) video.pause();
        loaded = false;
        playing = false;
        source.src = O.urlTime(videoFile);
        video.load();
        break;
    }
  });
}

function getVideoName(){
  var name = O.urlParam('name');
  if(name === null)
    return '1';

  return name;
}