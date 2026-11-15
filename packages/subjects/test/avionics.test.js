/**
 * Avionics models: rate-monotonic response-time analysis against an event-driven scheduler, and the
 * data budget's pass-by-pass account against stepping the store second by second.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { scheduleChecked, scheduleClosed } from '../src/design/scheduling.js';
import { dataChecked, dataClosed } from '../src/design/databudget.js';

const MS = 1000;
const TASKS = [
  { id: 'adcs', T: 100 * MS, C: 18 * MS },
  { id: 'cmd', T: 250 * MS, C: 20 * MS },
  { id: 'pay', T: 500 * MS, C: 90 * MS },
  { id: 'tlm', T: 1000 * MS, C: 120 * MS },
  { id: 'hk', T: 2000 * MS, C: 150 * MS },
];

test('Liu and Layland: the bound for n tasks falls toward ln 2', () => {
  const b = (n) => scheduleClosed(TASKS.slice(0, n)).bound;
  assert.equal(b(1), 1);
  assert.ok(Math.abs(b(2) - 0.8284) < 1e-4);
  assert.ok(b(5) > Math.LN2 && b(5) < b(2));
});

test('response-time analysis against the simulated scheduler, slower and slower', () => {
  for (const k of [0.5, 1, 1.2, 1.4, 1.5, 1.6, 2]) {
    const tasks = TASKS.map((t) => ({ ...t, C: Math.round(t.C * k) }));
    const c = scheduleChecked(tasks);
    assert.equal(c.gap, 0, `×${k}`);
  }
  // Past the bound, still schedulable: the bound is sufficient, not necessary.
  const slow = scheduleChecked(TASKS.map((t) => ({ ...t, C: Math.round(t.C * 1.5) })));
  assert.ok(slow.U > slow.bound && slow.misses.length === 0);
});

test('data budget: pass by pass against second by second', () => {
  for (const hkm of [400, 600]) {
    for (const k of [1, 3]) {
      for (const down of [9.6, 1000]) {
        const c = dataChecked({ hkm, eps: 10, k, payload: 25, house: 2, down });
        assert.ok(c.gap < 1e-3, `${hkm} km, k ${k}, ${down} kbit/s: gap ${c.gap}`);
      }
    }
  }
});

test('data budget: a store that keeps up repeats each day; one that cannot grows by made − sent', () => {
  const ok = dataClosed({ hkm: 500, eps: 10, k: 3, payload: 25, house: 2, down: 1000 });
  assert.ok(!ok.growing && Math.abs(ok.endOfDay[3] - ok.endOfDay[2]) < 1e-9);
  const bad = dataClosed({ hkm: 500, eps: 10, k: 1, payload: 25, house: 2, down: 1000 });
  assert.ok(bad.growing);
  assert.ok(Math.abs(bad.endOfDay[3] - bad.endOfDay[2] - (bad.made - bad.sent)) < 1e-6);
});
