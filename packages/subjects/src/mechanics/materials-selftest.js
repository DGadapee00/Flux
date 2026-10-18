/**
 * Self-test for materials.js, each closed form against a different calculation.
 *
 *   node src/mechanics/materials-selftest.js
 */
import {
  axialStress, bearing, circleArea, factorOfSafety, inclined, inclinedByCut, pinSegments, pinShear,
  requiredArea, requiredDiameter, transform,
} from './materials.js';
import { solveTruss, memberForce, methodOfSections } from './truss.js';

let passed = 0;
let failed = 0;

function approx(a, b, tol, name) {
  const scaleB = b !== 0 ? Math.abs(b) : 1;
  const good = Number.isFinite(a) && Math.abs(a - b) <= tol * scaleB;
  if (good) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}`);
    console.log(`        got ${a}  expected ${b}`);
  }
}
const ok = (c, name) => (c ? (passed += 1, console.log(`  PASS  ${name}`)) : (failed += 1, console.log(`  FAIL  ${name}`)));

console.log('Average stress');
{
  // 10 kN on 100 mm² is 100 MPa, by hand.
  approx(axialStress(10e3, 100e-6), 100e6, 1e-12, '10 kN on 100 mm² is 100 MPa');
  approx(circleArea(0.02), 3.141592653589793e-4, 1e-12, 'a 20 mm circle is 314.16 mm²');
  // The area of a circle by summing thin rings, against πd²/4.
  let A = 0;
  const n = 20000;
  for (let i = 0; i < n; i++) {
    const r = ((i + 0.5) / n) * 0.01;
    A += 2 * Math.PI * r * (0.01 / n);
  }
  approx(A, circleArea(0.02), 1e-6, 'πd²/4 equals the sum of thin rings');
}

console.log('Inclined plane');
{
  const P = 10e3;
  const A = 100e-6;
  const at30 = inclined(P, A, 30);
  approx(at30.sigma, 75e6, 1e-12, 'θ = 30°: σ = 100 cos²30° = 75 MPa');
  approx(at30.tau, 43.30127018922193e6, 1e-12, 'θ = 30°: τ = 50 sin 60° = 43.30 MPa');
  let worst = 0;
  let worstT = 0;
  for (let th = -80; th <= 80; th += 2.5) {
    const a = inclined(P, A, th);
    const b = inclinedByCut(P, A, th);
    const c = transform(P / A, 0, 0, th);
    worst = Math.max(worst, Math.abs(a.sigma - b.sigma), Math.abs(a.tau - b.tau));
    worstT = Math.max(worstT, Math.abs(a.sigma - c.sx), Math.abs(a.tau + c.txy));
  }
  approx(worst / (P / A), 0, 1e-12, 'the closed form equals the cut\'s force balance from −80° to 80°');
  approx(worstT / (P / A), 0, 1e-12, 'the closed form equals the stress transformation (τ = −τx\'y\')');

  // The largest shear by scanning, not by calculus.
  let best = { th: 0, tau: -Infinity };
  for (let th = 0; th <= 90; th += 0.01) {
    const t = inclined(P, A, th).tau;
    if (t > best.tau) best = { th, tau: t };
  }
  approx(best.th, 45, 1e-3, 'the largest shear is on the 45° plane');
  approx(best.tau, P / (2 * A), 1e-9, 'and it is half of P/A');

  // σ on a plane and on the plane 90° from it add to P/A (the trace is invariant).
  const s1 = inclined(P, A, 20).sigma;
  const s2 = inclined(P, A, 110).sigma;
  approx(s1 + s2, P / A, 1e-12, 'σ(θ) + σ(θ + 90°) = P/A');
  // The two segments carry equal and opposite internal force on the cut.
  const cut = inclinedByCut(P, A, 35);
  approx(Math.hypot(cut.N, cut.V), P, 1e-12, 'N and V on the cut recombine into P');
}

console.log('Transformation');
{
  // Eigenvalues of [[80, 30], [30, 20]] MPa: 50 ± √(30² + 30²).
  const r = Math.hypot(30, 30);
  const thp = (0.5 * Math.atan2(2 * 30, 80 - 20)) / (Math.PI / 180);
  const t = transform(80, 20, 30, thp);
  approx(t.sx, 50 + r, 1e-12, 'σ₁ by rotating to the principal angle equals the larger eigenvalue');
  approx(t.sy, 50 - r, 1e-12, 'σ₂ equals the smaller eigenvalue');
  approx(t.txy, 0, 1e-12, 'no shear on the principal planes');
  const s = transform(80, 20, 30, thp + 45);
  approx(Math.abs(s.txy), r, 1e-12, 'the largest in-plane shear is 45° from the principal planes');
}

console.log('Pins and bearing');
{
  const P = 12e3;
  const d = 0.012;
  approx(pinShear(P, d, 1), P / circleArea(d), 1e-12, 'single shear: τ = P/A');
  approx(pinShear(P, d, 2), pinShear(P, d, 1) / 2, 1e-12, 'double shear halves τ');
  const one = pinSegments(P, 1);
  const two = pinSegments(P, 2);
  ok(one.residual === 0 && two.residual === 0, 'the pin is in equilibrium in both arrangements');
  approx(one.shears[0], P, 1e-12, 'single shear: the one plane carries P');
  ok(two.shears.length === 2 && two.shears.every((V) => Math.abs(V - P / 2) < 1e-9), 'double shear: each plane carries P/2');
  approx(bearing(P, d, 0.01), 100e6, 1e-12, '12 kN on a 12 mm pin in a 10 mm plate bears 100 MPa');
}

console.log('Factor of safety');
{
  const A = requiredArea(40e3, 250e6, 2);
  approx(A, 320e-6, 1e-12, '40 kN, σY = 250 MPa, FS = 2 needs 320 mm²');
  approx(factorOfSafety(250e6, axialStress(40e3, A)), 2, 1e-12, 'that area gives back FS = 2');
  const d = requiredDiameter(30e3, 100e6, 1.5, 2);
  approx(factorOfSafety(100e6, pinShear(30e3, d, 2)), 1.5, 1e-12, 'the required pin diameter gives back FS = 1.5');
}

console.log('Truss member stress');
{
  // A three-bar truss: joints against sections for the member force, then σ = F/A.
  const truss = {
    joints: { A: { x: 0, y: 0, z: 0 }, B: { x: 4, y: 0, z: 0 }, C: { x: 2, y: 3, z: 0 } },
    members: [['A', 'B'], ['B', 'C'], ['A', 'C']],
    loads: { C: { x: 0, y: -10e3 } },
    supports: { A: 'pin', B: 'rollerY' },
  };
  const sol = solveTruss(truss);
  approx(sol.worstResidual, 0, 1e-9, 'every joint closes');
  // By hand: AC and BC each carry 5 kN vertically, so F = −5 kN · L/3 with L = √13.
  approx(memberForce(sol, 'A', 'C'), (-5e3 * Math.sqrt(13)) / 3, 1e-9, 'AC by hand');
  approx(memberForce(sol, 'A', 'B'), (5e3 * 2) / 3, 1e-9, 'AB by hand');
  approx(axialStress(memberForce(sol, 'A', 'B'), 50e-6), (5e3 * 2) / 3 / 50e-6, 1e-12, 'σ = F/A');
  const sec = methodOfSections({
    joints: { A: { x: 0, y: 0, z: 0 }, B: { x: 3, y: 0, z: 0 }, C: { x: 6, y: 0, z: 0 }, D: { x: 1.5, y: 2, z: 0 }, E: { x: 4.5, y: 2, z: 0 } },
    members: [['A', 'B'], ['B', 'C'], ['A', 'D'], ['D', 'B'], ['B', 'E'], ['E', 'C'], ['D', 'E']],
    loads: { B: { x: 0, y: -8e3 } },
    supports: { A: 'pin', C: 'rollerY' },
  }, ['A', 'B', 'D']);
  ok(sec.ok !== false, 'the section through DE, BE and BC is solvable');
  const full = solveTruss({
    joints: { A: { x: 0, y: 0, z: 0 }, B: { x: 3, y: 0, z: 0 }, C: { x: 6, y: 0, z: 0 }, D: { x: 1.5, y: 2, z: 0 }, E: { x: 4.5, y: 2, z: 0 } },
    members: [['A', 'B'], ['B', 'C'], ['A', 'D'], ['D', 'B'], ['B', 'E'], ['E', 'C'], ['D', 'E']],
    loads: { B: { x: 0, y: -8e3 } },
    supports: { A: 'pin', C: 'rollerY' },
  });
  for (const c of sec.cut) approx(c.force, full.forces[c.member], 1e-9, `${c.member}: sections equal joints`);
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
