/**
 * Second methods for virtualwork.js.
 *   node src/mechanics/virtualwork-selftest.js
 */
import { trussStiffness, unitLoadBeam, unitLoadTruss } from './virtualwork.js';

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

const AE = 400e-6 * 200e9;

// The 3-4-5 bracket of Unit 3.
{
  const t = {
    joints: { A: { x: -2, y: 0 }, C: { x: -2, y: 1.5 }, B: { x: 0, y: 0 } },
    members: [['A', 'B'], ['C', 'B']],
    loads: { B: { y: -30e3 } },
    supports: { A: 'pin', C: 'pin' },
  };
  approx(unitLoadTruss(t, AE, 'B', [0, -1]).delta, 3.9375e-3, 1e-9, 'bracket: unit load gives the 3.94 mm drop');
  approx(unitLoadTruss(t, AE, 'B', [1, 0]).delta, -1e-3, 1e-9, 'bracket: unit load gives the 1.00 mm move toward the wall');
  const k = trussStiffness(t, AE);
  approx(k.disp.B.y, -3.9375e-3, 1e-9, 'bracket: stiffness agrees');
}

// A five-bar roof truss: span 4 m, rise 1.5 m, 20 kN at the bottom middle.
const roof = {
  joints: { A: { x: 0, y: 0 }, B: { x: 2, y: 0 }, C: { x: 4, y: 0 }, D: { x: 2, y: 1.5 } },
  members: [['A', 'B'], ['B', 'C'], ['A', 'D'], ['D', 'C'], ['B', 'D']],
  loads: { B: { y: -20e3 } },
  supports: { A: 'pin', C: 'rollerY' },
};
{
  const v = unitLoadTruss(roof, AE, 'B', [0, -1]);
  approx(v.delta, 1.6875e-3, 1e-9, 'roof truss: 1.69 mm at the loaded joint');
  const k = trussStiffness(roof, AE);
  approx(-k.disp.B.y, v.delta, 1e-9, 'roof truss: stiffness gives the same drop');
  approx(k.forces.BD, 20e3, 1e-9, 'roof truss: the hanger carries the load');
  approx(unitLoadTruss(roof, AE, 'C', [1, 0]).delta, k.disp.C.x, 1e-9, 'roof truss: the roller slides by the same amount both ways');
  approx(unitLoadTruss(roof, AE, 'D', [0, -1]).delta, -k.disp.D.y, 1e-9, 'roof truss: the apex drops by the same amount both ways');
  // Energy: P Δ/2 = Σ N²L/2AE.
  const U = v.rows.reduce((s, r) => s + (r.N * r.N * r.L) / (2 * AE), 0);
  approx(0.5 * 20e3 * v.delta, U, 1e-12, 'roof truss: load work equals stored energy');
  approx(unitLoadTruss({ ...roof, loads: { B: { y: -40e3 } } }, AE, 'B', [0, -1]).delta, 2 * v.delta, 1e-12, 'double the load, double the drop');
}

// Beams: the unit-load integral against closed forms.
{
  const EI = 200e9 * (0.04 * 0.08 ** 3) / 12;
  const P = 800;
  const L = 2;
  const a = 1;
  // Cantilever fixed at x = 0, tip load: M = −P(L − x); unit load at a: m = −(a − x) for x < a.
  const d = unitLoadBeam((x) => -P * (L - x), (x) => (x < a ? -(a - x) : 0), L, EI, 4000);
  approx(d, (P / EI) * ((L * a * a) / 2 - a ** 3 / 6), 1e-6, 'cantilever midspan by unit load: 1.95 mm');
  const w = 5e3;
  const S = 4;
  const mid = unitLoadBeam((x) => (w * S * x) / 2 - (w * x * x) / 2, (x) => (x < S / 2 ? x / 2 : (S - x) / 2), S, EI, 4000);
  approx(mid, (5 * w * S ** 4) / (384 * EI), 1e-6, 'simple span midspan by unit load: 5wL⁴/384EI');
  const end = unitLoadBeam((x) => (w * S * x) / 2 - (w * x * x) / 2, (x) => 1 - x / S, S, EI, 4000);
  approx(end, (w * S ** 3) / (24 * EI), 1e-6, 'unit couple at the end gives the end slope wL³/24EI');
}

if (failed) {
  console.error(`virtualwork-selftest: ${failed} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`virtualwork-selftest: ${passed} passed`);
