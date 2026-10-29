/**
 * Second methods for deformation.js.
 *   node src/mechanics/deformation-selftest.js
 */
import { bracket, holeInStrip, jointFromElongations, kirsch, ktEllipse, ktStrip, ktTip, pinJoint, threeBar } from './deformation.js';
import { solveTruss, memberForce } from './truss.js';

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
const ok = (c, name) => (c ? (passed += 1) : (failed += 1, console.error(`FAIL ${name}`)));

const E = 200e9;
const A = 400e-6;

// A 3-4-5 bracket: level bar 2 m, slanted bar rises 1.5 m, 30 kN down.
{
  const b = bracket(30e3, 2, 1.5, A, A, E);
  approx(b.Ns, 50e3, 1e-12, 'slanted bar carries P/sin θ');
  approx(b.Nh, -40e3, 1e-12, 'level bar carries P cot θ in compression');
  approx(b.dh, -1e-3, 1e-12, 'level bar shortens 1.00 mm');
  approx(b.ds, 1.5625e-3, 1e-12, 'slanted bar stretches 1.5625 mm');
  approx(b.u, -1e-3, 1e-12, 'joint moves 1.00 mm toward the wall');
  approx(b.v, -3.9375e-3, 1e-12, 'joint drops 3.9375 mm');
  // Second method: the stiffness solve on the same joint, with no statics done by hand.
  const s = pinJoint([0, 0], [{ from: [-2, 0], A, E }, { from: [-2, 1.5], A, E }], [0, -30e3]);
  approx(s.u, b.u, 1e-9, 'stiffness method gives the same u');
  approx(s.v, b.v, 1e-9, 'stiffness method gives the same v');
  approx(s.members[1].N, 50e3, 1e-9, 'stiffness method gives the same bar force');
  approx(s.work, s.energy, 1e-9, 'load work equals stored energy');
  approx(-0.5 * 30e3 * b.v, (40e3 ** 2 * 2 + 50e3 ** 2 * 2.5) / (2 * A * E), 1e-12, 'Pv/2 = Σ N²L/2AE');
  ok(s.residual < 1e-6, 'joint in equilibrium');
  // Method of joints on the same bracket agrees with the statics.
  const sol = solveTruss({
    joints: { A: { x: -2, y: 0, z: 0 }, C: { x: -2, y: 1.5, z: 0 }, B: { x: 0, y: 0, z: 0 } },
    members: [['A', 'B'], ['C', 'B']],
    loads: { B: { y: -30e3 } },
    supports: { A: 'pin', C: 'pin' },
  });
  approx(memberForce(sol, 'C', 'B'), 50e3, 1e-9, 'method of joints: slanted bar');
  approx(memberForce(sol, 'A', 'B'), -40e3, 1e-9, 'method of joints: level bar');
  // Scaling: double the load, double the drop; double both areas, halve it.
  approx(bracket(60e3, 2, 1.5, A, A, E).v, 2 * b.v, 1e-12, 'double P, double the drop');
  approx(bracket(30e3, 2, 1.5, 2 * A, 2 * A, E).v, b.v / 2, 1e-12, 'double A, half the drop');
  const j = jointFromElongations([0, 0], [[-2, 0], [-2, 1.5]], [b.dh, b.ds]);
  approx(j.v, b.v, 1e-12, 'compatibility helper agrees');
}

// Three bars, θ = 30°, 60 kN.
{
  const L = 1.2;
  const t = threeBar(60e3, L, 30, 300e-6, E);
  const c = Math.cos(Math.PI / 6);
  approx(t.Nm + 2 * t.Ns * c, 60e3, 1e-12, 'three bars: vertical equilibrium');
  const side = L / c;
  const s = pinJoint([0, 0], [
    { from: [-side * Math.sin(Math.PI / 6), L], A: 300e-6, E },
    { from: [0, L], A: 300e-6, E },
    { from: [side * Math.sin(Math.PI / 6), L], A: 300e-6, E },
  ], [0, -60e3]);
  approx(s.members[1].N, t.Nm, 1e-9, 'three bars: stiffness method gives the middle force');
  approx(s.members[0].N, t.Ns, 1e-9, 'three bars: stiffness method gives the side force');
  approx(-s.v, t.drop, 1e-9, 'three bars: stiffness method gives the drop');
  approx(Math.abs(s.u), 0, 1, 'three bars: symmetric, so no sideways move');
  approx(threeBar(60e3, L, 0, 300e-6, E).Nm, 20e3, 1e-12, 'θ = 0: three parallel bars share P/3');
  ok(t.Nm > 20e3, 'the middle bar takes more than a third');
}

// Kirsch: traction-free edge, Kt = 3, far field, equilibrium across the net section.
{
  const S = 50e6;
  const a = 0.006;
  const edge = kirsch(S, a, a, 90);
  approx(edge.st, 3 * S, 1e-12, 'Kirsch: 3S at the edge across the load');
  approx(kirsch(S, a, a, 0).st, -S, 1e-12, 'Kirsch: −S at the edge on the load axis');
  approx(Math.abs(edge.sr) + Math.abs(edge.srt) + S, S, 1e-12, 'Kirsch: no traction on the hole');
  const far = kirsch(S, a, 1e3 * a, 90);
  approx(far.st, S, 1e-5, 'Kirsch: S far away');
  // ∫ σθ(r, 90°) dr from a to R equals S R as R grows: the hole's missing force moves to its edge.
  const R = 400 * a;
  const n = 200000;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const r = a + (R - a) * (i + 0.5) / n;
    sum += kirsch(S, a, r, 90).st;
  }
  approx((sum * (R - a)) / n, S * R, 2e-3, 'Kirsch: the net section carries the gross force');
  approx(kirsch(S, a, 2 * a, 90).st, S * (1 + 1 / 8 + 3 / 32), 1e-12, 'Kirsch: 1.22 S one radius out');
}

// Inglis and Heywood agree with Kirsch at their limits.
{
  approx(ktEllipse(0.01, 0.01), 3, 1e-12, 'a circle is an ellipse with a = b');
  approx(ktTip(0.01, 0.01), 3, 1e-12, 'tip-radius form at a = ρ');
  approx(ktTip(0.01, 0.002 ** 2 / 0.01), ktEllipse(0.01, 0.002), 1e-12, 'ρ = b²/a links the two forms');
  approx(ktStrip(1e-9, 1), 3, 1e-8, 'a pinhole in a strip tends to 3');
  const h = holeInStrip(30e3, 0.06, 0.012, 0.01);
  approx(h.net, 62.5e6, 1e-12, 'net stress 62.5 MPa');
  approx(h.Kt, 2.512, 1e-12, 'Kt at d/w = 0.2');
  approx(h.peak, 157e6, 1e-12, 'peak 157 MPa');
  ok(h.peak > 3 * h.gross, 'finite width raises the peak above 3 times the gross stress');
}

if (failed) {
  console.error(`deformation-selftest: ${failed} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`deformation-selftest: ${passed} passed`);
