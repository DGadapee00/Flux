import assert from 'node:assert/strict';
import test from 'node:test';
import { NO_PLUS_C, constantOfIntegration, createEngine } from '../src/problems/engine.js';
import { createProgress, pickSet } from '../src/problems/progress.js';

const ZERO = [0];
const U = [1];

function parseUnit(src) {
  if (src === 'u') return U;
  if (src === '1' || src === '') return ZERO;
  throw new Error(`unknown ${src}`);
}

const dims = {
  ZERO,
  CONST_DIMS: { pi: ZERO, qq: U },
  parseUnit,
  formatDim: (d) => (d[0] ? 'u' : '1'),
  dimEqual: (a, b) => a[0] === b[0],
  isDimensionless: (d) => d[0] === 0,
  dimMul: (a, b) => [a[0] + b[0]],
  dimDiv: (a, b) => [a[0] - b[0]],
  dimScale: (d, e) => [d[0] * e],
};

function memoryStore() {
  const m = new Map();
  return {
    readJSON(name) {
      const raw = m.get(name);
      return raw ? JSON.parse(raw) : null;
    },
    writeJSON(name, value) {
      m.set(name, JSON.stringify(value));
    },
    exportJSON() {
      return { v: 1 };
    },
    importJSON() {},
  };
}

test('constants are the caller\'s', () => {
  const eng = createEngine({ consts: { qq: 5 } });
  assert.equal(eng.compile('2*qq')(), 10);
  assert.equal(eng.compile('pi')(), Math.PI);
});

test('a part with traps accepts an alternate and a trailing percent', () => {
  const { grade } = createEngine({ numbers: 'percent', choiceNotes: true });
  const part = {
    kind: 'numeric',
    get: () => 0.25,
    alt: () => 0.251,
    traps: [],
    tol: 0,
    abs: 0.002,
    prob: true,
  };
  assert.equal(grade(part, {}, '25%').correct, true);
  assert.equal(grade(part, {}, '0.251').correct, true);
  assert.match(grade(part, {}, '0.75').feedback, /complement/);
});

test('a plain numeric part uses one value, wrap, and typed units only when a table was passed', () => {
  const plain = createEngine();
  const angle = { kind: 'numeric', get: () => 330, scale: 1, tol: 0.005, abs: 0.6, wrap: 360, unit: '°' };
  assert.equal(plain.grade(angle, {}, '-30').correct, true);
  assert.equal(plain.grade(angle, {}, '150').correct, false);
  const measure = { kind: 'numeric', get: () => 0.005, scale: 1, tol: 0.02, abs: 0, unit: 'u' };
  assert.equal(plain.grade(measure, {}, '5 mu').correct, false);

  const withUnits = createEngine({
    typed: {
      ...dims,
      special: [],
      noPrefix: [],
      bases: { u: ['u', 1] },
      prefix: { m: 1e-3 },
    },
  });
  assert.equal(withUnits.grade(measure, {}, '5 mu').correct, true);
  const off = { kind: 'numeric', get: () => 2.5e-6, scale: 1, tol: 0.02, abs: 0, unit: 'u' };
  assert.match(withUnits.grade(off, {}, '2.5e-3').feedback, /10\^3/);
});

test('dimensionOf reads the injected table', () => {
  const eng = createEngine({ consts: { qq: 2 }, units: dims });
  const ast = eng.parseExpr('qq*x', ['x']);
  assert.deepEqual(eng.dimensionOf(ast, { x: 'u' }), [2]);
});

test('a clean solve promotes every time unless whenDue is set, and cap clamps the next review', () => {
  const open = createProgress(memoryStore());
  const t0 = Date.parse('2026-09-01T12:00:00Z');
  open.record('p', { correct: true, clean: true, now: t0 });
  open.record('p', { correct: true, clean: true, now: t0 + 60e3 });
  assert.equal(open.get('p').box, 2);

  const held = createProgress(memoryStore(), { promoteWhenDue: true });
  const now = Date.now();
  for (let k = 0; k < 5; k++) held.record('p', { correct: true, clean: true, now: now + k * 60e3 });
  assert.equal(held.get('p').box, 1);
  let at = now;
  const spaced = createProgress(memoryStore(), { promoteWhenDue: true });
  for (let k = 0; k < 4; k++) {
    spaced.record('p', { correct: true, clean: true, now: at });
    at = spaced.get('p').due + 1;
  }
  assert.equal(spaced.get('p').box, 4);
  const cap = at + 2 * 864e5;
  spaced.record('p', { correct: true, clean: true, now: at, cap });
  assert.ok(spaced.get('p').due <= cap);
});

test('countVersions is the legal cartesian product, and a symbolic key may depend on the version', () => {
  const { countVersions, grade, evalSymbolic } = createEngine();
  const range = (min, max, step) => ({ type: 'range', min, max, step });
  const fixed = {
    id: 'fixed',
    vars: { a: range(1, 3, 1) },
    derive: () => ({}),
    valid: () => true,
    parts: [],
  };
  assert.equal(countVersions(fixed), 3);
  const gated = { ...fixed, valid: ($) => $.a !== 2 };
  assert.equal(countVersions(gated, { need: 50 }), 2);
  const wide = { ...fixed, vars: { a: range(1, 10, 1), b: range(1, 10, 1) } };
  assert.equal(countVersions(wide, { need: 50 }), 50);

  const sym = {
    kind: 'symbolic',
    expr: ($) => `${$.a}*x`,
    vars: ['x'],
    alias: {},
    get: ($) => $.a * $.x,
  };
  const $ = { a: 4, x: 2 };
  assert.equal(evalSymbolic(sym, $), 8);
  assert.equal(grade(sym, $, '4*x').correct, true);
  assert.equal(grade(sym, $, '5*x').correct, false);
  const plusC = grade(sym, $, '4*x+C');
  assert.equal(plusC.correct, false);
  assert.equal(plusC.feedback, 'use the antiderivative that is 0 at x = 0, no +C');
  assert.equal(grade(sym, $, '4*x + C').feedback, 'use the antiderivative that is 0 at x = 0, no +C');
  assert.match(grade(sym, $, '4*x+Q').feedback, /Unknown symbol/);
  const withC = { ...sym, vars: ['x', 'C'] };
  assert.equal(grade(withC, $, '4*x+C').feedback, '');
  assert.equal(grade(withC, $, '4*x+C').correct, false);
});

test('a hint may be a function of the version', () => {
  const { build, render } = createEngine();
  const tpl = {
    id: 'hinted',
    vars: { a: { type: 'range', min: 3, max: 3, step: 1 } },
    derive: () => ({}),
    valid: () => true,
    text: (T) => `a is ${T.a}`,
    parts: [],
    hints: ['plain', (T, $) => `twice a is ${2 * $.a}`],
    steps: () => [],
  };
  assert.deepEqual(render(build(tpl, { a: 3 })).hints, ['plain', 'twice a is 6']);
});

test('pickSet is stable for a seed and stays inside chapterOrder', () => {
  const templates = [
    { id: 'a', ch: '1', kind: 'numeric' },
    { id: 'b', ch: '2', kind: 'conceptual' },
    { id: 'c', ch: '1', kind: 'numeric' },
  ];
  const progress = { get: () => null };
  const opts = { n: 2, seed: 7, chapterOrder: ['1', '2'] };
  assert.deepEqual(pickSet(templates, progress, opts).map((t) => t.id), pickSet(templates, progress, opts).map((t) => t.id));
  assert.throws(() => pickSet(templates, progress, { n: 1 }));
});

test('+C is named as a constant of integration unless C is a variable of the part', () => {
  assert.equal(constantOfIntegration('x^3/3 + C', ['x']), true);
  assert.equal(constantOfIntegration('x^3/3 − C', ['x']), false);
  assert.equal(constantOfIntegration('x^3/3+C', ['x']), true);
  assert.equal(constantOfIntegration('x^3/3 + Cx', ['x']), false);
  assert.equal(constantOfIntegration('x^3/3 + C', ['x', 'C']), false);
  assert.match(NO_PLUS_C, /no \+C/);
});

test('a part with alt grades in its own unit, and a typed unit does not stop it', () => {
  const { grade } = createEngine({ numbers: 'unit' });
  // get() is in pascals; the part asks for kPa, so expected and alt are both in kPa.
  const part = { kind: 'numeric', get: () => 8650, scale: 1000, alt: () => 8.714, tol: 0.003, unit: 'kPa' };
  assert.equal(grade(part, {}, '8.65').correct, true, 'the exact value in kPa');
  assert.equal(grade(part, {}, '8.714 kPa').correct, true, 'the table value, with its unit typed');
  assert.equal(grade(part, {}, '2754 kJ/kg').correct, false, 'a wrong number is still wrong');
  assert.equal(grade(part, {}, '8650').correct, false, 'pascals are not kPa');
  const percent = createEngine({ numbers: 'percent' });
  const prob = { kind: 'numeric', get: () => 0.25, alt: () => 0.251, tol: 0, abs: 0.002, prob: true };
  assert.equal(percent.grade(prob, {}, '25%').correct, true, 'a percent course still reads a percent');
});

test('a trap names its mistake, and a part with traps still hears about sign, powers of ten and factors of 2', () => {
  const { grade } = createEngine();
  const part = { id: 'v', kind: 'numeric', get: ($) => $.a * $.t, scale: 1, tol: 0.02, abs: 1e-6, traps: [[($) => 0.5 * $.a * $.t * $.t, 'That is the distance.']] };
  const $ = { a: 2, t: 3 };
  assert.equal(grade(part, $, '6').correct, true);
  assert.equal(grade(part, $, '9').feedback, 'That is the distance.');
  assert.equal(grade(part, $, '-6').feedback, 'Right size, wrong sign.');
  assert.equal(grade(part, $, '6000').feedback, 'Off by a factor of 10^3.');
  assert.equal(grade(part, $, '12').feedback, 'Off by a factor of 2.');
  assert.equal(grade(part, $, '7.5').feedback, '');
});
