/**
 * Ground station coverage: the latitude-density integral against flying the orbit with the Earth
 * turning under it.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { capAngle, coverageChecked, shareClosed } from '../src/mechanics/coverage.js';

const STATIONS = { utq: { lat: 71.27, lon: -156.81 }, moj: { lat: 35.05, lon: -118.15 }, mwu: { lat: -1.96, lon: 30.39 }, awa: { lat: -46.52, lon: 168.38 } };

test('closed form against the flown orbit, over orbits and stations', () => {
  for (const incl of [20, 51.6, 97.4]) {
    for (const hkm of [400, 700]) {
      const c = coverageChecked({ hkm, eps: 10, incl }, Object.values(STATIONS));
      assert.ok(c.gap < 0.03, `i ${incl}°, ${hkm} km: gap ${c.gap}`);
    }
  }
});

test('a station beyond the orbit’s reach never sees it', () => {
  const lam = capAngle(500, 10) / (Math.PI / 180);
  assert.equal(shareClosed({ hkm: 500, eps: 10, incl: 51.6 }, 51.6 + lam + 1), 0);
});

test('a polar station sees a polar orbit more than an equatorial one does', () => {
  const o = { hkm: 500, eps: 10, incl: 97.4 };
  assert.ok(shareClosed(o, 71.27) > 3 * shareClosed(o, -1.96));
});

test('stations at the same latitude north and south share equally', () => {
  const o = { hkm: 500, eps: 10, incl: 60 };
  assert.ok(Math.abs(shareClosed(o, 30) - shareClosed(o, -30)) < 1e-12);
});
