'use strict';

const fs = require('fs');
const path = require('path');

await O.addStyle('style.css');

const BASE_URL = path.join(O.baseURL, '..');
const BASE_PTH = 'D:';

const INIT_URL = path.join(BASE_URL, 'Videos/Other/Folder');

const sem = new O.Semaphore();

const main = async () => {
  const {body} = O;

  const ael = (target, type, handler) => {
    O.ael(target, type, evt => {
      (async () => {
        await sem.wait();

        try{
          await handler(evt);
        }catch(err){
          if(err instanceof O.RMIError){
            setResult(err.message);
          }else{
            log(err);
            setResult(err.stack || String(err));
          }
        }

        sem.signal();
      })();
    });
  };

  const getAllInputFields = () => {
    return [...O.qsa('input')];
  };

  const next = () => {
    const inputs = getAllInputFields();
    const index = inputs.indexOf(document.activeElement);
    const indexNew = (index + 1) % inputs.length;

    inputs[indexNew].focus();
  };

  const ceInput = (label, onInput=null, onTab=null, onEnter=null) => {
    const inputWrap = O.ceDiv(body, 'input-wrap');
    const labelDiv = O.ceDiv(inputWrap, 'label');
    labelDiv.innerText = `${label}:`;

    const input = O.ce(inputWrap, 'input');

    if(onInput !== null){
      ael(input, 'input', onInput);
      ael(input, 'focus', onInput);
    }

    ael(input, 'keydown', async evt => {
      if(evt.ctrlKey) return;
      if(evt.altKey) return;

      if(evt.code === 'Tab'){
        O.pd(evt);

        if(!evt.shiftKey && onTab !== null)
          return await onTab(evt);

        return next();
      }

      if(evt.code === 'Enter' || evt.code === 'NumpadEnter'){
        if(onEnter !== null)
          return await onEnter(evt);

        return next();
      }
    });

    return input;
  };

  const setFilePth = async pth => {
    pth = pth.replace(/\/$/, '');

    const file = url2pth(pth);

    if(await O.rmi('fs.isDir', file)){
      inputFilePth.value = `${pth}/`;
      await updateFileMatches();
      return;
    }

    const link = O.doc.createElement('a');
    link.href = pth;
    link.target = '_blank';
    link.click();

    inputFilePth.value = pth;

    const tags = await O.rmi('tags.file.getTags', file);

    if(tags !== null)
      setInputTags(tags);

    next();
  };

  const updateFileMatches = async () => {
    const pth = inputFilePth.value;
    const items = await O.rmi('tags.fs.readdir', url2pth(pth));

    setMatches(items);
  };

  const inputFilePth = ceInput('File', updateFileMatches, async evt => {
    const pth = inputFilePth.value;

    if(pth.endsWith('/.')){
      await setFilePth(path.join(pth, '..'));
      return;
    }

    if(matches.length === 0) return;

    const m = matches[0];
    const sep = pth.endsWith('/') ? '.' : '..';

    await setFilePth(path.join(pth, sep, m));
  });

  inputFilePth.value = `${INIT_URL}/`;
  inputFilePth.focus();

  ael(inputFilePth, 'blur', async evt => {
    setLinks();
  });

  const getInputTags = (includeEmpty=1) => {
    let tags = inputTags.value.trim().split(/\s*,\s*/);

    if(!includeEmpty)
      tags = tags.filter(a => a);

    return tags;
  };

  const setInputTags = tags => {
    inputTags.value = [...tags, ''].join(', ');
  };

  const updateTagList = async () => {
    const tags = getInputTags();
    const substr = O.last(tags);

    if(substr === ''){
      let links = await O.rmi('tags.file.search', tags.slice(0, tags.length - 1));

      links = links.map(link => pth2url(link));

      setMatches([]);
      setLinks(links);
    }else{
      const matches = await O.rmi('tags.tag.search', substr);

      setMatches(matches);
      setLinks();
    }
  };

  const inputTags = ceInput('Tags', updateTagList, async evt => {
    const tags = getInputTags();

    if(matches.length !== 0)
      O.setLast(tags, matches[0]);

    setInputTags(tags);
    await updateTagList();
  }, async evt => {
    const tags = getInputTags(0);
    const file = url2pth(inputFilePth.value);

    await O.rmi('tags.file.setTags', file, tags);
  });

  const ceBtn = (label, handler) => {
    const btn = O.ce(body, 'button');

    btn.innerText = label;

    ael(btn, 'click', handler);
  };

  O.ceBr(body);

  const resultLeft = O.ceDiv(body, 'result result-left');
  const resultRight = O.ceDiv(body, 'result result-right');

  let matches = [];

  const setMatches = arr => {
    matches = arr;
    setResult(arr.join('\n'));
  };

  const setResult = (str='') => {
    resultLeft.innerText = str;
  };

  const setLinks = (links=[]) => {
    resultRight.innerText = '';

    for(const link of links)
      O.ceLink(resultRight, link, link);
  };
};

const url2pth = url => {
  return url.replace(BASE_URL, BASE_PTH);
};

const pth2url = pth => {
  return pth.replace(BASE_PTH, BASE_URL);
};

main().catch(log);