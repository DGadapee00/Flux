/**
 * Second methods for buckling.js.
 *   node src/mechanics/buckling-selftest.js
 */
import { fixedPinnedRoot, pinnedEulerDiscrete, pinnedEulerFD, rectColumn, rectI, transitionLength, tubeColumn, tubeSection } from './buckling.js';

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

if (failed) {
  console.error(`buckling-selftest: ${failed} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`buckling-selftest: ${passed} passed`);
