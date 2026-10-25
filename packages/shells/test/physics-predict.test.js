import assert from 'node:assert/strict';
import test from 'node:test';
import { renderChrome } from '../physics/chrome.js';
import { createPredict } from '../physics/predict.js';
import { installDOM } from './dom.js';

const PROMPT = {
  id: 'p1',
  scenario: 'base',
  ask: 'Double the speed.',
  watch: [{ id: 'range', label: 'the range', get: () => 1 }],
  mode: 'dir',
  expect: { range: 'bigger' },
  why: 'Range grows with the square of speed.',
};

function page() {
  installDOM();
  document.body.innerHTML = '<div id="app"></div>';
  renderChrome(document.getElementById('app'), { code: 'FIX 1000', setupHint: '', unitName: 'Unit' });
}

/** An in-memory store with the getItem/setItem shape of a course's storage. */
function memoryStore(initial = {}) {
  const bag = new Map(Object.entries(initial));
  const writes = [];
  return {
    getItem: (key) => (bag.has(key) ? bag.get(key) : null),
    setItem: (key, value) => {
      writes.push([key, value]);
      bag.set(key, value);
    },
    writes,
  };
}

function deps(extra = {}) {
  return {
    predictionsFor: (labId) => (labId === 'a' ? [PROMPT] : []),
    store: memoryStore(),
    run: () => ({ before: {}, after: {} }),
    outcomes: () => ({}),
    choices: () => [],
    matchesExpect: () => true,
    cloneState: (s) => structuredClone(s),
    ...extra,
  };
}

function api(state = { labId: 'a' }) {
  return {
    labId: () => state.labId,
    practiceActive: () => false,
    slice: () => ({}),
    lab: () => null,
    bump() {},
    setScenario() {},
  };
}

test('predict is inert when a lab has no predictions', () => {
  page();
  const d = deps();
  const state = { labId: 'none' };
  const predict = createPredict(api(state), d);
  assert.doesNotThrow(() => predict.sync());
  state.labId = 'other';
  assert.doesNotThrow(() => predict.sync());
  assert.equal(d.store.writes.length, 0);
});

test('predict writes its tally through the store it is given, under the key predict', () => {
  page();
  const d = deps();
  const state = { labId: 'a' };
  const predict = createPredict(api(state), d);
  predict.sync();
  state.labId = 'b';
  predict.sync();
  assert.equal(d.store.writes.length, 1);
  const [key, value] = d.store.writes[0];
  assert.equal(key, 'predict');
  assert.equal(JSON.parse(value).seen.a, true);
});

test('predict starts from the tally already in the store', () => {
  page();
  const saved = { v: 1, items: { p1: { right: true } }, seen: { a: true } };
  const d = deps({ store: memoryStore({ predict: JSON.stringify(saved) }) });
  const predict = createPredict(api(), d);
  assert.equal(predict.tally.items.p1.right, true);
  assert.equal(predict.tally.seen.a, true);
});

test('predict treats an unreadable tally as empty', () => {
  page();
  const d = deps({ store: { getItem: () => '{not json', setItem() {} } });
  const predict = createPredict(api(), d);
  assert.deepEqual(predict.tally, { v: 1, items: {}, seen: {} });
});
