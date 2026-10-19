/**
 * A small fixture course for the practice loop: two chapters, five principles, and one template of
 * each kind the loop treats differently (numeric with traps, choice with `why`, symbolic, a tool
 * problem). It names no real course. The Node tests and the browser smoke both use it.
 */
import { createEngine, createProgress as coreProgress, memoryStorage, createStore, pickInterleave as corePickInterleave, pickSet as corePickSet, INTERVAL_DAYS, MASTERED_BOX } from '@flux/core';
import { CONST_DIMS, ZERO, dimDiv, dimEqual, dimMul, dimScale, formatDim, isDimensionless, parseUnit } from '@flux/subjects/mechanics/units.js';
import { applyPrincipleTags } from '../../practice/principles.js';
import { foldCoaching } from '../../practice/coaching.js';

export const engine = createEngine({
  consts: { pi: Math.PI },
  greek: { 'π': 'pi', 'θ': 'th' },
  units: { ZERO, CONST_DIMS, parseUnit, formatDim, dimEqual, isDimensionless, dimMul, dimDiv, dimScale },
  prose: 'none',
  steps: 'sig',
  numbers: 'unit',
  sig: { figures: 3, lo: 0.01, hi: 1e5, tiny: true, leadingOne: true },
  // A wrong option's `why` comes back as its feedback.
  choiceNotes: true,
});

const range = (min, max, step, unit = '', si = 1) => ({ type: 'range', min, max, step, unit, si });
const num = (id, get, unit, o = {}) => ({ id, kind: 'numeric', get, unit, scale: o.scale ?? 1, tol: 0.02, abs: 1e-6, label: o.label ?? null, ...(o.traps ? { traps: o.traps } : {}) });

export const PRINCIPLES = {
  newton: { name: 'Newton’s second law', statement: 'ΣF = ma.', cue: 'A force and an acceleration.', family: 'Kinetics' },
  energy: { name: 'Work and energy', statement: 'T₁ + ΣU = T₂.', cue: 'Speeds at two positions.', family: 'Energy' },
  momentum: { name: 'Impulse and momentum', statement: 'mv₁ + ΣF dt = mv₂.', cue: 'A force over a time.', family: 'Momentum' },
  kinematics: { name: 'Kinematics', statement: 'v = ds/dt, a = dv/dt.', cue: 'Motion without forces.', family: 'Kinematics' },
  equilibrium: { name: 'Equilibrium', statement: 'ΣF = 0.', cue: 'Nothing accelerates.', family: 'Statics' },
  units: { name: 'Units', statement: 'Convert with exact factors.', cue: 'A conversion.', family: 'Tools' },
};

export const PRINCIPLE_TAGS = {
  'f.1.force': ['newton', 'kinematics'],
  'f.1.which': ['energy'],
  'f.1.formula': ['kinematics'],
  'f.1.convert': ['units'],
  'f.2.impulse': ['momentum'],
  'f.2.rest': ['equilibrium'],
};

const tpl = (spec) => ({ level: 1, topics: [], vars: {}, derive: () => ({}), valid: () => true, hints: [], steps: () => [], cases: [], sim: null, ...spec });

const BANK = [
  tpl({
    id: 'f.1.force',
    title: 'Force from acceleration',
    exam: 'u1',
    ch: '1',
    kind: 'numeric',
    lab: 'demo',
    vars: { m: range(2, 10, 1, 'kg'), a: range(1, 5, 1, 'm/s²') },
    text: (T) => `A $${T.m}$ kg block accelerates at $${T.a}$ m/s². Find the net force.`,
    parts: [num('F', ($) => $.m * $.a, 'N', { label: 'net force', traps: [[($) => $.m / $.a, 'That is m/a: force is mass times acceleration.'], [($) => $.m * $.a * 9.81, 'Weight does not enter: the force asked for is the net force.']] })],
    hints: ['Which law links force and acceleration?', 'Multiply mass by acceleration.'],
    steps: ($, sig) => [`$F = ma$.`, `$F = ${sig($.m)} \\times ${sig($.a)} = ${sig($.m * $.a)}$ N.`],
    sim: { scenario: 'demo', setup() {}, read: () => ({}) },
    cases: [{ src: 'Fixture §1.1', v: { m: 4, a: 3 }, want: { F: 12 } }],
  }),
  tpl({
    id: 'f.1.which',
    title: 'Which method?',
    exam: 'u1',
    ch: '1',
    kind: 'conceptual',
    text: () => 'A block slides from rest down a frictionless ramp. To find its speed at the bottom, which is quickest?',
    parts: [{ id: 'ans', kind: 'choice', options: [{ value: 'energy', label: 'Work and energy' }, { value: 'newton', label: 'ΣF = ma, then kinematics' }, { value: 'momentum', label: 'Impulse and momentum' }], correct: 'energy', multi: false, label: null }],
    hints: ['What is given: heights and speeds, or times?', 'Speeds at two positions point to energy.'],
    cases: [{ src: 'Fixture §1.2', v: {}, want: { ans: 'energy' } }],
  }),
  tpl({
    id: 'f.1.formula',
    title: 'Speed as a formula',
    exam: 'u1',
    ch: '1',
    kind: 'numeric',
    vars: { a: range(1, 5, 1, 'm/s²'), t: range(1, 5, 1, 's') },
    text: (T) => `From rest, a cart accelerates at $${T.a}$ m/s² for $${T.t}$ s. Write v in symbols, then its value.`,
    parts: [
      { id: 'vsym', kind: 'symbolic', expr: 'a*t', vars: ['a', 't'], units: { a: 'm/s^2', t: 's' }, unit: 'm/s', get: ($) => $.a * $.t, alias: {}, label: 'v as a formula' },
      num('v', ($) => $.a * $.t, 'm/s', { label: 'speed', traps: [[($) => 0.5 * $.a * $.t * $.t, 'That is the distance, ½at².'], [($) => $.a / $.t, 'Speed grows with time: v = at, not a/t.']] }),
    ],
    hints: ['Constant acceleration from rest.', 'v = at.'],
    steps: ($, sig) => [`$v = at$.`, `$v = ${sig($.a * $.t)}$ m/s.`],
    cases: [{ src: 'Fixture §1.3', v: { a: 2, t: 3 }, want: { v: 6 } }],
  }),
  tpl({
    id: 'f.1.convert',
    title: 'Pounds to newtons',
    exam: 'u1',
    ch: '1',
    kind: 'numeric',
    vars: { F: range(1, 9, 1, 'lb') },
    text: (T) => `Convert $${T.F}$ lb to newtons.`,
    parts: [num('N', ($) => $.F * 4.4482216152605, 'N', { traps: [[($) => $.F / 4.4482216152605, 'Divided instead of multiplied.'], [($) => $.F * 9.81, 'A pound-force is 4.448 N, not g newtons.']] })],
    hints: ['One pound-force is 4.448 N.', 'Multiply.'],
    steps: ($, sig) => [`$F = ${sig($.F * 4.4482216152605)}$ N.`],
    cases: [{ src: 'Fixture §1.4', v: { F: 2 }, want: { N: 8.896443230521 } }],
  }),
  tpl({
    id: 'f.2.impulse',
    title: 'Impulse',
    exam: 'u2',
    ch: '2',
    kind: 'numeric',
    vars: { F: range(2, 9, 1, 'N'), t: range(1, 4, 1, 's') },
    text: (T) => `A force of $${T.F}$ N acts for $${T.t}$ s. Find the impulse.`,
    parts: [num('J', ($) => $.F * $.t, 'N·s', { traps: [[($) => $.F / $.t, 'Impulse is force times time.'], [($) => $.F, 'That is the force alone.']] })],
    hints: ['Impulse is the area under F against t.', 'J = Ft.'],
    steps: ($, sig) => [`$J = Ft = ${sig($.F * $.t)}$ N·s.`],
    cases: [{ src: 'Fixture §2.1', v: { F: 3, t: 2 }, want: { J: 6 } }],
  }),
  tpl({
    id: 'f.2.rest',
    title: 'At rest',
    exam: 'u2',
    ch: '2',
    kind: 'conceptual',
    text: () => 'A lamp hangs at rest. The net force on it is',
    parts: [{ id: 'ans', kind: 'choice', options: [{ value: 'zero', label: 'zero' }, { value: 'weight', label: 'its weight, down' }], correct: 'zero', multi: false, label: null }],
    hints: ['At rest means no acceleration.', 'ΣF = ma with a = 0.'],
    cases: [{ src: 'Fixture §2.2', v: {}, want: { ans: 'zero' } }],
  }),
];

/** Wrong-option explanations and one more hint, kept beside the bank as a course would. */
export const COACHING = {
  'f.1.which': {
    why: { ans: { newton: 'That works, but it takes two steps where energy takes one.', momentum: 'No time or force-over-time is given.', energy: 'Right: speeds at two heights.' } },
    hints: ['Energy skips the time entirely.'],
  },
  'f.2.rest': { why: { ans: { weight: 'The weight is one force; the cord pulls up as hard. They cancel.', zero: 'Right.' } } },
};

export const PROBLEMS = foldCoaching(applyPrincipleTags(BANK, PRINCIPLE_TAGS), COACHING);
export const CHAPTER_ORDER = ['1', '2'];
export const CHAPTER_TITLES = { 1: 'Particles', 2: 'Momentum' };
export const EXAMS = [
  { id: 'u1', n: 1, title: 'Particles', chapters: '1', labs: ['demo'] },
  { id: 'u2', n: 2, title: 'Momentum', chapters: '2', labs: ['demo'] },
];
export const LAB_META = { demo: { id: 'demo', exam: 'u1', title: 'Demo' } };
export const examById = (id) => EXAMS.find((e) => e.id === id) || EXAMS[0];

export function makeProgress(storage = memoryStorage()) {
  return coreProgress(createStore({ courseId: 'fixture', storage, slots: [{ name: 'problems', version: 1, key: 'flux.fixture.problems.v1' }, { name: 'exam', version: 1, key: 'flux.fixture.exam.v1' }] }));
}

/** Where the fixture's "notes" cover a problem: one section per chapter. */
export function sectionForProblem(t) {
  return { set: { exam: t.exam }, section: { id: `s${t.ch}`, n: Number(t.ch), title: CHAPTER_TITLES[t.ch] } };
}

/** The bank a course hands its practice panel, with every loop feature switched on. */
export function fullBank({ storage } = {}) {
  return {
    PROBLEMS,
    problemById: (id) => PROBLEMS.find((p) => p.id === id) || null,
    problemsForExam: (examId) => PROBLEMS.filter((p) => p.exam === examId),
    CHAPTER_ORDER,
    CHAPTER_TITLES,
    ...engine,
    createProgress: () => makeProgress(storage),
    pickSet: (t, p, o = {}) => corePickSet(t, p, { ...o, chapterOrder: CHAPTER_ORDER }),
    pickInterleave: (t, p, o = {}) => corePickInterleave(t, p, { ...o, chapterOrder: CHAPTER_ORDER }),
    MASTERED_BOX,
    INTERVAL_DAYS,
    examById,
    LAB_META,
    homeId: 'u1',
    PRINCIPLES,
    fading: true,
    sectionForProblem,
    labDrawer: true,
  };
}
