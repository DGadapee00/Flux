import assert from 'node:assert/strict';
import test from 'node:test';
import { checkOrbit, integratedOrbit, GM_EARTH, R_EARTH } from '../src/mechanics/orbit-check.js';

test('the integrated orbit agrees with the closed form', () => {
  for (const km of [200, 550, 2000, 35786]) {
    const r = R_EARTH + km * 1000;
    const v = Math.sqrt(GM_EARTH / r);
    const T = (2 * Math.PI * r) / v;
    const run = integratedOrbit(r);
    assert.ok(Math.abs(run.period - T) / T < 1e-6, `${km} km period`);
    assert.ok(Math.abs(run.speed - v) / v < 1e-6, `${km} km speed`);
  }
});

test('a learner passes within 1% of both routes and gets a hint for the common slips', () => {
  const good = checkOrbit({ altitudeKm: 550, speedKmS: 7.59, periodMin: 95.5 });
  assert.equal(good.pass, true);
  assert.ok(Math.abs(good.closed.period - good.integrated.period) < 1e-3);
  const fromSurface = checkOrbit({ altitudeKm: 550, speedKmS: Math.sqrt(GM_EARTH / 550e3) / 1000, periodMin: 95.5 });
  assert.equal(fromSurface.pass, false);
  assert.match(fromSurface.hint, /centre/);
  const seconds = checkOrbit({ altitudeKm: 550, speedKmS: 7.59, periodMin: 95.5 * 60 });
  assert.equal(seconds.pass, false);
  assert.match(seconds.hint, /seconds/);
  assert.equal(checkOrbit({ altitudeKm: 20, speedKmS: 7, periodMin: 90 }).ok, false);
  assert.equal(checkOrbit({ altitudeKm: 550, speedKmS: 0, periodMin: 90 }).ok, false);
});
