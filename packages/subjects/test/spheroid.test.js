import test from 'node:test';
import assert from 'node:assert/strict';
import { spheroid as S } from '../src/math/spheroid.js';
import { simpson } from '../src/math/quadrature.js';
test('spheroid volume by disks, radial shells and a midpoint sum', () => {
  for (const a of [1, 2, 3])
    for (const c of [1, 2]) {
      const v = S(a, c, 8);
      assert.ok(Math.abs(v.volume - simpson((z) => Math.PI * a * a * (1 - (z * z) / (c * c)), -c, c)) < 1e-8);
      // r=a sin(t) removes the shell integral's square-root endpoint.
      const shells = simpson((t) => 4 * Math.PI * a * a * c * Math.sin(t) * Math.cos(t) ** 2, 0, Math.PI / 2);
      assert.ok(Math.abs(v.volume - shells) < 1e-7);
      assert.ok(Math.abs(S(a, c, 16).error / v.error - 0.25) < 1e-10);
      assert.ok(Math.abs(S(2 * a, 2 * c).volume - 8 * v.volume) < 1e-10);
    }
});
