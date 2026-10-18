/**
 * Each course: read the legacy key once, dual-write until the cutoff, then export, clear, import.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { DUAL_WRITE_UNTIL } from '@flux/core';
import { createProgress as macProgress, memoryStorage as macMemory } from '../courses/mac2313/src/problems/progress.js';
import {
  EXAM_KEY as MAC_EXAM,
  LEGACY_EXAM_KEY as MAC_LEGACY_EXAM,
  LEGACY_STORE_KEY as MAC_LEGACY,
  STORE_KEY as MAC_STORE,
  courseStore as macStore,
} from '../courses/mac2313/src/storage.js';
import { createProgress as phyProgress, memoryStorage as phyMemory } from '../courses/phy2049/src/problems/progress.js';
import {
  EXAM_KEY as PHY_EXAM,
  FULL_KEY,
  LEGACY_EXAM_KEY as PHY_LEGACY_EXAM,
  LEGACY_FULL_KEY,
  LEGACY_PREDICT_KEY,
  LEGACY_STORE_KEY as PHY_LEGACY,
  LEGACY_WIDTH_KEY,
  PREDICT_KEY,
  STORE_KEY as PHY_STORE,
  WIDTH_KEY,
  courseStore as phyStore,
} from '../courses/phy2049/src/storage.js';
import { createProgress as staProgress, memoryStorage as staMemory } from '../courses/sta3032/src/problems/progress.js';
import {
  EXAM_KEY as STA_EXAM,
  LEGACY_EXAM_KEY as STA_LEGACY_EXAM,
  LEGACY_STORE_KEY as STA_LEGACY,
  LEGACY_TALLY_KEY,
  STORE_KEY as STA_STORE,
  TALLY_KEY,
  courseStore as staStore,
} from '../courses/sta3032/src/storage.js';
import { createProgress as dynamicsProgress, memoryStorage as dynamicsMemory } from '../courses/egn3321/src/problems/progress.js';
import {
  EXAM_KEY as DYN_EXAM,
  FULL_KEY as DYN_FULL,
  STORE_KEY as DYN_STORE,
  WIDTH_KEY as DYN_WIDTH,
  courseStore as dynamicsStore,
} from '../courses/egn3321/src/storage.js';
import { createProgress as thermoProgress, memoryStorage as thermoMemory } from '../courses/eml3100/src/problems/progress.js';
import {
  EXAM_KEY as THERMO_EXAM,
  FULL_KEY as THERMO_FULL,
  STORE_KEY as THERMO_STORE,
  WIDTH_KEY as THERMO_WIDTH,
  courseStore as thermoStore,
} from '../courses/eml3100/src/storage.js';
import { createProgress as materialsProgress, memoryStorage as materialsMemory } from '../courses/egn3331/src/problems/progress.js';
import {
  EXAM_KEY as MATERIALS_EXAM,
  FULL_KEY as MATERIALS_FULL,
  STORE_KEY as MATERIALS_STORE,
  WIDTH_KEY as MATERIALS_WIDTH,
  courseStore as materialsStore,
} from '../courses/egn3331/src/storage.js';
import { createProgress as staticsProgress, memoryStorage as staticsMemory } from '../courses/statics/src/problems/progress.js';
import {
  EXAM_KEY as STATICS_EXAM,
  LEGACY_EXAM_KEY as STATICS_LEGACY_EXAM,
  LEGACY_STORE_KEY as STATICS_LEGACY,
  STORE_KEY as STATICS_STORE,
  courseStore as staticsStore,
} from '../courses/statics/src/storage.js';

const BEFORE = () => DUAL_WRITE_UNTIL - 1;

function wipe(storage, keys) {
  for (const key of keys) storage.removeItem(key);
}

function roundTrip({ name, createProgress, memoryStorage, courseStore, problemsKey, legacyProblems, examKey, legacyExam, extras = [] }) {
  test(`${name}: legacy read, dual-write, export and import`, () => {
    const storage = memoryStorage();
    const saved = {
      v: 1,
      items: {
        'item.one': { attempts: 1, solved: 1, clean: 1, peeks: 0, hints: 0, box: 2, due: 50, last: 10, lastSeed: 0, lastOk: true },
      },
    };
    storage.setItem(legacyProblems, JSON.stringify(saved));
    storage.setItem(legacyExam, JSON.stringify({ id: 'mid' }));
    const progress = createProgress(storage, { now: BEFORE });
    assert.equal(progress.get('item.one').box, 2);
    assert.deepEqual(progress.loadExam(), { id: 'mid' });
    assert.equal(storage.getItem(problemsKey), storage.getItem(legacyProblems));

    progress.record('item.two', { correct: true, clean: true, now: 1000 });
    progress.saveExam({ id: 'final', n: 4 });
    assert.equal(storage.getItem(problemsKey), storage.getItem(legacyProblems));
    assert.equal(storage.getItem(examKey), storage.getItem(legacyExam));
    assert.equal(progress.get('item.two').box, 1);

    const store = courseStore(storage, BEFORE);
    for (const extra of extras) {
      store.setItem(extra.slot, extra.value);
      assert.equal(storage.getItem(extra.key), extra.value);
      assert.equal(storage.getItem(extra.legacy), extra.value);
    }

    const blob = progress.exportJSON();
    const snap = JSON.parse(JSON.stringify(progress.data));
    const examSnap = progress.loadExam();
    wipe(storage, [problemsKey, legacyProblems, examKey, legacyExam, ...extras.flatMap((extra) => [extra.key, extra.legacy])]);
    const cleared = createProgress(storage, { now: BEFORE });
    assert.equal(cleared.get('item.one'), null);
    assert.equal(cleared.loadExam(), null);
    cleared.importJSON(blob);
    assert.deepEqual(cleared.data, snap);
    assert.deepEqual(cleared.loadExam(), examSnap);
    for (const extra of extras) assert.equal(courseStore(storage, BEFORE).getItem(extra.slot), extra.value);

    const lateStorage = memoryStorage();
    lateStorage.setItem(legacyProblems, JSON.stringify(saved));
    const late = createProgress(lateStorage, { now: () => DUAL_WRITE_UNTIL });
    const legacyBefore = lateStorage.getItem(legacyProblems);
    late.record('item.three', { correct: false, now: 2000 });
    assert.equal(lateStorage.getItem(legacyProblems), legacyBefore);
    assert.match(lateStorage.getItem(problemsKey), /item\.three/);
    assert.throws(() => cleared.importJSON({ v: 1, courseId: 'other', keys: {} }));
  });
}

roundTrip({
  name: 'phy2049',
  createProgress: phyProgress,
  memoryStorage: phyMemory,
  courseStore: phyStore,
  problemsKey: PHY_STORE,
  legacyProblems: PHY_LEGACY,
  examKey: PHY_EXAM,
  legacyExam: PHY_LEGACY_EXAM,
  extras: [
    { slot: 'predict', key: PREDICT_KEY, legacy: LEGACY_PREDICT_KEY, value: '{"v":1,"items":{}}' },
    { slot: 'notes.width', key: WIDTH_KEY, legacy: LEGACY_WIDTH_KEY, value: '480' },
    { slot: 'notes.full', key: FULL_KEY, legacy: LEGACY_FULL_KEY, value: '1' },
  ],
});

roundTrip({
  name: 'mac2313',
  createProgress: macProgress,
  memoryStorage: macMemory,
  courseStore: macStore,
  problemsKey: MAC_STORE,
  legacyProblems: MAC_LEGACY,
  examKey: MAC_EXAM,
  legacyExam: MAC_LEGACY_EXAM,
});

roundTrip({
  name: 'statics',
  createProgress: staticsProgress,
  memoryStorage: staticsMemory,
  courseStore: staticsStore,
  problemsKey: STATICS_STORE,
  legacyProblems: STATICS_LEGACY,
  examKey: STATICS_EXAM,
  legacyExam: STATICS_LEGACY_EXAM,
});

roundTrip({
  name: 'sta3032',
  createProgress: staProgress,
  memoryStorage: staMemory,
  courseStore: staStore,
  problemsKey: STA_STORE,
  legacyProblems: STA_LEGACY,
  examKey: STA_EXAM,
  legacyExam: STA_LEGACY_EXAM,
  extras: [{ slot: 'labs', key: TALLY_KEY, legacy: LEGACY_TALLY_KEY, value: '{"sampling":{"p1":{"right":1}}}' }],
});

test('egn3321: export and import with no legacy key', () => {
  const storage = dynamicsMemory();
  const progress = dynamicsProgress(storage, { now: () => 0 });
  progress.record('u1.12.polynomial', { correct: true, clean: true, now: 1000 });
  progress.saveExam({ id: 'u1', n: 1 });
  dynamicsStore(storage, () => 0).setItem('notes.width', '480');
  dynamicsStore(storage, () => 0).setItem('notes.full', '1');
  assert.match(storage.getItem(DYN_STORE), /u1\.12\.polynomial/);
  assert.equal(storage.getItem('flux-egn3321.problems.v1'), null);

  const blob = progress.exportJSON();
  for (const key of [DYN_STORE, DYN_EXAM, DYN_WIDTH, DYN_FULL]) storage.removeItem(key);
  const cleared = dynamicsProgress(storage, { now: () => 0 });
  assert.equal(cleared.get('u1.12.polynomial'), null);
  assert.equal(cleared.loadExam(), null);
  cleared.importJSON(blob);
  assert.equal(cleared.get('u1.12.polynomial').box, 1);
  assert.deepEqual(cleared.loadExam(), { id: 'u1', n: 1 });
  const restored = dynamicsStore(storage, () => 0);
  assert.equal(restored.getItem('notes.width'), '480');
  assert.equal(restored.getItem('notes.full'), '1');
  assert.throws(() => cleared.importJSON({ v: 1, courseId: 'other', keys: {} }), /does not match this course/);
  assert.equal(cleared.get('u1.12.polynomial').box, 1);
});

test('eml3100: export and import with no legacy key', () => {
  const storage = thermoMemory();
  const progress = thermoProgress(storage, { now: () => 0 });
  progress.record('u1.2.phase', { correct: true, clean: true, now: 1000 });
  progress.saveExam({ id: 'u2', n: 2 });
  thermoStore(storage, () => 0).setItem('notes.width', '520');
  thermoStore(storage, () => 0).setItem('notes.full', '1');
  assert.equal(THERMO_STORE, 'flux.eml3100.problems.v1');
  assert.match(storage.getItem(THERMO_STORE), /u1\.2\.phase/);

  const blob = progress.exportJSON();
  for (const key of [THERMO_STORE, THERMO_EXAM, THERMO_WIDTH, THERMO_FULL]) storage.removeItem(key);
  const cleared = thermoProgress(storage, { now: () => 0 });
  assert.equal(cleared.get('u1.2.phase'), null);
  cleared.importJSON(blob);
  assert.equal(cleared.get('u1.2.phase').box, 1);
  assert.deepEqual(cleared.loadExam(), { id: 'u2', n: 2 });
  const restored = thermoStore(storage, () => 0);
  assert.equal(restored.getItem('notes.width'), '520');
  assert.equal(restored.getItem('notes.full'), '1');
});

test('egn3331: export and import with no legacy key', () => {
  const storage = materialsMemory();
  const progress = materialsProgress(storage, { now: () => 0 });
  progress.record('u1.1.inclined', { correct: true, clean: true, now: 1000 });
  progress.saveExam({ id: 'u1', n: 1 });
  materialsStore(storage, () => 0).setItem('notes.width', '520');
  materialsStore(storage, () => 0).setItem('notes.full', '1');
  assert.equal(MATERIALS_STORE, 'flux.egn3331.problems.v1');
  assert.match(storage.getItem(MATERIALS_STORE), /u1\.1\.inclined/);

  const blob = progress.exportJSON();
  for (const key of [MATERIALS_STORE, MATERIALS_EXAM, MATERIALS_WIDTH, MATERIALS_FULL]) storage.removeItem(key);
  const cleared = materialsProgress(storage, { now: () => 0 });
  assert.equal(cleared.get('u1.1.inclined'), null);
  cleared.importJSON(blob);
  assert.equal(cleared.get('u1.1.inclined').box, 1);
  assert.deepEqual(cleared.loadExam(), { id: 'u1', n: 1 });
  const restored = materialsStore(storage, () => 0);
  assert.equal(restored.getItem('notes.width'), '520');
  assert.equal(restored.getItem('notes.full'), '1');
});
