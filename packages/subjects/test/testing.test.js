/**
 * Environmental test levels and thermal vacuum cycling: GEVS's own overall levels, the closed forms
 * against their numeric checks, and the scalings the labs teach.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { SPECTRA, grmsClosed, grmsNumeric, testChecked } from '../src/mechanics/testlevels.js';
import { tvacChecked, transitionClosed, transitionStepped } from '../src/heat/tvac.js';

test('the GEVS spectra give GEVS’s overall levels', () => {
  assert.ok(Math.abs(grmsClosed(SPECTRA.generalized) - 10.0) < 0.05);
  assert.ok(Math.abs(grmsClosed(SPECTRA.generalized, 2) - 14.1) < 0.05);
  assert.ok(Math.abs(grmsClosed(SPECTRA.workmanship) - 6.8) < 0.05);
});

test('the closed overall level matches Simpson’s rule', () => {
  for (const s of Object.values(SPECTRA)) for (const k of [1, 2]) assert.ok(Math.abs(grmsNumeric(s, k) / grmsClosed(s, k) - 1) < 1e-4);
});

test('3 dB up raises the level by √2 and each minute’s damage by 2^(b/2)', () => {
  const a = testChecked({ spectrum: 'generalized', program: 'acceptance', fn: 200, Q: 10, flightMin: 1 });
  const q = testChecked({ spectrum: 'generalized', program: 'protoflight', fn: 200, Q: 10, flightMin: 1 });
  assert.ok(Math.abs(q.grms / a.grms - Math.SQRT2) < 1e-9);
  assert.ok(Math.abs(a.lifeMin / q.lifeMin - 2 ** 3.2) < 1e-6);
});

test('the radiative transition’s closed form matches RK4', () => {
  const art = { m: 12, A: 0.27, eps: 0.9, Q: 10 };
  for (const [T0, T1, od] of [[263.15, 333.15, 20], [333.15, 263.15, 30], [263.15, 333.15, 80]]) {
    const c = transitionClosed(art, T0, T1, od);
    const s = transitionStepped(art, T0, T1, od, c.hours);
    assert.ok(Math.abs(s.hours / c.hours - 1) < 1e-6, `${T0} → ${T1}`);
  }
});

test('transition time follows the thermal mass', () => {
  const p = { m: 12, A: 0.27, eps: 0.9, Q: 10, aftLo: 0, aftHi: 50, margin: 10, overdrive: 30, level: 'system', cycles: 4 };
  const one = tvacChecked(p);
  const two = tvacChecked({ ...p, m: 24 });
  assert.ok(Math.abs(two.heat.hours / one.heat.hours - 2) < 1e-9);
  assert.ok(one.cool.hours > one.heat.hours);
});

test('a powered article cannot reach a cold plateau with too little overdrive', () => {
  const c = tvacChecked({ m: 12, A: 0.27, eps: 0.9, Q: 10, aftLo: 0, aftHi: 50, margin: 10, overdrive: 5, level: 'system', cycles: 4 });
  assert.equal(c.reachable, false);
});
