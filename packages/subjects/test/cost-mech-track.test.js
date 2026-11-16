/**
 * Cost, mechanisms and tracking: each closed form against its second method, and the behaviour the
 * labs teach.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { TRL_SD, confidenceChecked, learningChecked, normInv } from '../src/design/cost.js';
import { hingeChecked } from '../src/mechanics/hinge.js';
import { separationChecked } from '../src/mechanics/separation.js';

const D = Math.PI / 180;

test('the learning curve’s integral matches the unit-by-unit sum', () => {
  for (const S of [0.85, 0.9, 0.95]) for (const N of [1, 5, 20, 100]) assert.ok(learningChecked({ dev: 3, tfu: 1, S, N }).gap < 0.005);
});

test('each doubling multiplies the unit cost by the slope', () => {
  const a = learningChecked({ dev: 0, tfu: 1, S: 0.9, N: 10 }).last;
  const b = learningChecked({ dev: 0, tfu: 1, S: 0.9, N: 20 }).last;
  assert.ok(Math.abs(b / a - 0.9) < 1e-12);
});

test('the normal quantile is right', () => {
  assert.ok(Math.abs(normInv(0.975) - 1.959964) < 1e-6);
  assert.ok(Math.abs(normInv(0.7) - 0.5244005) < 1e-6);
});

test('the cost total’s moments match the convolution, and independent reserves do not add', () => {
  const items = [{ cost: 1.2, sd: TRL_SD[7] }, { cost: 0.6, sd: TRL_SD[3] }, { cost: 0.4, sd: TRL_SD[5] }];
  const c = confidenceChecked(items, 0.7);
  assert.ok(c.gap < 1e-4);
  assert.ok(c.eachAdded > c.budget);
});

test('the hinge’s closed-form deployment matches RK4, and the margin follows the data source', () => {
  const p = { k: 0.01, I: 0.004, theta0: 180 * D, thetaD: 90 * D, friction: 0.002, harness: 0.001 };
  const a = hingeChecked({ ...p, source: 'analysis' });
  const t = hingeChecked({ ...p, source: 'accept' });
  assert.ok(a.gap < 1e-5);
  assert.ok(Math.abs((t.tm + 1) / (a.tm + 1) - 1.5) < 1e-12);
});

test('only an along-track push drifts apart; the flown orbits agree', () => {
  const along = separationChecked({ hkm: 500, dv: 1, dir: 'along', Dkm: 10, days: 2, objects: 10 });
  const radial = separationChecked({ hkm: 500, dv: 1, dir: 'radial', Dkm: 10, days: 2, objects: 10 });
  assert.ok(along.tReach > 0 && along.gap < 1e-3);
  assert.equal(radial.tReach, null);
  assert.ok(Math.abs(along.log10Matches - Math.log10(3628800)) < 1e-9);
});
