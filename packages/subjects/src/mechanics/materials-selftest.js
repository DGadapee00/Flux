/**
 * Self-test for materials.js, each closed form against a different calculation.
 *
 *   node src/mechanics/materials-selftest.js
 */
import {
  axialStress, axialStiffness, barElongation, bearing, bilinear, bilinearEnergy, circleArea,
  constrainedThermal, factorOfSafety, fixedFixed, fixedFixedByStiffness, hookeStrain, hookeStress,
  inclined, inclinedByCut, lateralStrain, normalStrain, permanentSet, pinSegments, pinShear,
  rambergOsgood, rambergStress, requiredArea, requiredDiameter, resilience, shearModulus,
  taperedElongation, transform, uniaxialVolumeStrain, volumeChange,
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

console.log('Strain and Hooke');
{
  approx(normalStrain(0.2e-3, 0.2), 0.001, 1e-12, '0.20 mm on 200 mm is strain 0.001');
  approx(hookeStress(200e9, 0.0005), 100e6, 1e-12, 'strain 0.0005 at 200 GPa is 100 MPa');
  approx(hookeStrain(100e6, 200e9), 0.0005, 1e-12, '100 MPa over 200 GPa is strain 0.0005');
  // Doubling the strain doubles the stress while the response stays elastic.
  approx(hookeStress(200e9, 0.001) / hookeStress(200e9, 0.0005), 2, 1e-12, 'double the elastic strain, double the stress');
  approx(lateralStrain(0.3, 0.001), -0.0003, 1e-12, 'ν = 0.3 gives lateral strain −0.0003');
  approx(shearModulus(200e9, 0.3), 200e9 / 2.6, 1e-12, 'G = E/2(1+ν)');
  approx(uniaxialVolumeStrain(0.001, 0.3), 0.0004, 1e-12, 'linear volume strain ε(1−2ν)');
  approx(uniaxialVolumeStrain(0.001, 0.5), 0, 1e-15, 'ν = 1/2 cancels the linear volume change');
  const ex = 0.004;
  const ey = lateralStrain(0.3, ex);
  const exact = volumeChange(ex, ey, ey);
  const series = ex * (1 - 2 * 0.3) + ex * ex * (0.3 * 0.3 - 2 * 0.3) + 0.3 * 0.3 * ex ** 3;
  approx(series, exact, 1e-12, 'the cubic expansion matches the exact volume change');
  approx(resilience(250e6, 200e9), 156250, 1e-12, 'resilience of 250 MPa at 200 GPa is 156.25 kJ/m³');
  // The triangle σ_Y²/2E against a trapezoid sum under the elastic line.
  let area = 0;
  const n = 4000;
  const eyld = 250e6 / 200e9;
  for (let i = 0; i < n; i++) {
    const e0 = (eyld * i) / n;
    const e1 = (eyld * (i + 1)) / n;
    area += 0.5 * (200e9 * e0 + 200e9 * e1) * (e1 - e0);
  }
  approx(area, resilience(250e6, 200e9), 1e-9, 'trapezoids under the elastic line match σ_Y²/2E');
  const past = bilinear(0.01, 200e9, 250e6, 10e9);
  approx(past.stress, 337.5e6, 1e-12, 'bilinear stress at strain 0.01');
  approx(permanentSet(0.01, past.stress, 200e9), 0.0083125, 1e-12, 'permanent set after unloading from strain 0.01');
  approx(bilinearEnergy(0.01, 200e9, 250e6, 10e9), 0.5 * 250e6 * eyld + 0.5 * (250e6 + past.stress) * (0.01 - eyld), 1e-9, 'bilinear energy is the triangle plus the plastic trapezoid');
  approx(rambergOsgood(276e6, 68.9e9, 276e6, 10), 276e6 / 68.9e9 + 0.002, 1e-12, 'at the offset yield the plastic strain is 0.002');
  approx(rambergStress(276e6 / 68.9e9 + 0.002, 68.9e9, 276e6, 10), 276e6, 1e-9, 'bisection recovers the offset yield');
}

console.log('Axial deformation');
{
  const segs = [
    { N: 20e3, L: 0.4, A: 200e-6, E: 200e9 },
    { N: 8e3, L: 0.6, A: 100e-6, E: 200e9 },
  ];
  const byHand = (20e3 * 0.4) / (200e-6 * 200e9) + (8e3 * 0.6) / (100e-6 * 200e9);
  approx(barElongation(segs), byHand, 1e-12, 'two segments add as NL/AE');
  // Doubling every force doubles the elongation.
  approx(barElongation(segs.map((s) => ({ ...s, N: 2 * s.N }))), 2 * byHand, 1e-12, 'double the forces, double the elongation');
  const d0 = 0.04;
  const d1 = 0.02;
  const closed = taperedElongation(30e3, 0.8, 70e9, d0, d1);
  let quad = 0;
  const n = 8000;
  const dx = 0.8 / n;
  for (let i = 0; i < n; i++) {
    const x = (i + 0.5) * dx;
    const d = d0 + (d1 - d0) * (x / 0.8);
    const A = (Math.PI * d * d) / 4;
    quad += (30e3 / (A * 70e9)) * dx;
  }
  approx(quad, closed, 1e-6, 'a linear taper matches ∫ P/(AE) dx');
  const ff = fixedFixed(12e3, 2, 0.5);
  const stiff = fixedFixedByStiffness(12e3, 2, 0.5, 400e-6, 200e9);
  approx(ff.left, 9e3, 1e-12, 'the left wall of a fixed-fixed bar carries P(L−a)/L');
  approx(ff.left, stiff.left, 1e-12, 'the force method matches the two springs');
  approx(ff.left + ff.right, 12e3, 1e-12, 'the two reactions sum to P');
  // A shorter left side is stiffer, so it carries more than half.
  ok(fixedFixed(10e3, 2, 0.4).left > 5e3, 'the shorter segment carries more than half');
  const hot = constrainedThermal(200e9, 12e-6, 40, { L: 3, gap: 0 });
  approx(hot.stress, -200e9 * 12e-6 * 40, 1e-9, 'a fully held bar stresses at −EαΔT');
  const open = constrainedThermal(200e9, 12e-6, 10, { L: 2, gap: 0.001 });
  ok(open.stress === 0 && open.free < 0.001, 'a gap that is still open carries no stress');
  const shut = constrainedThermal(200e9, 12e-6, 50, { L: 2, gap: 0.0005 });
  approx(shut.stress, -200e9 * (12e-6 * 50 - 0.0005 / 2), 1e-6, 'after the gap closes, only the extra expansion stresses the bar');
  approx(axialStiffness(200e-6, 200e9, 1), 40e6, 1e-12, 'AE/L for a 200 mm² bar one metre long is 40 MN/m');
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
