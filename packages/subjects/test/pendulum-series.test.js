import test from 'node:test';
import assert from 'node:assert/strict';
import { pendulumSeries } from '../src/math/pendulum-series.js';
import { simpson } from '../src/math/quadrature.js';
import { G_STANDARD, RAD_PER_DEG, S_PER_DAY } from '../src/convert.js';
test('AGM period agrees with quadrature; truncations approach from below within a proven bound', () => {
  for (const degrees of [0, 5, 30, 90, 150, 170])
    for (const n of [1, 4, 12, 30]) {
      const angle = degrees * RAD_PER_DEG,
        v = pendulumSeries(1, angle, n);
      const q =
        4 *
        Math.sqrt(1 / G_STANDARD) *
        simpson((x) => 1 / Math.sqrt(1 - v.m * Math.sin(x) ** 2), 0, Math.PI / 2, 1e-11);
      assert.ok(Math.abs(v.period - q) < 1e-8);
      assert.ok(v.series <= v.period + 1e-12);
      assert.ok(v.error <= v.tailBound + 1e-11);
      assert.ok(Math.abs(pendulumSeries(4, angle, n).period - 2 * v.period) < 1e-12);
      const more = pendulumSeries(1, angle, n + 1);
      assert.ok(more.error <= v.error + 1e-12);
    }
});
test('small amplitude and length calibration are distinct limits', () => {
  const L = G_STANDARD * (4 / (2 * Math.PI)) ** 2;
  assert.ok(Math.abs(pendulumSeries(L, 0).period - 4) < 1e-12);
  const a = pendulumSeries(1, 0.01),
    b = pendulumSeries(1, 0.02);
  assert.ok(Math.abs((b.fraction - 1) / (a.fraction - 1) - 4) < 0.001);
  for (const x of [
    [0, 0.1],
    [1, Math.PI],
    [1, -0.1],
  ])
    assert.throws(() => pendulumSeries(...x));
});

test('shared angle and day conversions', () => {
  assert.equal(360 * RAD_PER_DEG, 2 * Math.PI);
  assert.equal(S_PER_DAY, 86400);
});
