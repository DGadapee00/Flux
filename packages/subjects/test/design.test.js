/**
 * Design labs' closed forms against their second methods: fits and stacks against binned
 * convolution, position zones against 2D Simpson, capability against Simpson, drift against
 * stepping, and the decision matrix's weight ranges against scan and bisection.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  capability, capabilityNumeric, driftClosed, driftNumeric, fitLimits, interferenceChance, interferenceChanceNumeric,
  positionYield, positionYieldNumeric, spread, stackClosed, stackNumeric,
} from '../src/design/tolerancing.js';
import { scoreConcepts, weightRange, weightRangeNumeric } from '../src/design/decision.js';

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

test('fits: Wikipedia’s 50 mm examples', () => {
  assert.deepEqual(fitLimits({ holeLo: 0, holeHi: 39, shaftLo: -50, shaftHi: -25 }), { cMin: 25, cMax: 89, type: 'clearance' });
  assert.deepEqual(fitLimits({ holeLo: 0, holeHi: 25, shaftLo: 26, shaftHi: 42 }), { cMin: -42, cMax: -1, type: 'interference' });
  assert.equal(fitLimits({ holeLo: 0, holeHi: 25, shaftLo: 2, shaftHi: 18 }).type, 'transition');
});

test('fits: interference chance closed form against convolution', () => {
  for (const cp of [0.67, 1, 1.33]) {
    const hole = spread(0, 25, { cp });
    const shaft = spread(2, 18, { cp });
    const a = interferenceChance(hole, shaft);
    const b = interferenceChanceNumeric(hole, shaft, 0.05);
    close(b.p, a.p, 2e-4, `p at cp ${cp}`);
    close(Math.sqrt(b.variance), a.sd, 1e-4 * a.sd, 'spread');
  }
});

test('stack: RSS against the convolved batch', () => {
  for (const kind of ['normal', 'uniform']) {
    for (const n of [2, 4, 8]) {
      const spec = { n, T: 0.1, S: 0.25, kind };
      const a = stackClosed(spec);
      const b = stackNumeric(spec);
      close(b.sd, a.sd, 1e-4 * a.sd, `${kind} ${n} spread`);
      if (kind === 'uniform') close(b.reach, a.worst, 0.1 / 80 + 1e-12, `${kind} ${n} reach is the worst case`);
      if (kind === 'normal') close(b.outside, a.outside, 1e-5, `${kind} ${n} outside`);
    }
  }
});

test('position: the circle round the box accepts more', () => {
  for (const sigma of [0.02, 0.05, 0.1]) {
    const spec = { t: 0.1, sigma, dia: 0.2 * Math.SQRT2 };
    const a = positionYield(spec);
    const b = positionYieldNumeric(spec);
    close(b.box, a.box, 1e-6, 'box');
    close(b.circle, a.circle, 1e-6, 'circle');
    assert.ok(a.circle >= a.box);
  }
});

test('capability and drift', () => {
  for (const mu of [10, 10.02, 9.95]) {
    const spec = { mu, sigma: 0.02, lsl: 9.94, usl: 10.06 };
    close(capabilityNumeric(spec).out, capability(spec).out, 1e-9, `out at ${mu}`);
  }
  close(capability({ mu: 10, sigma: 0.02, lsl: 9.94, usl: 10.06 }).cp, 1, 1e-12, 'Cp = 1');
  for (const delta of [0.001, 0.0025, 0.004]) {
    const spec = { mu0: 10, sigma: 0.01, usl: 10.06, delta, n: 5 };
    assert.deepEqual(driftNumeric(spec), driftClosed(spec));
  }
});

test('decision: weight ranges by formula and by bisection', () => {
  const concepts = [
    { id: 'a', values: { mass: 42, cost: 38, defl: 0.05 } },
    { id: 'b', values: { mass: 60, cost: 9, defl: 0.12 } },
    { id: 'c', values: { mass: 18, cost: 6, defl: 0.6 } },
  ];
  const criteria = [{ id: 'mass', better: 'lower' }, { id: 'cost', better: 'lower' }, { id: 'defl', better: 'lower' }];
  const weights = { mass: 2, cost: 3, defl: 4 };
  const rescore = (w) => scoreConcepts(concepts, criteria, [], w);
  const r = rescore(weights);
  for (const k of ['mass', 'cost', 'defl']) {
    const a = weightRange(r, criteria, weights, k);
    const b = weightRangeNumeric(rescore, weights, k, r.leader);
    close(b.lo, a.lo, 1e-6, `${k} lo`);
    close(b.hi, a.hi, 1e-6, `${k} hi`);
  }
  const req = scoreConcepts(concepts, criteria, [{ criterion: 'defl', max: 0.5 }], weights);
  assert.deepEqual(req.fails.c, ['defl']);
  assert.notEqual(req.leader, 'c');
});

import { boltedJoint, boltedJointNetwork, constraintRows, rankByElimination, rankByMinors, seat, seatIterative } from '../src/design/joints.js';
import { sketchClosed, sketchSolve } from '../src/design/sketch.js';
import { bracketClosed, bracketNumeric } from '../src/design/verify.js';

test('bolted joint: stiffness share against the spring network', () => {
  for (const ratio of [0.3, 1, 3]) {
    for (const P of [0, 5, 15, 40]) {
      const a = boltedJoint({ Fi: 20, P, ratio });
      const b = boltedJointNetwork({ Fi: 20, P, ratio });
      close(b.Fb, a.Fb, 1e-9, `bolt at ${ratio}, ${P}`);
      close(b.Fm, a.Fm, 1e-9, `members at ${ratio}, ${P}`);
    }
  }
});

const LAYOUTS = {
  exact: [{ x: 20, y: 0, nx: 0, ny: 1 }, { x: 80, y: 0, nx: 0, ny: 1 }, { x: 0, y: 25, nx: 1, ny: 0 }],
  over: [{ x: 20, y: 0, nx: 0, ny: 1 }, { x: 80, y: 0, nx: 0, ny: 1 }, { x: 0, y: 25, nx: 1, ny: 0 }, { x: 100, y: 25, nx: -1, ny: 0 }],
  under: [{ x: 20, y: 0, nx: 0, ny: 1 }, { x: 80, y: 0, nx: 0, ny: 1 }],
};

test('mount: rank two ways, and seating two ways', () => {
  for (const [name, contacts, rank] of [['exact', LAYOUTS.exact, 3], ['over', LAYOUTS.over, 3], ['under', LAYOUTS.under, 2]]) {
    const J = constraintRows(contacts);
    assert.equal(rankByElimination(J), rank, name);
    assert.equal(rankByMinors(J), rank, name);
    const a = seat(contacts, contacts.length - 1, 0.05);
    const b = seatIterative(contacts, contacts.length - 1, 0.05);
    a.misfit.forEach((m, i) => close(b.misfit[i], m, 1e-7, `${name} misfit ${i}`));
  }
  assert.ok(Math.max(...seat(LAYOUTS.exact, 2, 0.05).misfit.map(Math.abs)) < 1e-9, 'exact constraint takes up the error');
  assert.ok(Math.max(...seat(LAYOUTS.over, 3, 0.05).misfit.map(Math.abs)) > 0.02, 'a redundant contact fights');
});

test('sketch: written-down positions against the Newton solver', () => {
  for (const dims of [{ W: 80, H: 40, S: 40 }, { W: 100, H: 40, S: 50 }]) {
    for (const scheme of ['intent', 'chained', 'eye']) {
      const a = sketchClosed(scheme, dims);
      const b = sketchSolve(scheme, dims);
      close(b.x1, a.x1, 1e-9, `${scheme} x1`);
      close(b.x2, a.x2, 1e-9, `${scheme} x2`);
      assert.equal(b.dof, 0);
    }
    const loose = sketchSolve('loose', dims);
    assert.equal(loose.dof, 1);
    close(loose.x2 - loose.x1, dims.S, 1e-9, 'loose spacing');
  }
});

test('bracket: closed form against integrated curvature and bisection', () => {
  for (const ktheta of [Infinity, 2e6, 2e5]) {
    const spec = { P: 200, L: 100, b: 20, h: 5, FS: 1.5, limit: 1, ktheta };
    const a = bracketClosed(spec);
    const b = bracketNumeric(spec);
    close(b.tip, a.tipTest, 1e-9 * a.tipTest + 1e-12, `tip at ${ktheta}`);
    close(b.pYield, a.pYield, 1e-6, 'yield load');
  }
});
