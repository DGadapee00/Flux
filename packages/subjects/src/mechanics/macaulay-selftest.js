/**
 * Second methods for macaulay.js.
 *   node src/mechanics/macaulay-selftest.js
 */
import { integrateFixed, integrateSimple, simplePointDeflection, simpleUniformDeflection } from './elastic.js';
import { fixedPoint, fixedPointAt, fixedUniform, simpleMacaulay } from './macaulay.js';

let passed = 0;
let failed = 0;
function approx(got, want, tol, name) {
  const ok = Number.isFinite(got) && Math.abs(got - want) <= tol * Math.max(1e-12, Math.abs(want));
  if (ok) passed += 1;
  else {
    failed += 1;
    console.error(`FAIL ${name}: got ${got}, want ${want}`);
  }
}

const EI = 200e9 * (0.04 * 0.08 ** 3) / 12;
const L = 4;
const at = (curve, x) => {
  const i = curve.x.findIndex((v) => v >= x - 1e-12);
  return curve.y[i];
};

// One load: brackets against the textbook closed form.
{
  const b = simpleMacaulay({ L, EI, points: [{ a: 1, P: 10e3 }] });
  approx(-b.y(1), (10e3 * 1 * 1 * 9) / (3 * EI * L), 1e-12, 'under the load: Pa²b²/3EIL');
  approx(-b.y(1), 0.021972656, 1e-6, '22.0 mm under a 10 kN load at 1 m');
  approx(b.y(L), 0, 1, 'y(L) = 0');
  for (const x of [0.5, 2, 3.5]) approx(b.y(x), simplePointDeflection(10e3, L, 1, EI).at(x).y, 1e-12, `closed form agrees at ${x} m`);
  const u = simpleMacaulay({ L, EI, udl: [{ a: 0, b: L, w: 5e3 }] });
  approx(-u.y(2), (5 * 5e3 * L ** 4) / (384 * EI), 1e-12, 'uniform: 5wL⁴/384EI');
}

// Two loads and a partial uniform load: brackets against a double integral of M, and superposition.
{
  const spec = { L, EI, points: [{ a: 1, P: 6e3 }, { a: 3, P: 4e3 }], udl: [{ a: 1.5, b: 3.5, w: 2e3 }] };
  const b = simpleMacaulay(spec);
  const num = integrateSimple(b.M, L, EI, 8000, [1, 1.5, 3, 3.5]);
  for (const x of [0.5, 1, 2, 3, 3.75]) approx(b.y(x), at(num, x), 1e-6, `two loads and a patch: y(${x}) by double integration`);
  const p1 = simpleMacaulay({ L, EI, points: [{ a: 1, P: 6e3 }] });
  const p2 = simpleMacaulay({ L, EI, points: [{ a: 3, P: 4e3 }] });
  const p3 = simpleMacaulay({ L, EI, udl: [{ a: 1.5, b: 3.5, w: 2e3 }] });
  approx(b.y(2), p1.y(2) + p2.y(2) + p3.y(2), 1e-12, 'superposition of the three single cases');
  approx(b.RA + b.RB, 6e3 + 4e3 + 4e3, 1e-12, 'reactions carry the load');
}

// A couple: the moment jumps, the brackets still integrate.
{
  const c = simpleMacaulay({ L, EI, couples: [{ a: 1, M0: 6e3 }] });
  approx(c.RA, 1.5e3, 1e-12, 'couple: left reaction M0/L');
  // The trapezoid sees the jump at x = 1 from one side only, so this check is good to about 2e-4.
  const num = integrateSimple(c.M, L, EI, 8000, [1]);
  approx(c.y(2), at(num, 2), 5e-4, 'couple: y(2) by double integration');
}

// Fixed ends: superposition against a direct solve with the end moment unknown.
{
  const w = 5e3;
  const f = fixedUniform(w, L, EI);
  // Integrate from the left wall with R = wL/2 and an unknown end moment −Me; pick Me so the slope at L is zero.
  const slopeAtL = (Me) => {
    const curve = integrateFixed((x) => (w * L / 2) * x - (w * x * x) / 2 - Me, L, EI, 8000);
    return curve.slope[curve.slope.length - 1];
  };
  const s0 = slopeAtL(0);
  const s1 = slopeAtL(1000);
  const Me = (-s0 * 1000) / (s1 - s0);
  approx(Me, f.Me, 1e-6, 'fixed ends: end moment wL²/12 by zero end slope');
  const curve = integrateFixed((x) => (w * L / 2) * x - (w * x * x) / 2 - Me, L, EI, 8000);
  approx(-at(curve, 2), f.drop, 1e-6, 'fixed ends: midspan drop wL⁴/384EI');
  approx(f.simpleDrop / f.drop, 5, 1e-12, 'fixing the ends cuts the drop to a fifth');
  approx(f.simpleDrop, simpleUniformDeflection(w, L, EI).drop, 1e-12, 'simple span agrees with elastic.js');
  const p = fixedPoint(10e3, L, EI);
  const sl = (Me) => {
    const cv = integrateFixed((x) => 5e3 * x - 10e3 * Math.max(0, x - 2) - Me, L, EI, 8000, [2]);
    return cv.slope[cv.slope.length - 1];
  };
  const m0 = sl(0);
  const m1 = sl(1000);
  approx((-m0 * 1000) / (m1 - m0), p.Me, 1e-6, 'fixed ends, point load: PL/8');
  approx(p.simpleDrop / p.drop, 4, 1e-12, 'fixing the ends cuts the point-load drop to a quarter');
}

// Fixed ends, P off centre: integrate EI y'' = M from the left with the closed-form end moment and
// reaction, and the right end must come out level and back at zero.
{
  const P = 4000;
  const L = 3.6;
  const a = 1.0;
  const EI = 2.5e6;
  const f = fixedPointAt(P, L, a, EI);
  const r = integrateFixed(f.M, L, EI, 8000, [a]);
  const end = r.x.length - 1;
  approx(Math.abs(r.y[end]) / f.drop(a) + 1, 1, 1e-6, 'fixed off centre: the right end does not drop');
  approx(Math.abs(r.slope[end]) * L / f.drop(a) + 1, 1, 1e-6, 'fixed off centre: the right end stays level');
  for (const k of [1000, 2222, 4000, 6500]) approx(-r.y[k], f.drop(r.x[k]), 1e-5, `fixed off centre: drop at x = ${r.x[k].toFixed(3)}`);
  approx(f.M(L), -f.MB, 1e-9, 'fixed off centre: the moment ends at −M_B');
  approx(f.RA + f.RB, P, 1e-12, 'fixed off centre: reactions carry P');
  const mid = fixedPointAt(P, L, L / 2, EI);
  const fp = fixedPoint(P, L, EI);
  approx(mid.MA, fp.Me, 1e-12, 'fixed at midspan: M_A = PL/8');
  approx(mid.drop(L / 2), fp.drop, 1e-12, 'fixed at midspan: drop PL³/192EI');
  approx(mid.Mload, fp.Mmid, 1e-12, 'fixed at midspan: PL/8 under the load');
  approx(fixedPointAt(2 * P, L, a, EI).drop(2), 2 * f.drop(2), 1e-12, 'double P, double the drop');
}

if (failed) {
  console.error(`macaulay-selftest: ${failed} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`macaulay-selftest: ${passed} passed`);
