import test from 'node:test';
import assert from 'node:assert/strict';
import { TECHNIQUES } from '../src/math/techniques.js';
import { simpson } from '@flux/subjects/math/quadrature.js';
test('all integral workbench readouts agree with quadrature and finite differences', () => {
  for (const v of Object.values(TECHNIQUES))
    for (const fraction of [0.2, 0.6, 1]) {
      const b = v.a + (v.b - v.a) * fraction;
      assert.ok(Math.abs(v.F(b) - v.F(v.a) - simpson(v.f, v.a, b)) < 1e-6, v.name);
      const x = (v.a + b) / 2,
        h = 1e-5;
      assert.ok(Math.abs((v.F(x + h) - v.F(x - h)) / (2 * h) - v.f(x)) < 1e-5, v.name);
    }
});
