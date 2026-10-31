import assert from 'node:assert/strict';
import test from 'node:test';
import { courseStore, memoryStorage, STORE_KEY, EXAM_KEY, MERGE_KEY } from '../src/storage.js';
const original = 'flux.mac2312.problems.v1',
  oldExam = 'flux.mac2312.exam.v1';
const row = (last, box = 2) => ({
  attempts: 3,
  solved: 2,
  clean: 1,
  hints: 2,
  box,
  due: 1234,
  last,
  lastSeed: 7,
  lastOk: true,
});
const put = (storage, key, value) => storage.setItem(key, JSON.stringify(value));
const state = (items) => ({ v: 1, items });

test('empty storage remains empty; a blocked backend cannot prevent startup', () => {
  const storage = memoryStorage();
  courseStore(storage);
  assert.equal(storage.getItem(MERGE_KEY), null);
  assert.doesNotThrow(() =>
    courseStore({
      getItem() {
        throw Error('blocked');
      },
      setItem() {
        throw Error('blocked');
      },
    }),
  );
});
test('I and II identifiers stay distinct and full review records survive', () => {
  const s = memoryStorage();
  put(s, STORE_KEY, state({ 'u2.sym.anti': row(10) }));
  put(s, original, state({ 'u2.sym.anti': row(20, 4) }));
  const source = s.getItem(original),
    merged = courseStore(s).readJSON('problems');
  assert.deepEqual(merged.items['u2.sym.anti'], row(10));
  assert.deepEqual(merged.items['ii.u2.sym.anti'], row(20, 4));
  assert.equal(s.getItem(original), source);
});
test('reopening never adds attempts or resets a newer merged review', () => {
  const s = memoryStorage();
  put(s, original, state({ 'u1.vol.disk': row(20) }));
  courseStore(s);
  const once = s.getItem(STORE_KEY);
  courseStore(s);
  assert.equal(s.getItem(STORE_KEY), once);
  put(s, STORE_KEY, state({ 'ii.u1.vol.disk': row(50, 5) }));
  put(s, original, state({ 'u1.vol.disk': row(30, 1) }));
  assert.deepEqual(courseStore(s).readJSON('problems').items['ii.u1.vol.disk'], row(50, 5));
});
test('restoring a pre-merge backup after migration imports II again', () => {
  const s = memoryStorage();
  put(s, original, state({ 'u1.vol.disk': row(20) }));
  courseStore(s);
  const marker = s.getItem(MERGE_KEY);
  put(s, STORE_KEY, state({ 'u1.lim.poly': row(11) }));
  assert.equal(s.getItem(MERGE_KEY), marker);
  const merged = courseStore(s).readJSON('problems');
  assert.deepEqual(merged.items['ii.u1.vol.disk'], row(20));
  assert.deepEqual(merged.items['u1.lim.poly'], row(11));
});
test('an in-progress II practice exam retains seeds, typed answers and timing', () => {
  const s = memoryStorage(),
    exam = {
      examId: 'u3',
      items: [{ id: 'u3.tay.line', seed: 71, inputs: { slope: '2/3' } }],
      i: 0,
      startedAt: 10,
      endsAt: 500,
      done: false,
    };
  put(s, oldExam, exam);
  const moved = courseStore(s).readJSON('exam');
  assert.equal(moved.examId, 'c6');
  assert.equal(moved.items[0].id, 'ii.u3.tay.line');
  assert.equal(moved.items[0].seed, 71);
  assert.deepEqual(moved.items[0].inputs, exam.items[0].inputs);
  assert.equal(moved.endsAt, 500);
  assert.deepEqual(JSON.parse(s.getItem(oldExam)), exam);
  courseStore(s);
  assert.deepEqual(JSON.parse(s.getItem(EXAM_KEY)), moved);
});
test('an existing I exam is preserved while the II backup slot stays intact', () => {
  const s = memoryStorage();
  put(s, EXAM_KEY, { examId: 'u2', items: [{ id: 'u2.power', seed: 9, inputs: { x: '4' } }] });
  put(s, oldExam, { examId: 'u4', items: [{ id: 'u4.pol.disk', seed: 2 }] });
  const source = s.getItem(oldExam),
    store = courseStore(s);
  assert.equal(store.readJSON('exam').examId, 'c1');
  assert.equal(store.readJSON('exam').items[0].id, 'u2.power');
  assert.equal(s.getItem(oldExam), source);
});
test('note preferences fill missing settings and survive a merged backup round trip', () => {
  const s = memoryStorage();
  s.setItem('flux.mac2312.notes.width.v1', '640');
  s.setItem('flux.mac2312.notes.full.v1', 'true');
  s.setItem('flux.mac2311.notes.width.v1', '720');
  put(s, original, state({ 'u1.vol.disk': row(20) }));
  const store = courseStore(s);
  assert.equal(store.getItem('notes.width'), '720');
  assert.equal(store.getItem('notes.full'), 'true');
  const fresh = courseStore(memoryStorage());
  fresh.importJSON(store.exportJSON());
  assert.deepEqual(fresh.readJSON('problems'), store.readJSON('problems'));
});
test('unreadable source or target histories are left untouched', () => {
  for (const key of [STORE_KEY, original]) {
    const s = memoryStorage();
    put(s, STORE_KEY, state({ saved: row(10) }));
    put(s, original, state({ old: row(20) }));
    s.setItem(key, '{broken');
    const before = [s.getItem(STORE_KEY), s.getItem(original)];
    courseStore(s);
    assert.deepEqual([s.getItem(STORE_KEY), s.getItem(original)], before);
    assert.equal(s.getItem(MERGE_KEY), null);
  }
});
test('failed writes do not mark migration complete, and a later retry succeeds', () => {
  const s = memoryStorage();
  put(s, original, state({ 'u1.vol.disk': row(20) }));
  let fail = true;
  const guarded = {
    ...s,
    setItem(key, value) {
      if (fail && key === STORE_KEY) throw Error('full');
      s.setItem(key, value);
    },
  };
  courseStore(guarded);
  assert.equal(s.getItem(MERGE_KEY), null);
  fail = false;
  assert.ok(courseStore(guarded).readJSON('problems').items['ii.u1.vol.disk']);
});
