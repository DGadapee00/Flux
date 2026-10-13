import assert from 'node:assert/strict';
import test from 'node:test';
import { DUAL_WRITE_UNTIL, createStore, memoryStorage, storageKey } from '../src/storage.js';

const KEY = storageKey('demo', 'problems', 1);
const LEGACY = 'flux-demo.problems.v1';
const SLOTS = [{ name: 'problems', version: 1, key: KEY, legacy: LEGACY }];

test('storageKey builds flux.<id>.<name>.v<n>', () => {
  assert.equal(storageKey('demo', 'problems', 1), 'flux.demo.problems.v1');
  assert.equal(storageKey('demo', 'notes.width', 2), 'flux.demo.notes.width.v2');
  assert.throws(() => storageKey('Demo', 'problems', 1));
  assert.throws(() => storageKey('demo', 'Problems', 1));
  assert.throws(() => storageKey('demo', 'problems', 0));
});

test('a missing new key is copied once from the legacy key', () => {
  const storage = memoryStorage();
  storage.setItem(LEGACY, '{"v":1}');
  const store = createStore({ courseId: 'demo', storage, slots: SLOTS, now: () => 0 });
  assert.equal(store.getItem('problems'), '{"v":1}');
  assert.equal(storage.getItem(KEY), '{"v":1}');
  storage.setItem(LEGACY, '{"v":2}');
  assert.equal(store.getItem('problems'), '{"v":1}');
});

test('writes go to the legacy key through 15 Dec 2026 and stop after', () => {
  const before = memoryStorage();
  const early = createStore({ courseId: 'demo', storage: before, slots: SLOTS, now: () => DUAL_WRITE_UNTIL - 1 });
  early.setItem('problems', '{"box":1}');
  assert.equal(before.getItem(KEY), '{"box":1}');
  assert.equal(before.getItem(LEGACY), '{"box":1}');
  early.setItem('problems', null);
  assert.equal(before.getItem(KEY), null);
  assert.equal(before.getItem(LEGACY), null);

  const after = memoryStorage();
  after.setItem(LEGACY, '{"box":0}');
  const late = createStore({ courseId: 'demo', storage: after, slots: SLOTS, now: () => DUAL_WRITE_UNTIL });
  late.setItem('problems', '{"box":2}');
  assert.equal(after.getItem(KEY), '{"box":2}');
  assert.equal(after.getItem(LEGACY), '{"box":0}');
});

test('export then import restores every slot', () => {
  const slots = [
    ...SLOTS,
    { name: 'exam', version: 1, key: storageKey('demo', 'exam', 1) },
  ];
  const storage = memoryStorage();
  const store = createStore({ courseId: 'demo', storage, slots, now: () => 0 });
  store.writeJSON('problems', { v: 1, items: { a: { box: 3 } } });
  store.setItem('exam', 'saved');
  const blob = store.exportJSON();
  const fresh = memoryStorage();
  const restored = createStore({ courseId: 'demo', storage: fresh, slots, now: () => 0 });
  restored.importJSON(blob);
  assert.deepEqual(restored.readJSON('problems'), { v: 1, items: { a: { box: 3 } } });
  assert.equal(restored.getItem('exam'), 'saved');
  assert.throws(() => restored.importJSON({ v: 1, courseId: 'other', keys: {} }));
});

test('a null storage does not throw', () => {
  const store = createStore({ courseId: 'demo', storage: null, slots: SLOTS });
  assert.equal(store.getItem('problems'), null);
  store.setItem('problems', '{}');
  assert.equal(store.exportJSON().keys.problems, null);
});
