'use strict';

const assert = require('assert');
const parser = require('./parser');
const Expr = require('./expr');
const Context = require('./context');
const Subgoal = require('./subgoal');
const Editor = require('./editor');
const LineData = require('./line-data');
const specialChars = require('./special-chars');
const util = require('./util');
const su = require('./str-util');

const {min, max} = Math;
const {project} = O;
const {Ident, Call, Lambda} = Expr;

const displayLineProcess = 0;

const {g} = O.ceCanvas(1);

const ws = 12;
const hs = 25;
const ofs = 15;

const smallNatMax = 1e3;
const mediumNatMax = 2 ** 30 - 1;

const mainEditor = new Editor();
const outputEditor = new Editor();

const linesData = [];

let dataPrev = null;

let iw, ih;
let w, h;

const main = () => {
  // O.dbgAssert = 1;
  mainEditor.selected = 1;

  if(O.has(localStorage, project))
    load();

  mainEditor.updateLine(0);

  initCanvas();
  aels();

  onResize();
  O.raf(updateDisplay);
};

const initCanvas = () => {
  g.textBaseline = 'middle';
  g.textAlign = 'center';

  g.fontFamily = 'monospace';
  g.font((ws + hs) / 2);
};

const aels = () => {
  O.ael('keydown', onKeyDown);
  O.ael('keypress', onKeyPress);
  O.ael('resize', onResize);
};

const updateDisplay = () => {
  const {lines, updatedLine} = mainEditor;
  mainEditor.updatedLine = null;

  if(updatedLine !== null && linesData.length > updatedLine)
    linesData.length = updatedLine;

  if(!hasErr() && linesData.length !== lines.length)
    updateNextLine();

  if(!hasErr() && linesData.length !== lines.length){
    const index = linesData.length;
    const line = lines[index];

    if(displayLineProcess && line.trim())
      mainEditor.markedLine = [index, '#f80'];
  }

  mainEditor.updatedLine = null;

  updateOutput();
  render();

  O.raf(updateDisplay);
};

const render = () => {
  g.clearCanvas('white');

  const iwh = iw / 2;
  const ihh = ih / 2;

  const wh = w >> 1;
  const hh = h >> 1;

  const ofs2 = ofs * 2;
  const width = (iw - ofs2) / ws >> 1;
  const height = (ih - ofs2) / hs | 0;

  g.beginPath();
  g.moveTo(iwh, 0);
  g.lineTo(iwh, ih);
  g.stroke();

  g.translate(ofs, ofs);
  g.scale(ws, hs);
  mainEditor.render(g, width, height);
  g.resetTransform();

  g.translate(iwh + ofs, ofs);
  g.scale(ws, hs);
  outputEditor.render(g, width, height);
  g.resetTransform();
};

const updateNextLine = () => {
  const {lines} = mainEditor;
  const index = linesData.length;

  mainEditor.markedLine = null;

  const dataPrev = getLastData();
  const {ctx} = dataPrev;
  const data = O.rec(processLine, index, ctx);

  if(data === null){
    linesData.push(dataPrev);
    return;
  }

  linesData.push(data);

  if(data.err){
    mainEditor.markedLine = [index, '#faa'];
    return;
  }
};

const updateOutput = () => {
  const linesDataNum = linesData.length;
  let lineIndex = mainEditor.cy;

  if(hasErr() && lineIndex >= linesDataNum)
    lineIndex = linesDataNum - 1;

  if(lineIndex >= linesDataNum){
    if(dataPrev === null) return;

    dataPrev = null;
    outputEditor.clear();

    return;
  }

  const data = linesData[min(lineIndex, linesDataNum - 1)];
  if(data === dataPrev) return;

  dataPrev = data;
  outputEditor.setText(data.str);
};

const getLastData = () => {
  const data = O.last(linesData);
  if(data === null) return mkInitialLineData();

  return data;
};

const mkInitialLineData = () => {
  return new LineData(0, new Context());
};

const processLine = function*(lineIndex, ctx){
  const ctxPrev = ctx;

  const mkLineDataStr = function*(str){
    const hadProof = ctxPrev.hasProof;

    if(!hadProof)
      return str;

    const {proof} = ctxPrev;
    const {name, prop} = ctxPrev;
    const {hasProof} = ctx;

    if(!hasProof)
      return `lemma ${
        proof.name}: ${
        yield [[proof.prop, 'toStr'], ctx]}`;

    assert(proof.name === ctx.proof.name);

    return `${
      yield [[proof, 'toStr'], ctxPrev]}\n\n${
      '-'.repeat(50)}\n\n${str}`;
  };

  const mkLineData = function*(str, err){
    const strNew = yield [mkLineDataStr, str];
    return new LineData(lineIndex, ctx, strNew, err);
  };

  const processResult = function*(result){
    if(!result) return result;

    if(result[0] === 0){
      const err = result[1];

      if(!util.isStr(err))
        throw err;

      // const msg = typeof err === 'string' ?
      //   err : su.tab(err.pos, `^ ${err.msg}`);

      return O.breakRec(yield [mkLineData, err, 1]);
    }

    return result[1];
  };

  const ret = function*(str){
    return yield [mkLineData, str];
  };

  const err = function*(msg){
    return O.tco(processResult, [0, msg]);
  };

  const syntErr = () => {
    throw `Syntax error near ${O.sf(line.trim())}`;
  };

  const {lines} = mainEditor;
  let line = lines[lineIndex];

  line = line.trimLeft();

  const eol = () => {
    return line.length === 0;
  };

  const neol = () => {
    return line.length !== 0;
  };

  const name2str = name => {
    return ctx.name2str(name, 2);
  };

  if(eol() || line.trim() === '-'){
    if(!ctx.hasProof)
      return null;

    return O.tco(mkLineData, '');
  }

  const stack = [];

  const push = function*(str){
    stack.push(line);
    line = str;
  };

  const pop = function*(assertEmpty=1){
    assert(stack.length !== 0);

    if(assertEmpty)
      yield [assertEol];

    const str = line;
    line = stack.pop();

    return str;
  };

  const assertEol = function*(){
    if(neol())
      throw `Extra tokens found at the end: ${O.sf(line.trim())}`;

    return [1];
  };

  const assertFreeRule = function*(name){
    if(ctx.hasRule(name))
      throw `Rule ${O.sf(name)} already exists`;

    return [1];
  };

  const assertFree = function*(name){
    if(ctx.hasName(name))
      throw `Identifier ${name2str(name)} already exists`;

    return [1];
  };

  const assertDefined = function*(name){
    if(!ctx.hasName(name))
      throw `Undefined identifier ${name2str(name)}`;

    return [1];
  };

  const assertEq = function*(actual, str){
    const {isType} = actual;

    const expr = yield [parser.parse, ctx, str, isType];
    const expected = yield [[expr, 'simplify'], ctx];

    if(yield [[actual, 'eqAlpha'], expected])
      return [1];

    const str1 = yield [[expected, 'toStr'], ctx];
    const str2 = yield [[actual, 'toStr'], ctx];

    if(str2 !== str1)
      throw `${isType ? 'Types' : 'Values'} do not match\n${
        su.tab(1, `Expected: ${str1}`)}\n${
        su.tab(1, `Actual:${' '.repeat(2)} ${str2}`)}`;
  };

  const trimLine = (trim=1) => {
    if(!trim) return;
    line = line.trimLeft();
  };

  const advance = function*(str, trim){
    line = line.slice(str.length);
    trimLine(trim);

    return str;
  };

  const getToken = function*(parens=0, trim){
    let match = line.match(/^[^\s\(\)\[\]\,\.\:]+/);

    if(match !== null)
      return O.tco(advance, match[0], trim);

    if(!parens) return null;

    match = line.match(/^\(\s*([^\s\(\)\[\]\,\.\:]+)\s*\)/);
    if(match === null) return null;

    yield [advance, match[0], trim];

    return match[1];
  };

  const getIdent = function*(){
    const name = yield [getToken, 1];

    if(name === null)
      throw `Missing identifier`;

    return name;
  };

  const getExact = function*(str){
    if(!line.startsWith(str))
      throw `Expected ${O.sf(str)} near ${O.sf(line.trim())}`;

    return O.tco(advance, str);
  };

  const getSomeParens = function*(c1, c2, trim){
    const end = line.indexOf(c2);

    if(!line.startsWith(c1) || end === -1)
      throw `Invalid parenthesis near ${O.sf(line.trim())}`;
    
    let str = line.slice(1, end);
    line = line.slice(end + 1);
    trimLine(trim);

    str = str.trim();

    if(str.length === 0)
      return [];

    return str.split(',').map(a => a.trim());
  };

  const getParens = function*(trim){
    return O.tco(getSomeParens, '(', ')', trim);
  };

  const getBrackets = function*(trim){
    return O.tco(getSomeParens, '[', ']', trim);
  };

  const getBraces = function*(trim){
    return O.tco(getSomeParens, '{', '}', trim);
  };

  const getInt = function*(min=null, max=null){
    if(min !== null) min = BigInt(min);
    if(max !== null) max = BigInt(max);

    if(min !== null && max !== null)
      assert(min <= max);

    const tk = yield [getToken];

    if(tk === null)
      throw `Missing number`;

    if(!su.isInt(tk))
      throw `Invalid number ${O.sf(tk)}`;

    const n = BigInt(tk);

    if(min !== null && n < min)
      throw `Number ${n} is too small (must be at least ${min})`;

    if(max !== null && n > max)
      throw `Number ${n} is too big (must be at most ${max})`;

    return n;
  };

  const getNat = function*(max){
    return O.tco(getInt, 0, max);
  };

  const getSmallNat = function*(max=smallNatMax){
    assert(max <= smallNatMax);

    const n = yield [getNat, max];
    return Number(n);
  };

  const getMediumNat = function*(){
    const n = yield [getNat, mediumNatMax];
    return Number(n);
  };

  const getArity = function*(){
    return O.tco(getMediumNat);
  };

  const getPrec = function*(){
    return O.tco(getMediumNat);
  };

  const getIdentInfo = function*(){
    const elems = yield [getBrackets];

    if(elems.length !== 1)
      throw `Expected exactly one element in [${elems.join(', ')}]`;

    yield [push, elems[0]];

    const sort = yield [getToken];

    if(sort === null)
      throw `Missing identifier sort`;

    if(!O.has(parseIdentSortFuncs, sort))
      throw `Unknown identifier sort ${O.sf(sort)}`;

    const info = yield [parseIdentSortFuncs[sort]];
    yield [pop];

    return info;
  };

  const getMeta = function*(name, addParens=0){
    let sym = ctx.getMeta(name);

    if(addParens)
      sym = su.addParens(sym);

    return sym;
  };

  const getExpr = function*(isType){
    const exprRaw = yield [parser.parse, ctx, line, isType];
    const expr = yield [[exprRaw, 'simplify'], ctx];

    line = '';

    return expr;
  };

  const getProp = function*(){
    const prop = yield [getExpr];
    const boolSym = yield [getMeta, 'bool', 1];

    yield [assertEq, prop.type, boolSym];

    return prop;
  };

  const getRuleName = function*(ruleType){
    const name = yield [getToken];

    if(name === null)
      throw `Missing ${ruleType} name`;

    yield [assertFreeRule, name];
    yield [getExact, ':'];

    return name;
  };

  const parseIdentSortFuncs = {
    *prefix(){
      const prec = yield [getPrec];
      return ['operator', [prec, [prec]]];
    },

    *infixl(){
      const prec = yield [getPrec];
      return ['operator', [prec, [prec, prec + .5]]];
    },

    *infixr(){
      const prec = yield [getPrec];
      return ['operator', [prec, [prec + .5, prec]]];
    },

    *binder(){
      return ['binder', [0, [0]]];
    },
  };

  const insertIdentSortFuncs = {
    *identifier(name, info){
      ctx.idents = util.copyObj(ctx.idents)
      ctx.idents[name] = info;
    },

    *operator(name, info){
      ctx.ops = util.copyObj(ctx.ops)
      ctx.ops[name] = info;
    },

    *binder(name, info){
      ctx.binders = util.copyObj(ctx.binders)
      ctx.binders[name] = info;
    },
  };

  const metaSymbolFuncs = {
    *bool(name){
      yield [assertDefined, name];

      const arity = ctx.getTypeArity(name);

      if(arity !== 0)
        throw `Bool type cannot have arguments`;
    },

    *arrow(name){
      yield [assertDefined, name];

      const arity = ctx.getTypeArity(name);

      if(arity !== 2)
        throw `Arrow must be a binary type`;

      ctx.meta.arrow = name;
    },

    *lambda(name){
      yield [assertFree, name];
    },

    *uni(name){
      yield [assertDefined, name];

      if(ctx.hasType(name))
        throw `Universal quantifier cannot be a type`;

      const type = ctx.getType(name);
      assert(type !== null);

      const boolSym = yield [getMeta, 'bool', 1];
      const arrowSym = yield [getMeta, 'arrow', 1];

      yield [assertEq, type, `${arrowSym} (${arrowSym} 'a ${boolSym}) ${boolSym}`];
    },

    *imp(name){
      yield [assertDefined, name];

      if(ctx.hasType(name))
        throw `Implication cannot be a type`;

      const type = ctx.getType(name);
      assert(type !== null);

      const boolSym = yield [getMeta, 'bool', 1];
      const arrowSym = yield [getMeta, 'arrow', 1];

      yield [assertEq, type, `${arrowSym} ${boolSym} (${arrowSym} ${boolSym} ${boolSym})`];
    },

    *eq(name){
      yield [assertDefined, name];

      if(ctx.hasType(name))
        throw `Equality cannot be a type`;

      const type = ctx.getType(name);
      assert(type !== null);

      const boolSym = yield [getMeta, 'bool', 1];
      const arrowSym = yield [getMeta, 'arrow', 1];

      yield [assertEq, type, `${arrowSym} 'a (${arrowSym} 'a ${boolSym})`];
    },
  };

  const directiveFuncs = {
    *spacing(){
      const name = yield [getIdent];
      const before = yield [getSmallNat];
      const after = yield [getSmallNat];
      const inParens = yield [getSmallNat, 1];

      if(ctx.hasSpacingInfo(name))
        throw `Spacing has already been defined for ${name2str(name)}`;

      ctx = ctx.copy();
      ctx.spacing = util.copyObj(ctx.spacing);

      ctx.setSpacingInfo(name, [before, after, inParens]);

      return O.tco(ret, `spacing ${name2str(name)} ${before} ${after} ${inParens}`);
    },

    *type(){
      const name = yield [getIdent];
      yield [assertFree, name];

      const arity = yield [getArity];

      let sort = 'identifier';
      let info = [0, []];

      if(line.startsWith('[')){
        [sort, info] = yield [getIdentInfo];

        if(sort !== 'operator')
          throw `Type identifier ${
            name2str(name)} cannot be defined as \`${
            sort}\``;
      }

      ctx = ctx.copy();

      assert(O.has(insertIdentSortFuncs, sort));
      yield [insertIdentSortFuncs[sort], name, [arity, info]];

      return O.tco(ret, `type ${name2str(name)} ${arity}`);
    },

    *const(){
      const name = yield [getIdent];
      yield [assertFree, name];

      let sort = 'identifier';
      let info = [0, []];

      if(line.startsWith('['))
        [sort, info] = yield [getIdentInfo];

      yield [getExact, '::'];
      const type = yield [getExpr, 1];

      ctx = ctx.copy();

      assert(O.has(insertIdentSortFuncs, sort));
      yield [insertIdentSortFuncs[sort], name, [type, info]];

      return O.tco(ret, `const ${name2str(name)} :: ${yield [[type, 'toStr'], ctx]}`);
    },

    *meta(){
      const name = yield [getToken];

      if(name === null)
        throw `Missing meta symbol name`;

      if(!O.has(metaSymbolFuncs, name))
        throw `Unknown meta symbol ${O.sf(name)}`;

      if(ctx.hasMeta(name))
        throw `Meta symbol ${O.sf(name)} has already been defined`;

      const ident = yield [getIdent, 0];

      ctx = ctx.copy();
      ctx.meta = util.copyObj(ctx.meta);

      yield [metaSymbolFuncs[name], ident];
      ctx.meta[name] = ident;

      return O.tco(ret, `meta ${name} ${name2str(ident)}`);
    },

    *axiom(){
      const name = yield [getRuleName, 'axiom'];
      const prop = yield [getProp];

      ctx = ctx.copy();
      ctx.rules = util.copyObj(ctx.rules);
      ctx.rules[name] = prop;

      return O.tco(ret, `axiom ${name}: ${yield [[prop, 'toStr'], ctx]}`);
    },

    *lemma(){
      const name = yield [getRuleName, 'lemma'];
      const prop = yield [getProp];

      ctx = ctx.copy();

      const subgoal = new Subgoal();
      yield [[subgoal, 'addGoal'], ctx, prop];

      ctx.createProof(name, prop);
      ctx.proof.addSubgoal(subgoal);

      return O.tco(ret, yield [[ctx.proof, 'toStr'], ctx]);
    },

    *def(){
      const name = yield [getIdent];
      yield [assertFree, name];

      let sort = 'identifier';
      let info = [0, []];

      if(line.startsWith('['))
        [sort, info] = yield [getIdentInfo];

      yield [getExact, ':'];

      const val = yield [getExpr];
      const type = val.type;

      ctx = ctx.copy();

      assert(O.has(insertIdentSortFuncs, sort));
      yield [insertIdentSortFuncs[sort], name, [type, info]];

      const eqSym = yield [getMeta, 'eq'];
      const ruleName = `${name}_def`;
      const rule = yield [[Expr.mkBinOp(eqSym, new Ident(name), val), 'simplify'], ctx];

      ctx.rules = util.copyObj(ctx.rules);
      const {rules} = ctx;

      if(O.has(rules, ruleName))
        throw `Rule ${O.sf(ruleName)} already exists`;

      rules[ruleName] = rule;

      // if(name === '¬'){
      //   for(const name of O.keys(ctx.ops))
      //     log(`${name2str(name)} ---> ${JSON.stringify(ctx.ops[name][1]).replace(/\,/g, ', ')}`);
      // }

      return O.tco(ret, `def ${name2str(name)}: ${yield [[val, 'toStr'], ctx]}`);
    },
  };

  const applySpecsAndMPs = function*(proof){
    line = line.trimRight();

    const matchGoal = line.endsWith(' %');
    if(matchGoal) line = line.slice(0, -2);

    const {subgoal} = proof;
    const {premises, goal} = subgoal;
    const premisesNum = premises.length;

    const premisesStatus = O.obj();

    let prop = null;
    let insertionIndex = null;
    let offsetIndex = 0;

    const setPremiseStatus = function*(index, keep){
      if(O.has(premisesStatus, index) && premisesStatus[index] ^ keep)
        throw `Status mismatch for premise ${index + 1}`;

      premisesStatus[index] = keep;
    };

    const setInsIndex = function*(index){
      if(insertionIndex !== null)
        throw `Multiple appearances of \`*\` premise attribute`;

      insertionIndex = index;
    };

    const processPremiseAttribs = function*(index, attribs){
      const attribsNum = attribs.length;
      const keep = attribs.includes('+');
      const ins = attribs.includes('*');

      if(keep + ins !== attribsNum)
        throw `Invalid premise attributes ${O.sf(attribs)}`;

      yield [setPremiseStatus, index, keep];
      if(!ins) return;

      yield [setInsIndex, index + attribs.startsWith('+')];
    };

    const parsePremiseIndex = function*(tk){
      if(!/^\d/.test(tk)) return null;

      const match = tk.match(/^(\d+)(.*)$/);
      assert(match !== null);

      const indexStr = match[1]
      const attribs = match[2];

      if(!su.isInt(indexStr))
        throw `Invalid premise index ${O.sf(indexStr)}`;

      const index = Number(indexStr) - 1;

      if(!(index >= 0 && index < premisesNum))
        throw `There is no premise with index ${tk}`;

      yield [processPremiseAttribs, index, attribs];

      return index;
    };

    while(!eol()){
      let propNew = null;
      let specs = null;
      let unisNum = null;

      if(line.startsWith('{')){
        const elems = yield [getBraces, 0];

        if(elems.length !== 1)
          throw `Expected exactly one element in the braces, but got ${
            elems.length}`;

        const str = elems[0];

        if(!su.isInt(str))
          throw `Invalid parameter {${str}}`;

        unisNum = Number(str);

        if(unisNum < 0)
          throw `Universal quantifier number must be a positive integer`;

        if(/^\s/.test(line))
          throw `Missing an expression after the universal quantifier number`;
      }

      if(!line.startsWith('[')){
        const tk = yield [getToken, 0, 0];

        if(tk === null)
          return syntErr();

        const premiseIndex = yield [parsePremiseIndex, tk];

        if(premiseIndex !== null){
          // Premise

          propNew = premises[premiseIndex];
        }else{
          // Other rule

          const rule = ctx.getRule(tk);

          if(rule === null)
            throw `Undefined rule ${O.sf(tk)}`;

          propNew = rule;
        }
      }

      if(line.startsWith('[')){
        const exprStrs = yield [getBrackets, 0];

        if(exprStrs.length === 0)
          throw `Empty specification parameters`;

        specs = [];

        for(const str of exprStrs)
          specs.push(yield [parser.parse, ctx, str]);
      }

      if(neol() && !line.startsWith(' '))
        return syntErr();

      trimLine();

      if(propNew === null){
        assert(specs !== null);
        assert(specs.length !== 0);

        if(unisNum !== null)
          throw `Universal quantifier number cannot be defined for pure specification`;

        if(prop === null)
          throw `Pure specification cannot be the first transformation`;

        prop = yield [[prop, 'specArr'], ctx, specs];
        continue;
      }

      if(specs !== null)
        propNew = yield [[propNew, 'specArr'], ctx, specs];

      if(prop === null){
        prop = propNew;
        continue;
      }

      prop = yield [[prop, 'mpDir'], ctx, propNew, unisNum];
    }

    if(prop === null)
      throw `This proof directive requires at least one proposition`;

    prop = yield [[prop, 'simplify'], ctx];

    const premisesNew = premises.filter((p, i) => {
      if(!O.has(premisesStatus, i)) return 1;
      if(premisesStatus[i]) return 1;

      if(insertionIndex !== null && i < insertionIndex)
        insertionIndex--;

      return 0;
    });

    return {
      prop,
      offsetIndex,
      insertionIndex,
      premisesNew,
      matchGoal,
    };
  };

  const proofDirectiveFuncs = {
    *'-'(proof){
      const {subgoal} = proof;
      const {goal} = subgoal;

      const {
        prop,
        offsetIndex,
        insertionIndex,
        premisesNew,
        matchGoal,
      } = yield [applySpecsAndMPs, proof];

      const proofNew = proof.copy();

      if(!matchGoal){
        const subgoalNew = subgoal.copy();

        subgoalNew.premises = premisesNew;
        subgoalNew.addPremise(prop, insertionIndex);

        proofNew.setSubgoal(subgoalNew, 1);

        ctx = ctx.copy();
        ctx.proof = proofNew;

        return O.tco(ret, yield [[prop, 'toStr'], ctx]);
      }

      proofNew.subgoals = proofNew.subgoals.slice();
      proofNew.removeSubgoal();

      const goalsNew = yield [[prop, 'mpRev'], ctx, goal];

      const goalStrs = [];
      const toStrIdents = util.obj2();

      for(let i = goalsNew.length - 1; i !== -1; i--){
        const goal = goalsNew[i];
        goalStrs.push(yield [[goal, 'toStr'], ctx, toStrIdents]);

        const subgoalNew = subgoal.copy();
        subgoalNew.premises = premisesNew;

        yield [[subgoalNew, 'replaceGoal'], ctx, goal];

        proofNew.addSubgoal(subgoalNew);
      }

      goalStrs.reverse();

      ctx = ctx.copy();

      if(proofNew.hasSubgoal){
        ctx.proof = proofNew;
      }else{
        ctx.proof = null;
        ctx.rules = util.copyObj(ctx.rules);
        ctx.rules[proof.name] = proof.prop;
      }

      const finalStr = goalStrs.length !== 0 ?
        goalStrs.join('\n') :
        'The subgoal is done!';

      return O.tco(ret, finalStr);
    },

    *show(){
      const exprStrs = yield [getBrackets];

      if(exprStrs.length === 0)
        throw `At least one proposition must be specified in the \`show\` directive`;

      const boolSym = yield [getMeta, 'bool', 1];

      const toStrIdents = util.obj2();
      yield [[ctx.proof.subgoal, 'toStr'], ctx, toStrIdents];

      const props = [];
      const propStrs = [];

      for(const str of exprStrs){
        let prop = yield [parser.parse, ctx, str];
        prop = yield [[prop, 'simplify'], ctx];

        yield [assertEq, prop.type, boolSym];

        props.push(prop);
        propStrs.push(yield [[prop, 'toStr'], ctx, toStrIdents]);
      }

      const propsNum = props.length;

      ctx = ctx.copy();

      const proof = ctx.proof = ctx.proof.copy();
      const subgoals = proof.subgoals = proof.subgoals.slice();
      const subgoal = proof.subgoals[0] = proof.subgoal.copy();
      const premises = subgoal.premises = subgoal.premises.slice();

      const subgoalsNew = [];

      for(let i = 0; i !== propsNum; i++){
        const prop = props[i];

        const subgoalNew = subgoal.copy();
        yield [[subgoalNew, 'replaceGoal'], ctx, prop];

        subgoalsNew.push(subgoalNew);
        premises.push(prop);
      }

      proof.subgoals = [subgoal, ...subgoalsNew, ...subgoals.slice(1)];

      return O.tco(ret, propStrs.join('\n'));
    },

    *rem(){
      const {proof} = ctx;
      const {subgoals, subgoal} = proof;
      const {premises} = subgoal;
      const premisesNum = premises.length;

      const indicesStrs = line.split(' ');
      const indicesObj = O.obj();

      if(eol()) throw `Expected at least one premise index`;

      for(const str of indicesStrs){
        const str1 = str.trim();

        if(!su.isInt(str1))
          throw `Expected a premise index, but got ${O.sf(str1)}`;

        const n = Number(str1) - 1;

        if(!(n >= 0 && n < premisesNum))
          throw `There is no premise with index ${str1}`;

        if(O.has(indicesObj, n))
          throw `Duplicate premise index ${n}`;

        indicesObj[n] = 1;
      }

      ctx = ctx.copy();

      const proofNew = ctx.proof = proof.copy();
      const subgoalsNew = proofNew.subgoals = subgoals.slice();
      const subgoalNew = proofNew.subgoals[0] = subgoal.copy();

      const premisesNew = premises.filter((a, i) => {
        return !O.has(indicesObj, i);
      });

      subgoalNew.premises = premisesNew;
      line = '';

      return O.tco(ret, '');
    },
  };

  const processLine = function*(){
    const directive = yield [getToken];
    let data;

    if(directive === null)
      throw `Missing directive`;

    if(!ctx.hasProof){
      if(!O.has(directiveFuncs, directive))
        throw `Unknown directive ${O.sf(directive)}`;

      data = yield [directiveFuncs[directive]];
    }else{
      if(!O.has(proofDirectiveFuncs, directive))
        throw `Unknown proof directive ${O.sf(directive)}`;

      const {proof} = ctx;
      assert(proof.hasSubgoal);

      data = yield [proofDirectiveFuncs[directive], proof];
    }

    yield [assertEol];
    return data;
  };

  const result = yield O.try(processLine);
  return O.tco(processResult, result);
};

const hasErr = () => {
  const data = O.last(linesData);
  if(data === null) return 0;

  return data.err;
};

const onKeyDown = evt => {
  const {ctrlKey, shiftKey, altKey, code} = evt;
  const flags = (ctrlKey << 2) | (shiftKey << 1) | altKey;

  flagCases: {
    noFlags: if(flags === 0){
      if(/^Arrow|^(?:Backspace|Home|End|Delete|Tab)$/.test(code)){
        O.pd(evt);
        mainEditor.processKey(code);
        break flagCases;
      }

      break flagCases;
    }

    ctrl: if(flags === 4){
      if(code === 'KeyS'){
        O.pd(evt);
        save();
        break flagCases;
      }

      if(code === 'ArrowUp'){
        mainEditor.scrollUp(1);
        break flagCases;
      }

      if(code === 'ArrowDown'){
        mainEditor.scrollDown(1);
        break flagCases;
      }

      if(code === 'ArrowLeft'){
        mainEditor.scrollLeft(0);
        break flagCases;
      }

      if(code === 'ArrowRight'){
        mainEditor.scrollRight(0);
        break flagCases;
      }

      break flagCases;
    }

    ctrlShift: if(flags === 6){
      if(code === 'KeyD'){
        O.pd(evt);
        mainEditor.processKey('Duplicate');
        break flagCases;
      }

      if(code === 'ArrowUp'){
        O.pd(evt);
        mainEditor.processKey('MoveUp');
        break flagCases;
      }

      if(code === 'ArrowDown'){
        O.pd(evt);
        mainEditor.processKey('MoveDown');
        break flagCases;
      }

      break flagCases;
    }
  }
};

const onKeyPress = evt => {
  const {ctrlKey, altKey, key} = evt;
  if(ctrlKey || altKey) return;

  const shouldAddTab = () => {
    const {cy} = mainEditor;
    if(linesData.length <= cy) return 0;

    const {ctx} = linesData[cy];
    return ctx.hasProof;
  };

  const addTab = shouldAddTab();

  mainEditor.processKey(key, addTab);
};

const save = () => {
  localStorage[project] = JSON.stringify({
    str: mainEditor.lines.join('\n'),
    cx: mainEditor.cx,
    cy: mainEditor.cy,
    cxPrev: mainEditor.cxPrev,
    scrollX: mainEditor.scrollX,
    scrollY: mainEditor.scrollY,
  });
};

const load = () => {
  const {
    str,
    cx,
    cy,
    cxPrev,
    scrollX,
    scrollY,
  } = JSON.parse(localStorage[project]);

  mainEditor.cx = cx;
  mainEditor.cy = cy;
  mainEditor.cxPrev = cxPrev;
  mainEditor.scrollX = scrollX;
  mainEditor.scrollY = scrollY;
  mainEditor.setText(str);
};

const onResize = evt => {
  iw = O.iw;
  ih = O.ih;

  w = iw / ws | 0;
  h = ih / hs | 0;

  g.resize(iw, ih);
};

main();