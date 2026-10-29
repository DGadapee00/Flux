/**
 * Second methods for buckling.js.
 *   node src/mechanics/buckling-selftest.js
 */
import {
  eulerLoad, fixedPinnedRoot, pinnedEulerDiscrete, pinnedEulerFD, rectColumn, rectI, secantColumn, secantLoad,
  tangentModulus, tangentModulusStress, transitionLength, tubeColumn, tubeSection,
} from './buckling.js';
import { rambergOsgood } from './materials.js';

let passed = 0;
let failed = 0;

function approx(got, want, tol, name) {
  const ok = Math.abs(got - want) <= tol * Math.max(1, Math.abs(want));
  if (ok) passed += 1;
  else {
    failed += 1;
    console.error(`FAIL ${name}: got ${got}, want ${want}`);
  }
}

const E = 200e9;
const sigY = 250e6;
const b = 0.06;
const h = 0.02;
const L = 2;
const col = rectColumn(L, b, h, E, sigY, 1);
const I = rectI(b, h);
const euler = (Math.PI ** 2 * E * I) / (L * L);
approx(col.euler, euler, 1e-12, 'pinned Euler load is π²EI/L²');
approx(col.I, 4e-8, 1e-12, 'weak-axis I of a 20 by 60 mm rectangle');
approx(col.stress, euler / (b * h), 1e-12, 'Euler stress is the load over the area');
approx(col.yielded, false, 0, 'the 2 m column is elastic');

const doubledL = rectColumn(2 * L, b, h, E, sigY, 1);
approx(doubledL.euler, col.euler / 4, 1e-12, 'doubling the length divides the Euler load by four');
const doubledE = rectColumn(L, b, h, 2 * E, sigY, 1);
approx(doubledE.euler, 2 * col.euler, 1e-12, 'doubling E doubles the Euler load');
const strong = rectColumn(L, h, b, E, sigY, 1);
approx(strong.euler / col.euler, 9, 1e-12, 'turning the 20 mm side into the depth multiplies the load by nine');

const free = rectColumn(L, b, h, E, sigY, 2);
approx(free.euler, col.euler / 4, 1e-12, 'fixed-free is a pinned column of length 2L');
const both = rectColumn(L, b, h, E, sigY, 0.5);
approx(both.euler, col.euler * 4, 1e-12, 'fixed-fixed is a pinned column of length L/2');

const root = fixedPinnedRoot();
approx(Math.tan(root.mu), root.mu, 1e-9, 'fixed-pinned root satisfies tan μ = μ');
approx(root.K, 0.6991556596428416, 1e-9, 'fixed-pinned K is π over that root');
approx(Math.abs(root.K - 0.7), 0.00085, 1e-3, '0.7 rounds that root');

const fd = pinnedEulerFD(E, I, L, 80);
const closed = pinnedEulerDiscrete(E, I, L, 80);
approx(fd, closed, 1e-9, 'inverse iteration matches the discrete sine eigenvalue');
const err = (fd - euler) / euler;
const asym = -(Math.PI ** 2) / (12 * 80 * 80);
approx(err / asym, 1, 1e-3, 'n = 80 sits on the π²/(12 n²) error');
const fdScaled = pinnedEulerFD(2 * E, 3 * I, 4 * L, 80);
const closedScaled = pinnedEulerDiscrete(2 * E, 3 * I, 4 * L, 80);
approx(fdScaled, closedScaled, 1e-9, 'the discrete eigenvalue scales with EI/L²');
const rel = (Pfd, Ee, Ii, Ll) => {
  const exact = (Math.PI ** 2 * Ee * Ii) / (Ll * Ll);
  return (Pfd - exact) / exact;
};
approx(rel(fd, E, I, L), rel(pinnedEulerFD(3 * E, 0.5 * I, 7 * L, 80), 3 * E, 0.5 * I, 7 * L), 1e-8, 'the relative FD error does not depend on E, I, or L');

const short = rectColumn(0.3, b, h, E, sigY, 1);
approx(short.yielded, true, 0, 'the 0.3 m column yields before it buckles');
approx(short.P, sigY * b * h, 1e-12, 'the course model stops at the yield load');
approx(short.euler, euler * (L / 0.3) ** 2, 1e-12, 'the Euler load at 0.3 m is still π²EI/L²');

const Ltr = transitionLength(b, h, E, sigY, 1);
const at = rectColumn(Ltr, b, h, E, sigY, 1);
approx(at.stress, sigY, 1e-9, 'the transition length is where Euler stress equals yield');

const tube = tubeColumn(124, 3, 0.112, 29000, 42, 1);
const sec = tubeSection(3, 0.112);
approx(sec.I, 1.0610165397784577, 1e-12, '3 in tube, design wall 0.112 in');
approx(tube.eulerKip, 19.750428707606396, 1e-12, 'Euler load at 124 in is the inch formula');
approx(tube.gap, 0, 1e-9, 'the inch Euler load matches the SI conversion');
approx(tube.yielded, false, 0, '124 in is still elastic against 42 ksi');
const stub = tubeColumn(76, 3, 0.112, 29000, 42, 1);
approx(stub.yielded, true, 0, '76 in yields before the Euler load');
approx(tubeColumn(248, 3, 0.112, 29000, 42, 1).eulerKip, tube.eulerKip / 4, 1e-12, 'doubling the tube length divides the load by four');

// Secant formula: the bow by integrating EI y'' = −P(y + e), and the Euler limit.
{
  const E = 200e9;
  const b = 0.06;
  const h = 0.02;
  const A = b * h;
  const I = rectI(b, h);
  const L = 2;
  const e = 0.005;
  const P = 10e3;
  const s = secantColumn(P, e, h / 2, A, I, E, L);
  // Shooting: march y'' = −P(y + e)/EI from y(0) = 0 with the symmetric slope, read the middle.
  const k2 = P / (E * I);
  const slope0 = e * Math.sqrt(k2) * Math.tan((Math.sqrt(k2) * L) / 2);
  let y = 0;
  let v = slope0;
  const n = 200000;
  const dx = L / 2 / n;
  for (let i = 0; i < n; i++) {
    const a1 = -k2 * (y + e);
    const vm = v + 0.5 * dx * a1;
    const ym = y + 0.5 * dx * v;
    const a2 = -k2 * (ym + e);
    y += dx * vm;
    v += dx * a2;
  }
  approx(y, s.bow, 1e-6, 'secant: middle bow by integrating the bent column');
  approx(Math.abs(v), 0, 1, 'secant: zero slope at the middle');
  approx(s.sigma, (P / A) * (1 + (e * (h / 2) * A / I) / Math.cos((L / 2) * Math.sqrt(P / (E * I)))), 1e-12, 'secant: the stress formula');
  approx(secantColumn(eulerLoad(E, I, L) * 0.999999, e, h / 2, A, I, E, L).bow > 100 * e ? 1 : 0, 1, 0, 'secant: the bow runs away near P_cr');
  const Pa = secantLoad(250e6, e, h / 2, A, I, E, L);
  approx(secantColumn(Pa, e, h / 2, A, I, E, L).sigma, 250e6, 1e-9, 'secant: the load that reaches yield');
  approx(secantColumn(1e-3, 0, h / 2, A, I, E, L).sigma, 1e-3 / A, 1e-12, 'secant: no offset, P/A');
}

// Tangent modulus: Et against a numerical slope of the curve, and Euler where the curve is still straight.
{
  const E = 70e9;
  const sy = 240e6;
  const n = 20;
  const s0 = 200e6;
  const ds = 1e3;
  const slope = (2 * ds) / (rambergOsgood(s0 + ds, E, sy, n) - rambergOsgood(s0 - ds, E, sy, n));
  approx(tangentModulus(s0, E, sy, n), slope, 1e-6, 'tangent modulus matches dσ/dε');
  const slender = 120;
  const t = tangentModulusStress(slender, E, sy, n);
  approx(t.sigma, t.euler, 2e-3, 'slender column: tangent modulus is Euler');
  const stocky = tangentModulusStress(40, E, sy, n);
  approx(stocky.sigma, (Math.PI ** 2 * stocky.Et) / 1600, 1e-9, 'stocky column: σ = π²Et/(KL/r)²');
  approx(stocky.sigma < stocky.euler && stocky.sigma < 1.1 * sy ? 1 : 0, 1, 0, 'stocky column: below Euler and near yield');
}

if (failed) {
  console.error(`buckling-selftest: ${failed} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`buckling-selftest: ${passed} passed`);
