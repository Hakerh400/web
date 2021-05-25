'use strict';

const ctorsPri = ctorsArr => {
  const obj = O.obj();

  obj.ctorsNum = ctorsArr.length;

  ctorsArr.forEach((ctor, index) => {
    ctor.pri = index;
    obj[ctor.name] = ctor;
  });

  return obj;
};

module.exports = ctorsPri;