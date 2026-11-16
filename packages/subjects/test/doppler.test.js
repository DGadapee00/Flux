/**
 * Tracking through a pass: the geometric range rate against Runge–Kutta with the velocity projected
 * on the line of sight, and the shift's dependence on frequency and altitude.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { dopplerChecked, dopplerClosed, trackAt } from '../src/mechanics/doppler.js';
import { passesClosed } from '../src/mechanics/passes.js';

test('closed form against Runge–Kutta, over altitudes, masks and bands', () => {
  for (const hkm of [300, 500, 800, 1000]) {
    for (const eps of [0, 10, 30]) {
      for (const fMHz of [437, 2200, 8400]) {
        const c = dopplerChecked({ hkm, eps, fMHz });
        assert.ok(c.gap < 1e-5, `${hkm} km, ${eps}°, ${fMHz} MHz: gap ${c.gap}`);
      }
    }
  }
});

test('the pass lasts as long as the passes model says, and overhead the rate is zero', () => {
  const c = dopplerClosed({ hkm: 500, eps: 10, fMHz: 437 });
  assert.ok(Math.abs(c.duration - passesClosed({ hkm: 500, eps: 10 }).tp) < 1e-9);
  assert.equal(trackAt(0, { hkm: 500 }).rhoDot, 0);
});

test('the shift scales with frequency; the slope overhead falls with altitude', () => {
  const u = dopplerClosed({ hkm: 500, eps: 10, fMHz: 437 });
  const s = dopplerClosed({ hkm: 500, eps: 10, fMHz: 2200 });
  assert.ok(Math.abs(s.shiftEdge / u.shiftEdge - 2200 / 437) < 1e-12);
  assert.ok(dopplerClosed({ hkm: 800, eps: 10, fMHz: 437 }).slope < u.slope);
});
