import test from 'node:test';
import assert from 'node:assert/strict';
import { parabolicCable } from '../src/math/parabolic-cable.js';
import { simpson } from '../src/math/quadrature.js';
test('cable length agrees with quadrature and polygon limits', () => {
  for (const [L, d] of [
    [1280, 100],
    [1280, 200],
    [10, 1],
    [50, 0],
  ]) {
    const a = parabolicCable(L, d, 16),
      b = parabolicCable(L, d, 32);
    const q = simpson((x) => Math.hypot(1, (8 * d * x) / (L * L)), -L / 2, L / 2, 1e-9);
    assert.ok(Math.abs(a.length - q) < 1e-6);
    assert.ok(a.length >= L);
    assert.ok(b.polygon >= a.polygon - 1e-10);
    assert.ok(b.error <= a.error + 1e-10);
    assert.ok(Math.abs(parabolicCable(2 * L, 2 * d).length - 2 * a.length) < 1e-7);
  }
});
test('small sag excess is quadratic; straight limit and invalid states', () => {
  assert.ok(Math.abs(parabolicCable(1000, 2).extra / parabolicCable(1000, 1).extra - 4) < 0.001);
  assert.equal(parabolicCable(20, 0).length, 20);
  for (const x of [
    [0, 1],
    [-1, 1],
    [10, -1],
    [Infinity, 1],
  ])
    assert.throws(() => parabolicCable(...x));
});
