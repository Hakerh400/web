'use strict';

await O.addStyle('style.css');

const sem = new O.Semaphore();

const main = () => {
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

  const input = O.ce(body, 'input');

  ael(input, 'input', async evt => {
    const tags = input.value.trim().split(/\s*,\s*/);
    const substr = O.last(tags);

    if(substr === ''){
      setResult();
      return;
    }

    const matches = await O.rmi('tags.tag.search', substr);

    setResult(matches.join('\n'));
  });

  const ceBtn = (label, handler) => {
    const btn = O.ce(body, 'button');

    btn.innerText = label;

    ael(btn, 'click', handler);
  };

  ceBtn('New tag', async evt => {
    const tag = 'aaa'//prompt('Enter tag:');
    if(tag === null) return;

    await O.rmi('tags.tag.new', tag);

    setResult(`Added new tag: ${O.sf(tag)}`);
  });

  ceBtn('List tags');

  const result = O.ceDiv(body, 'result');

  const setResult = (str='') => {
    result.innerText = str;
  };
};

main();