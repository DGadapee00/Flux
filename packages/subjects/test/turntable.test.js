import test from 'node:test';
import assert from 'node:assert/strict';
import { turntable } from '../src/math/turntable.js';
import { simpson } from '../src/math/quadrature.js';
test('record motion agrees with finite differences, circumference and sector geometry', () => {
  for (const rpm of [100 / 3, 45])
    for (const r of [0.07, 0.14]) {
      const t = 0.3,
        h = 1e-6,
        a = turntable(r, rpm, t),
        l = turntable(r, rpm, t - h),
        u = turntable(r, rpm, t + h);
      assert.ok(Math.abs((u.x - l.x) / (2 * h) - a.vx) < 1e-8);
      assert.ok(Math.abs((u.y - l.y) / (2 * h) - a.vy) < 1e-8);
      assert.ok(Math.abs(a.x * a.vx + a.y * a.vy) < 1e-12);
      const full = turntable(r, rpm, a.period);
      assert.ok(Math.abs(full.distance - 2 * Math.PI * r) < 1e-12);
      assert.ok(Math.abs(full.area - Math.PI * r * r) < 1e-12);
      assert.ok(
        Math.abs(
          simpson(
            (s) => {
              const v = turntable(r, rpm, s);
              return Math.hypot(v.vx, v.vy);
            },
            0,
            t,
          ) - a.distance,
        ) < 1e-10,
      );
      assert.equal(turntable(r / 2, rpm, t).speed, a.speed / 2);
      assert.equal(turntable(r / 2, rpm, t).period, a.period);
    }
});
test('speed changes timing but not the tangent at fixed angle', () => {
  const a = turntable(0.14, 100 / 3, 0.45),
    b = turntable(0.14, 45, (0.45 * (100 / 3)) / 45);
  assert.ok(Math.abs(a.slope - b.slope) < 1e-12);
  assert.ok(b.speed > a.speed);
  assert.throws(() => turntable(0, 45, 1));
});
