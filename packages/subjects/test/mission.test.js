/**
 * The whole-craft budgets: the closed forms against a day in the life, and the couplings between
 * subsystems the lab teaches.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { missionChecked, slantRange, unionShareClosed } from '../src/design/mission.js';
import { shareClosed } from '../src/mechanics/coverage.js';

const UTQ = { lat: 71.27, lon: -156.81 };
const MOJ = { lat: 35.05, lon: -118.15 };
const AWA = { lat: -46.52, lon: 168.38 };
const SOD = { lat: 67.36, lon: 26.63 };

function design(o = {}) {
  const items = [
    ['Structure', 1.6], ['Attitude control', 1.2], ['Flight computer', 0.3], ['Harness', 0.6], ['Thermal', 0.3], ['Power', 1.5], ['Radio', 0.5],
  ].map(([name, basic]) => ({ name, basic, maturity: 'catalog' }));
  return {
    items: [...items, { name: 'Payload', basic: 3, maturity: 'new' }],
    limit: 12, h: 500, eps: 10, incl: 97.4, stations: [UTQ], Ppeak: 20, Ebatt: 30,
    loads: { bus: 8, payload: 1.5, tx: 10 }, duty: 1, rate: 20, house: 2,
    radio: { band: 's', Pt: 2, GtdBi: 6, Dr: 3, T: 300, Rb: 1e6 },
    finish: 'black', area: 0.06, surface: 0.27, f107: 147, lifeMin: 1, lifeMax: 5, dodMax: 0.3,
    Tlimits: [273.15, 323.15], pointing: { sensor: 'horizon', jitter: 0.02, misalign: 0.03, thermal: 0.01, R: null },
    ...o,
  };
}

test('closed forms against the day in the life, over orbits and stations', () => {
  for (const incl of [51.6, 97.4]) {
    for (const h of [400, 600]) {
      for (const stations of [[MOJ], [UTQ, AWA]]) {
        const c = missionChecked(design({ incl, h, stations }));
        assert.ok(c.gap < 0.01, `i ${incl}°, ${h} km, ${stations.length} stations: gap ${c.gap}`);
      }
    }
  }
});

test('the union of circles reduces to one station, and adds for stations far apart', () => {
  const o = { hkm: 500, eps: 10, incl: 97.4 };
  assert.ok(Math.abs(unionShareClosed(o, [UTQ], 4000) - shareClosed(o, UTQ.lat, 4000)) < 1e-12);
  assert.ok(Math.abs(unionShareClosed(o, [UTQ, AWA], 4000) - shareClosed(o, UTQ.lat, 4000) - shareClosed(o, AWA.lat, 4000)) < 1e-12);
  // Two Arctic stations' circles overlap near the pole at 1000 km: the union is less than the sum.
  const hi = { hkm: 1000, eps: 0, incl: 97.4 };
  assert.ok(unionShareClosed(hi, [UTQ, SOD]) < shareClosed(hi, UTQ.lat) + shareClosed(hi, SOD.lat) - 1e-4);
});

test('the slant range at the zenith is the altitude', () => {
  assert.ok(Math.abs(slantRange(500, 90) - 500e3) < 1e-6);
});

test('the baseline craft closes every budget', () => {
  const c = missionChecked(design());
  assert.ok(c.closes, c.budgets.filter((b) => !b.ok).map((b) => b.id).join());
});

test('a UHF radio sends a hundredth of what S band does, and data limits', () => {
  const s = missionChecked(design());
  const u = missionChecked(design({ radio: { band: 'uhf', Pt: 1, GtdBi: 0, Dr: 1.5, T: 500, Rb: 9600 }, loads: { bus: 8, payload: 1.5, tx: 4 } }));
  assert.ok(Math.abs(u.capacity / s.capacity - 9600 / 1e6) < 1e-12);
  assert.equal(u.limiting.id, 'data');
});

test('a higher orbit lasts past the disposal rule', () => {
  const c = missionChecked(design({ h: 550 }));
  assert.equal(c.limiting.id, 'life');
  assert.ok(c.life > 5);
});

test('a station the orbit never reaches leaves the data budget unable to close', () => {
  const c = missionChecked(design({ incl: 51.6 }));
  assert.equal(c.closes, false);
  assert.equal(c.limiting.id, 'data');
});

test('transmitting in eclipse deepens the discharge beyond the average', () => {
  const c = missionChecked(design({ stations: [UTQ, AWA] }));
  assert.ok(c.sim.deepest > c.dod);
});
