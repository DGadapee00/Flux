import test from 'node:test';
import assert from 'node:assert/strict';
import { cylinderDesign as calc } from '../src/math/containers.js';
test('fixed-volume area, optimum and sensitivity agree with independent geometry and a grid search', () => {
  for (const V of [250, 355, 500])
    for (const k of [1, 2])
      for (const r of [2, 3.3, 5]) {
        const c = calc(V, r, k),
          h = 1e-5;
        assert.ok(Math.abs(Math.PI * r * r * c.h - V) < 1e-10);
        assert.ok(Math.abs(2 * Math.PI * r * c.h + k * Math.PI * r * r - c.area) < 1e-10);
        assert.ok(Math.abs((calc(V, r + h, k).area - calc(V, r - h, k).area) / (2 * h) - c.slope) < 1e-6);
        assert.ok(Math.abs(calc(V, c.optR, k).slope) < 1e-10);
        let best = Infinity;
        for (let i = 1; i < 10000; i++) best = Math.min(best, calc(V, i / 1000, k).area);
        assert.ok(best >= c.minArea - 1e-8 && best - c.minArea < 1e-4);
        const scaled = calc(8 * V, 2 * r, k);
        assert.ok(Math.abs(scaled.area - 4 * c.area) < 1e-10);
        assert.ok(Math.abs(scaled.h - 2 * c.h) < 1e-10);
      }
});
