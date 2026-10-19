import assert from 'node:assert/strict';
import test from 'node:test';
import { createLabLoader } from '../src/labs/load.js';
import { exportBundle, importBundle, parseProgressText } from '../src/progress/files.js';
import { createStore, memoryStorage, storageKey } from '../src/storage.js';
import { createLabRouter } from '../src/shell/lab-route.js';
import { createModesRouter } from '../src/shell/modes-route.js';

const exams = [
  { id: 'u1', labs: ['alpha'] },
  { id: 'u2', labs: ['beta', 'gamma'] },
];
const labMeta = {
  alpha: { exam: 'u1' },
  beta: { exam: 'u2' },
  gamma: { exam: 'u2' },
};
const examById = (id) => exams.find((exam) => exam.id === id) || exams[0];

test('a lab route keeps a negative seed only when the course allows it', () => {
  const open = createLabRouter({
    courseId: 'demo',
    exams,
    labMeta,
    examById,
    seedFloor: -99,
    emptyRoute: () => ({ examId: 'u1', labId: 'alpha' }),
  });
  const kept = open.parseRoute('#/demo/u2/beta?p=sheet&s=-5');
  assert.equal(kept.seed, -5);
  assert.equal(kept.legacy, false);
  assert.equal(kept.query, '?p=sheet&s=-5');

  const clamped = createLabRouter({
    courseId: 'demo',
    exams,
    labMeta,
    examById,
    emptyRoute: () => ({ examId: 'u2', labId: 'beta' }),
  });
  assert.equal(clamped.parseRoute('#/u2/beta?p=sheet&s=-5').seed, 0);
  assert.equal(clamped.parseRoute('#/beta').legacy, true);
  assert.equal(clamped.parseRoute('').examId, 'u2');
  assert.equal(clamped.courseHash('u2', 'gamma', '?p=a'), '#/demo/u2/gamma?p=a');
});

test('a lab route reads ?n= as a notes section and keeps it apart from ?p=', () => {
  const router = createLabRouter({
    courseId: 'demo',
    exams,
    labMeta,
    examById,
    emptyRoute: () => ({ examId: 'u1', labId: 'alpha' }),
  });
  const notes = router.parseRoute('#/demo/u2/gamma?n=s3');
  assert.equal(notes.notes, 's3');
  assert.equal(notes.problemId, null);
  assert.equal(notes.examId, 'u2');
  assert.equal(notes.labId, 'gamma');
  assert.equal(router.parseRoute('#/demo/u2/gamma').notes, null);
  assert.equal(router.parseRoute('#/demo/u2?p=x&s=4&n=s1').notes, 's1');
  assert.equal(router.parseRoute('#/beta?n=s2').notes, 's2');
});

test('a retired mode opens practice and is legacy', () => {
  const units = [{ id: 'mid' }, { id: 'final' }];
  const router = createModesRouter({
    courseId: 'demo',
    modes: ['practice', 'explore', 'tables', 'exam'],
    unitById: (id) => units.find((unit) => unit.id === id) || null,
    nextUnit: () => units[0],
    retired: ['notes'],
  });
  const notes = router.parseHash('#/demo/mid/notes/5');
  assert.equal(notes.legacy, true);
  assert.equal(notes.mode, 'practice');
  assert.equal(notes.unitId, 'mid');
  const lab = router.parseHash('#/final/explore/dist?sc=heights');
  assert.equal(lab.labId, 'dist');
  assert.equal(lab.scenario, 'heights');
  assert.equal(lab.legacy, true);
  assert.equal(router.hashFor({ unitId: 'final', mode: 'explore', labId: 'dist', scenario: 'heights' }), '#/demo/final/explore/dist?sc=heights');
});

test('the lab loader caches a module and ignores an unknown id', async () => {
  let calls = 0;
  const loader = createLabLoader({
    alpha: async () => {
      calls += 1;
      return { default: { id: 'alpha' } };
    },
  });
  assert.equal(loader.hasLab('alpha'), true);
  assert.equal(loader.hasLab('missing'), false);
  assert.equal((await loader.loadLab('alpha')).id, 'alpha');
  assert.equal((await loader.loadLab('alpha')).id, 'alpha');
  assert.equal(calls, 1);
  assert.equal(await loader.loadLab('missing'), null);
  loader.registerLabLoader('beta', async () => ({ default: { id: 'beta' } }));
  assert.deepEqual(await loader.loadExamLabs(['missing', 'beta']), [{ id: 'beta' }]);
});

function demoStore(storage, courseId) {
  return createStore({
    courseId,
    storage,
    slots: [{ name: 'problems', version: 1, key: storageKey(courseId, 'problems', 1) }],
    now: () => 0,
  });
}

test('a hub backup round-trips each course and rejects a wrong id before writing', () => {
  const first = memoryStorage();
  const second = memoryStorage();
  const parts = [
    { courseId: 'one', store: demoStore(first, 'one') },
    { courseId: 'two', store: demoStore(second, 'two') },
  ];
  parts[0].store.writeJSON('problems', { box: 1 });
  parts[1].store.writeJSON('problems', { box: 2 });
  const blob = exportBundle(parts);

  const restoredA = memoryStorage();
  const restoredB = memoryStorage();
  const next = [
    { courseId: 'one', store: demoStore(restoredA, 'one') },
    { courseId: 'two', store: demoStore(restoredB, 'two') },
  ];
  importBundle(blob, next);
  assert.deepEqual(next[0].store.readJSON('problems'), { box: 1 });
  assert.deepEqual(next[1].store.readJSON('problems'), { box: 2 });

  const wrong = structuredClone(blob);
  wrong.courses.one.courseId = 'two';
  const untouched = memoryStorage();
  const target = [{ courseId: 'one', store: demoStore(untouched, 'one') }, { courseId: 'two', store: demoStore(untouched, 'two') }];
  assert.throws(() => importBundle(wrong, target), /does not match this course/);
  assert.equal(target[0].store.readJSON('problems'), null);
  assert.throws(() => importBundle({ v: 1, courseId: 'one', keys: {} }, target), /does not match this backup/);
  assert.throws(() => parseProgressText('not json'), /not progress JSON/);
});
