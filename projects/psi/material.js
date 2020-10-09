'use strict';

const cwd = __dirname;

class Material{
  constructor(img, tex){
    this.img = img;
    this.tex = tex;
  }

  static async init(reng, genTexFunc, procTexFunc){
    const textures = {
      hud: './textures/hud.png',
      sky: './textures/sky.png',
      dirt: './textures/dirt.png',
      rock: './textures/rock.png',
      tree: './textures/tree.png',
      animal: './textures/animal.png',
      coin: './textures/coin.png',
    };

    if(O.isElectron){
      const avatarsDir = path.join(cwd, '../../../data/avatars');

      for(const {nick} of reng.compData.users){
        const fileName = `${nick}.png`;
        const file = path.join(avatarsDir, fileName);

        textures[`bot[${nick}]`] = fs.existsSync(file) ?
          file :
          path.join(avatarsDir, '[default].png');
      }
    }else{
      textures.bot = O.lst.signedIn ?
        `/avatar?nick=${O.lst.nick}` :
        './textures/bot.png';
    }

    for(const texture of O.keys(textures)){
      const glTex = genTexFunc();
      const [img, tex] = await Material.loadTexture(textures[texture], glTex, procTexFunc);
      Material[texture] = new Material(img, tex);
    }
  }

  static loadTexture(pth, glTex, procTexFunc){
    return new Promise((res, rej) => {
      (async () => {
        const tex = glTex;
        const img = new Image();

        img.onload = () => {
          procTexFunc(tex, img);
          res([img, tex]);
        };

        img.onerror = () => {
          rej(new Error(`Cannot load image ${O.sf(pth)}`));
        };

        if(pth[0] === '.')
          pth = path.join(cwd, pth);

        if(O.isElectron){
          const {canvas} = await media.loadImage(pth);
          img.src = canvas.toDataURL();
        }else{
          img.src = O.urlTime(pth);
        }
      })().catch(rej);
    });
  }
};

module.exports = Material;