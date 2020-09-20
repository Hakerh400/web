'use strict';

const main = () => {
  const span = O.ce(O.body, 'span');
  span.innerText = 'Password: ';

  const input = O.ce(O.body, 'input');
  input.type = 'text';
  input.autofocus = 1;

  O.ceBr(O.body, 2);
  const errMsg = O.ce(O.body, 'span');
  errMsg.style.fontWeight = 'bold';
  errMsg.style.color = 'red';

  O.ael(input, 'keydown', evt => {
    if(evt.code !== 'Enter') return;

    O.rfLocal('1.hex', 1, (status, encrypted) => {
      const pass = O.Buffer.from(input.value);
      let hash = O.sha256(pass);
      
      input.value = '';
      errMsg.innerText = '';

      const text = encrypted;
      const result = [];

      for(let i = 0; i !== text.length; i++){
        result.push(text[i] ^ hash[i & 31]);
        if((i & 31) === 31) hash = O.sha256(O.Buffer.concat([pass, hash]));
      }

      try{
        let text = O.IO.unlock(O.Buffer.from(result));
        let str = '';

        for(let i = 0; i !== text.length; i += 2)
          str += O.sfcc(text[i] | (text[i + 1] << 8));

        const pre = O.ce(O.body, 'pre');
        pre.innerText = str;
      }catch(e){
        if(e.message !== 'Invalid checksum') throw e;
        errMsg.innerText = 'Wrong password.';
      }
    });
  });
};

main();