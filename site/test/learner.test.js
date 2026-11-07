import assert from 'node:assert/strict';
import test from 'node:test';
import { MASTERED_BOX as CORE_MASTERED_BOX, memoryStorage } from '@flux/core';
import { loadPaths } from '@flux/map/load.mjs';
import { courseStore as phyStore } from '@flux/phy2049/src/storage.js';
import { createLearner, DAILY_CAP, MASTERED_BOX, MAX_THREADS, SET_MAX } from '../src/learner/model.js';
import { phyExams, readItems } from '../src/learner/records.js';

const DAY = 864e5;
const NOW = Date.UTC(2026, 10, 6, 12);

/** A small map: a thread that crosses from calculus into E&M and skips a step, plus loose ends. */
const C = (id, subject, courses, requires = [], labs = []) => ({ id, title: id.toUpperCase(), subject, courses, requires, labs: labs.map((lab) => ({ course: courses[0], lab })) });
const concepts = [
  C('a', 'calculus', ['calc'], [], ['la']),
  C('b', 'em', ['phy'], ['a'], ['lb']),
  C('m', 'em', ['phy'], ['b'], []),
  C('c', 'em', ['phy'], ['m'], ['lc']),
  C('x', 'mechanics', ['phy'], ['a'], ['lx']),
  C('far', 'em', ['phy'], ['c'], ['lfar']),
  C('lone', 'stats', ['stat'], [], ['ll']),
  C('took', 'matsci', ['calc'], [], []),
  C('next', 'matsci', ['dyn'], ['took'], []),
  C('blocked', 'em', ['phy'], ['lone'], []),
  C('shared', 'mechanics', ['phy', 'dyn'], [], ['ls']),
];
const courses = [
  { id: 'calc', status: 'taken' },
  { id: 'phy', status: 'taking now' },
  { id: 'stat', status: 'taking now' },
  { id: 'dyn', status: 'next term' },
];
const keys = (course, lab, n) => Array.from({ length: n }, (_, i) => `${course}:${lab}${i}`);
const byLab = {
  'calc/la': keys('calc', 'la', 2),
  'phy/lb': keys('phy', 'lb', 2),
  'phy/lc': keys('phy', 'lc', 2),
  'phy/lx': keys('phy', 'lx', 1),
  'phy/lfar': keys('phy', 'lfar', 1),
  'stat/ll': keys('stat', 'll', 1),
  'phy/ls': keys('phy', 'ls', 2),
};
// `shared` also has Dynamics problems through a second lab; Dynamics is not started.
concepts.find((c) => c.id === 'shared').labs.push({ course: 'dyn', lab: 'ld' });
byLab['dyn/ld'] = keys('dyn', 'ld', 10);

const solid = (dueIn = 5) => ({ box: 4, due: NOW + dueIn * DAY, lastOk: true, last: NOW - DAY });
const due = (missed = false) => ({ box: 1, due: NOW - DAY, lastOk: !missed, last: NOW - 2 * DAY });

function learn(items, extra = {}) {
  return createLearner({ concepts, courses, byLab, items, now: NOW, ...extra });
}

test('the hub counts a problem solid at the box the course apps use', () => {
  assert.equal(MASTERED_BOX, CORE_MASTERED_BOX);
});

test('a concept is solid, learning, from a course you took, ready or not yet', () => {
  const l = learn({
    'calc:la0': solid(), 'calc:la1': solid(),
    'phy:lb0': solid(), 'phy:lb1': due(),
    'phy:ls0': solid(), 'phy:ls1': solid(),
  });
  assert.equal(l.status('a'), 'solid');
  assert.equal(l.status('b'), 'learning');
  assert.equal(l.status('took'), 'assumed', 'taken course, no practice');
  assert.equal(l.status('next'), 'ready', 'builds only on an assumed concept');
  assert.equal(l.status('x'), 'ready', 'builds on a solid concept, nothing tried');
  assert.equal(l.status('m'), 'locked', 'builds on a concept still learning');
  // Ten Dynamics problems sit on `shared`, but Dynamics is not started, so they do not count.
  assert.equal(l.status('shared'), 'solid');
  assert.equal(l.stats('shared').n, 2);
  assert.equal(l.stats('shared').all, 12);
});

test('reviews follow threads across subjects and name the concepts a link skips', () => {
  const l = learn({ 'calc:la0': due(), 'phy:lb0': due(), 'phy:lc0': due(), 'phy:lx0': due(true) });
  const threads = l.threads();
  assert.equal(threads.length, 1, 'one tree from a');
  const [t] = threads;
  assert.deepEqual(t.groups.map((g) => g.concept), ['a', 'b', 'c', 'x']);
  assert.deepEqual(t.subjects, ['calculus', 'em', 'mechanics']);
  const c = t.groups.find((g) => g.concept === 'c');
  assert.equal(c.parent.id, 'b');
  assert.deepEqual(c.parent.via, ['m'], 'c reaches b through m');
  assert.equal(t.groups.find((g) => g.concept === 'x').parent.id, 'a');
  assert.equal(t.missed, 1);
  assert.ok(t.today);
});

test('a due prerequisite three steps back joins the thread; four steps back does not', () => {
  const items = { 'phy:lb0': due(), 'phy:lfar0': due() };
  // far builds on c, c on m, m on b: three steps.
  const threads = learn(items).threads();
  assert.deepEqual(threads.map((t) => t.groups.map((g) => g.concept)), [['b', 'far']]);
  assert.deepEqual(threads[0].groups[1].parent.via, ['m', 'c'], 'from b down toward far');
  // Put one more concept between far and c, and far starts its own thread.
  const deeper = concepts.map((x) => (x.id === 'far' ? { ...x, requires: ['x2'] } : x));
  deeper.push(C('x2', 'em', ['phy'], ['c']));
  const l2 = createLearner({ concepts: deeper, courses, byLab, items, now: NOW });
  assert.equal(l2.threads().length, 2);
});

test('a thread too big for one sitting splits into its branches', () => {
  const big = { ...byLab, 'calc/la': keys('calc', 'la', 5), 'phy/lb': keys('phy', 'lb', 5), 'phy/lx': keys('phy', 'lx', 5) };
  const items = {};
  for (const k of [...big['calc/la'], ...big['phy/lb'], ...big['phy/lx']]) items[k] = due();
  const l = createLearner({ concepts, courses, byLab: big, items, now: NOW });
  const threads = l.threads();
  for (const t of threads) assert.ok(t.n <= SET_MAX || t.groups.length === 1, `${t.key}: ${t.n}`);
  assert.deepEqual(threads.flatMap((t) => t.groups.map((g) => g.concept)).sort(), ['a', 'b', 'x']);
});

test('today takes whole threads up to the caps, and a lone problem waits a day', () => {
  const l = learn({ 'calc:la0': due(), 'calc:la1': due(), 'stat:ll0': due() });
  const threads = l.threads();
  const lone = threads.find((t) => t.key === 'lone');
  assert.equal(lone.today, false, 'one problem, no miss, no exam');
  assert.equal(threads.find((t) => t.key === 'a').today, true);
  // Always at least one review, even a lone problem.
  assert.equal(learn({ 'stat:ll0': due() }).threads()[0].today, true);
  assert.ok(MAX_THREADS >= 1 && DAILY_CAP >= SET_MAX);
});

test('the nearest exam pulls its thread to the front', () => {
  const exams = [{ course: 'phy', n: 7, title: 'Seven', day: new Date(NOW + 3 * DAY), concepts: ['x'] }];
  const l = learn({ 'stat:ll0': due(true), 'phy:lx0': due() }, { exams });
  const [first] = l.threads();
  assert.equal(first.key, 'x');
  assert.equal(first.exam.n, 7);
});

test('learn next starts with the courses being taken', () => {
  const l = learn({ 'calc:la0': solid(), 'calc:la1': solid() });
  const next = l.nextUp(5);
  assert.ok(next.indexOf('x') < next.indexOf('next'), next.join(','));
});

test('the record is read from each course store, and applications are not practice', () => {
  const storage = memoryStorage();
  const store = phyStore(storage);
  store.writeJSON('problems', { v: 1, items: { 'e1.a': { box: 2, due: 5, lastOk: true }, broken: { box: 'x' } } });
  const items = readItems([{ courseId: 'phy2049', store }, { courseId: 'applications', store }]);
  assert.deepEqual(Object.keys(items), ['phy2049:e1.a']);
});

test('PHY 2049 exams match the units of its path that name them', async () => {
  const paths = Object.fromEntries((await loadPaths()).map(({ path }) => [path.course, path]));
  const exams = phyExams(paths, 2026);
  assert.ok(exams.length >= 6);
  for (const e of exams) {
    assert.ok(e.concepts.length, `Exam ${e.n}`);
    assert.equal(e.day.getFullYear(), 2026);
  }
  const six = exams.find((e) => e.n === 6);
  assert.equal(six.day.getMonth(), 10);
  assert.equal(six.day.getDate(), 6);
});
