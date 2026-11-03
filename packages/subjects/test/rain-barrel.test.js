import test from 'node:test';
import assert from 'node:assert/strict';
import { rainBarrel as R, rainInflow as I } from '../src/math/rain-barrel.js';
import { simpson } from '../src/math/quadrature.js';
test('storm integrals and capacity clipping conserve water and agree with quadrature and time stepping', () => {
  for (const profile of ['ramp', 'sine', 'steady'])
    for (const t of [2, 10, 19, 20, 25]) {
      const s = { profile, peak: 20, T: 20, t, capacity: 189.2705892, initial: 10 },
        c = R(s);
      const end = Math.min(t, s.T),
        eps = 1e-8;
      const integral = simpson((x) => I(profile, s.peak, s.T, Math.min(x, s.T - eps)).flow, 0, end, 1e-7);
      assert.ok(Math.abs(c.delivered - integral) < 1e-5);
      assert.ok(Math.abs(c.stored + c.spill - s.initial - c.delivered) < 1e-10);
      const twice = R({ ...s, capacity: 2 * s.capacity, initial: 2 * s.initial, peak: 2 * s.peak });
      assert.ok(Math.abs(twice.stored - 2 * c.stored) < 1e-10);
      if (t < 20 && c.spill === 0) {
        const h = 1e-5,
          d = (R({ ...s, t: t + h }).stored - R({ ...s, t: t - h }).stored) / (2 * h);
        assert.ok(Math.abs(d - c.storageRate) < 1e-5);
      }
      let v = s.initial,
        spill = 0;
      const dt = t / 20000;
      for (let i = 0; i < 20000; i++) {
        const next = v + I(profile, s.peak, s.T, (i + 0.5) * dt).flow * dt;
        spill += Math.max(0, next - s.capacity);
        v = Math.min(s.capacity, next);
      }
      assert.ok(Math.abs(v - c.stored) < 0.001 && Math.abs(spill - c.spill) < 0.01);
    }
});
