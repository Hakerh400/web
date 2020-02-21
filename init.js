(function(){
  'use strict';

  var CHROME_ONLY = 1;
  var OMIKRON_URL = 'https://raw.githubusercontent.com/Hakerh400/omikron/master/src/omikron/omikron.js';

  window.addEventListener('load', function(){
    var O = {
      doc: document,
      body: document.body,

      init: function(){
        var noscript = document.querySelector('noscript');

        if(CHROME_ONLY && window.navigator.vendor != 'Google Inc.'){
          var html = noscript.innerHTML.split(/\r\n|\r|\n/);
          html = html.map(function(a){ return a.trim(); });
          html = html.filter(function(a){ return a.length; });
          var msg = html[html.length - 1];
          O.fatalError(msg);
          return;
        }

        noscript.remove();

        O.rf(OMIKRON_URL, function(status, script){
          if(status != 200) return O.fatalError('Cannot load framework script. Try disabling extensions.');
          new Function(script)();
        });
      },

      fatalError: function(msg){
        var h1 = O.doc.createElement('h1');
        var t = O.doc.createTextNode('Fatal Error');
        O.body.appendChild(h1);
        h1.appendChild(t);
        t = O.doc.createTextNode(msg);
        O.body.appendChild(t);
      },

      urlTime: function(url){
        var char = url.indexOf('?') != -1 ? '&' : '?';
        return '' + url + char + '_=' + Date.now();
      },

      rf: function(file, cb){
        var xhr = new window.XMLHttpRequest();
        xhr.onreadystatechange = function(){
          if(xhr.readyState == 4){
            cb(xhr.status, xhr.responseText);
          }
        };
        xhr.open('GET', O.urlTime(file));
        xhr.send();
      }
    };

    O.init();
  });
})()