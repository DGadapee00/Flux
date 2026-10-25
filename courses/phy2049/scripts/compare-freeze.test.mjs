import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { FREEZE } from './compare-freeze.mjs';

/** Run the freeze script in a fresh context shaped like a page: its own Date and Math, a window, a performance. */
function page() {
  const errors = [];
  const window = {};
  const performance = {};
  const document = { addEventListener() {}, createElement: () => ({}), head: { append() {} } };
  const context = vm.createContext({ window, performance, document, console: { error: (e) => errors.push(String(e)) } });
  vm.runInContext(FREEZE, context);
  return { window, performance, errors, run: (code) => vm.runInContext(code, context) };
}

test('performance.now stands still until __advance moves it, in 16 ms frames', () => {
  const p = page();
  assert.equal(p.performance.now(), 0);
  p.window.__advance(32);
  assert.equal(p.performance.now(), 32);
  p.window.__advance(1);
  assert.equal(p.performance.now(), 48, 'a partial frame still runs a whole one');
});

test('Date.now follows the virtual clock', () => {
  const p = page();
  const start = p.run('Date.now()');
  p.window.__advance(160);
  assert.equal(p.run('Date.now()') - start, 160);
});

test('requestAnimationFrame callbacks run once per frame, with the frame time', () => {
  const p = page();
  const seen = [];
  p.window.requestAnimationFrame((t) => seen.push(t));
  assert.deepEqual(seen, [], 'nothing runs before the clock moves');
  p.window.__advance(48);
  assert.deepEqual(seen, [16], 'a callback runs once unless it asks again');
  const again = [];
  const loop = (t) => {
    again.push(t);
    p.window.requestAnimationFrame(loop);
  };
  p.window.requestAnimationFrame(loop);
  p.window.__advance(48);
  assert.deepEqual(again, [64, 80, 96]);
});

test('cancelAnimationFrame removes a queued callback', () => {
  const p = page();
  let ran = 0;
  const id = p.window.requestAnimationFrame(() => (ran += 1));
  p.window.cancelAnimationFrame(id);
  p.window.__advance(32);
  assert.equal(ran, 0);
});

test('a callback that throws does not stop the others', () => {
  const p = page();
  let ran = false;
  p.window.requestAnimationFrame(() => {
    throw new Error('boom');
  });
  p.window.requestAnimationFrame(() => (ran = true));
  p.window.__advance(16);
  assert.equal(ran, true);
  assert.equal(p.errors.length, 1);
});

test('Math.random is seeded, in [0, 1), and the same in every page', () => {
  const a = page();
  const b = page();
  const draw = (p) => Array.from({ length: 5 }, () => p.run('Math.random()'));
  const first = draw(a);
  assert.deepEqual(draw(b), first);
  for (const x of first) assert.ok(x >= 0 && x < 1);
  assert.equal(new Set(first).size, 5);
});
