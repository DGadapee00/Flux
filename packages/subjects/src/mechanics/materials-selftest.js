/**
 * Self-test for materials.js, each closed form against a different calculation.
 *
 *   node src/mechanics/materials-selftest.js
 */
import {
  axialStress, axialStiffness, barElongation, bearing, bilinear, bilinearEnergy, circleArea,
  circleSection, combinedCircle, combinedReduced, constrainedThermal, cylinderSplitForce,
  eigen2, factorOfSafety, fixedFixed, fixedFixedByStiffness, hitchSides,
  hooke3, hooke3Deviator, hookeStrain, hookeStress, hoopFromSplit, sphereFromCap,
  inclined, inclinedByCut, lateralStrain, normalStrain, permanentSet, pinSegments, pinShear,
  principal2, rambergOsgood, rambergStress, requiredArea, requiredDiameter, resilience, shearModulus,
  flexureStress, rectSection, teeSection, flexureFibers, rectFibersReduced, simpleBendingStress,
  flexureBalance, rectBands, teeBands,
  bandQ, rectShear, iSection, iBands, boxSection, boxBands, stackedBoards,
  shearBalance, shearShare, shearFlow, fastenerSpacing, fastenerForce,
  taperedElongation, thinCylinder, thinSphere, traction, transform, trescaPlane,
  uniaxialVolumeStrain, volumeChange, vonMisesComponents, vonMisesPlane,
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

console.log('Thin wall and three-dimensional Hooke');
{
  const cyl = thinCylinder(2e6, 0.2, 0.005);
  approx(cyl.hoop, 80e6, 1e-12, 'hoop stress pr/t is 80 MPa');
  approx(cyl.axial, 40e6, 1e-12, 'longitudinal stress is half the hoop');
  approx(hoopFromSplit(2e6, 0.2, 0.005), cyl.hoop, 1e-12, 'the half-cylinder balance returns pr/t');
  approx(thinCylinder(4e6, 0.2, 0.005).hoop, 2 * cyl.hoop, 1e-12, 'double the pressure, double the hoop stress');
  let split = 0;
  const n = 8000;
  const dth = Math.PI / n;
  for (let i = 0; i < n; i++) {
    const th = (i + 0.5) * dth;
    split += 2e6 * Math.sin(th) * 0.2 * 1 * dth;
  }
  approx(split, cylinderSplitForce(2e6, 0.2, 1), 1e-6, '∫ p sinθ r dθ matches 2prL');
  const sph = thinSphere(2e6, 0.2, 0.005);
  approx(sph.hoop, 40e6, 1e-12, 'a sphere membrane stress is pr/2t');
  approx(sph.hoop, sph.axial, 1e-12, 'the two sphere stresses match');
  approx(sphereFromCap(2e6, 0.2, 0.005), sph.hoop, 1e-12, 'the cap balance returns pr/2t');
  const E = 200e9;
  const nu = 0.3;
  const uni = hooke3(100e6, 0, 0, E, nu);
  approx(uni.ex, hookeStrain(100e6, E), 1e-12, 'one stress reduces to σ/E');
  approx(uni.ey, lateralStrain(nu, uni.ex), 1e-12, 'the side strain is −ν times the axial strain');
  const dev = hooke3Deviator(80e6, -20e6, 40e6, E, nu);
  const dir = hooke3(80e6, -20e6, 40e6, E, nu);
  approx(dev.ex, dir.ex, 1e-12, 'the deviator split matches generalized Hooke in x');
  approx(dev.ey, dir.ey, 1e-12, 'the deviator split matches generalized Hooke in y');
  approx(dev.ez, dir.ez, 1e-12, 'the deviator split matches generalized Hooke in z');
  const hydro = hooke3(50e6, 50e6, 50e6, E, nu);
  approx(hydro.vol, (150e6 * (1 - 2 * nu)) / E, 1e-12, 'hydrostatic volume strain is (1−2ν) times the stress sum over E');
  approx(hooke3(100e6, 100e6, 0, E, nu).ex, 0.7 * uni.ex, 1e-12, 'an equal transverse tension cuts the axial strain to 0.7');
}

console.log('Principals, yield, combined stress');
{
  const sx = 80e6;
  const sy = 20e6;
  const txy = 30e6;
  const p = principal2(sx, sy, txy);
  const e = eigen2(sx, sy, txy);
  approx(p.s1, e.s1, 1e-12, 'the larger principal matches the eigenvalue');
  approx(p.s2, e.s2, 1e-12, 'the smaller principal matches the eigenvalue');
  const turned = transform(sx / 1e6, sy / 1e6, txy / 1e6, (p.theta * 180) / Math.PI);
  approx(turned.sx, p.s1 / 1e6, 1e-12, 'rotating to θp returns σ1');
  approx(turned.txy, 0, 1e-9, 'shear is zero on the principal plane');
  const face = traction(sx, sy, txy, 35);
  const eq = transform(sx, sy, txy, 35);
  approx(face.sx, eq.sx, 1e-12, 'the traction normal matches the double-angle formula');
  approx(face.txy, eq.txy, 1e-12, 'the traction shear matches the double-angle formula');
  let maxShear = 0;
  for (let th = -90; th <= 90; th += 0.25) maxShear = Math.max(maxShear, Math.abs(transform(sx, sy, txy, th).txy));
  approx(maxShear, p.R, 1e-6, 'the largest |τ| on a scan is the circle radius');
  approx(vonMisesPlane(sx, sy, txy), vonMisesComponents(sx, sy, txy), 1e-12, 'von Mises from principals matches the component form');
  approx(trescaPlane(100e6, 0, 0), 100e6, 1e-12, 'uniaxial Tresca equals the stress');
  approx(vonMisesPlane(100e6, 0, 0), 100e6, 1e-12, 'uniaxial von Mises equals the stress');
  approx(trescaPlane(0, 0, 40e6), 80e6, 1e-12, 'pure shear: Tresca is 2τ');
  approx(vonMisesPlane(0, 0, 40e6), 40e6 * Math.sqrt(3), 1e-12, 'pure shear: von Mises is τ√3');
  ok(trescaPlane(0, 0, 40e6) > vonMisesPlane(0, 0, 40e6), 'Tresca is the larger of the two in pure shear');

  const d = 0.04;
  const bar = combinedCircle(10e3, 400, 300, d);
  const red = combinedReduced(10e3, 400, 300, d);
  approx(bar.sx, red.sx, 1e-12, 'Mc/I + P/A matches 32M/(πd³) + 4P/(πd²)');
  approx(bar.txy, red.txy, 1e-12, 'Tc/J matches 16T/(πd³)');
  approx(bar.vm, vonMisesComponents(red.sx, 0, red.txy), 1e-12, 'the bar von Mises matches the components');
  const twice = combinedCircle(10e3, 800, 300, d);
  approx(twice.sx - red.axial, 2 * (bar.sx - red.axial), 1e-12, 'double the moment, double the bending stress');
  const sec = circleSection(d);
  approx(sec.J, 2 * sec.I, 1e-12, 'J of a circle is 2I');

  const shank = hitchSides(600 * 4.4482216152605, 600 * 4.4482216152605, 0.0254, 0.0254);
  const bend = (32 * (600 * 4.4482216152605 * 0.0254)) / (Math.PI * 0.0254 ** 3);
  const axial = -(4 * (600 * 4.4482216152605)) / (Math.PI * 0.0254 ** 2);
  approx(shank.bend, bend, 1e-12, 'the shank bending stress is 32M/(πd³)');
  approx(shank.axial, axial, 1e-12, 'the tongue load is 4W/(πd²) in compression');
  approx(shank.compression, axial - bend, 1e-12, 'compression side is axial minus bending');
  approx(shank.peak, shank.compression, 1e-12, 'the compression side has the larger magnitude');
  approx(hitchSides(600 * 4.4482216152605, 0, 0.0254, 0.0254).peak, axial, 1e-12, 'no horizontal force leaves only the axial stress');
}

console.log('\nFlexure');
{
  const M = 2000;
  const b = 0.04;
  const h = 0.08;
  const rect = rectSection(b, h);
  const fibers = flexureFibers(M, rect);
  const reduced = rectFibersReduced(M, b, h);
  approx(fibers.top, reduced.top, 1e-12, 'rectangle top stress matches 6M/(bh²)');
  approx(fibers.bot, -fibers.top, 1e-12, 'a rectangle has equal tension and compression');
  approx(fibers.top, -46.875e6, 1e-12, '2 kN·m on a 40×80 mm rectangle is 46.875 MPa');
  const deep = flexureFibers(M, rectSection(b, 2 * h));
  approx(deep.top, fibers.top / 4, 1e-12, 'double the depth, quarter the bending stress');
  const wide = flexureFibers(M, rectSection(2 * b, h));
  approx(wide.top, fibers.top / 2, 1e-12, 'double the width, halve the bending stress');
  const bal = flexureBalance(M, rect.I, rectBands(b, h));
  approx(bal.axial, 0, 1e-9, '∫σ dA over the rectangle is zero');
  approx(bal.moment, M, 1e-6, '−∫y σ dA returns the moment');

  const bf = 0.12;
  const tf = 0.012;
  const tw = 0.012;
  const hw = 0.1;
  const tee = teeSection(bf, tf, tw, hw);
  ok(tee.ybar > tee.height / 2, 'the tee neutral axis sits above mid-height');
  const tfib = flexureFibers(M, tee);
  ok(Math.abs(tfib.bot) > Math.abs(tfib.top), 'the bottom fiber, farther from the axis, carries more stress');
  const tbal = flexureBalance(M, tee.I, teeBands(tee, bf, tf, tw, hw));
  approx(tbal.axial, 0, 1e-6, '∫σ dA over the tee is zero');
  approx(tbal.moment, M, 1e-4, '−∫y σ dA returns the tee moment');
  approx(flexureStress(M, tee.topY, tee.I), tfib.top, 1e-12, 'top fiber is −M y / I');
  const w = 5000;
  const L = 4;
  const beamM = (w * L * L) / 8;
  approx(simpleBendingStress(w, L, b, h), flexureFibers(beamM, rectSection(b, h)).bot, 1e-12,
    'wL²/8 times 6/(bh²) matches the fiber stress');
  approx(simpleBendingStress(2 * w, 2 * L, b, h), 8 * simpleBendingStress(w, L, b, h), 1e-12,
    'double the span and the load: stress scales with w L²');
}

console.log('\nTransverse shear');
{
  const V = 10e3;
  const b = 0.04;
  const h = 0.08;
  const mid = rectShear(V, b, h, 0);
  approx(mid.tmax, (3 * V) / (2 * b * h), 1e-12, 'peak rectangle shear is 3V/2A');
  approx(mid.tau, mid.tmax, 1e-12, 'the peak sits on the neutral axis');
  approx(mid.tau, 4.6875e6, 1e-12, '10 kN on a 40×80 mm rectangle peaks at 4.6875 MPa');
  const quarter = rectShear(V, b, h, h / 4);
  approx(quarter.tau, 0.75 * mid.tmax, 1e-12, 'at h/4 the parabola is three quarters of the peak');
  approx(rectShear(V, b, h, h / 2).tau, 0, 1e-12, 'the outer fiber carries no shear');
  approx(rectShear(2 * V, b, h, 0).tau, 2 * mid.tau, 1e-12, 'double the shear, double the stress');
  approx(rectShear(V, b, 2 * h, 0).tau, mid.tau / 2, 1e-12, 'double the depth, halve the peak shear');
  const carried = shearBalance(V, mid.I, rectBands(b, h));
  approx(carried, V, 1e-6, '∫τ dA over the rectangle returns V');

  const eye = iSection(0.12, 0.01, 0.006, 0.16);
  const bands = iBands(eye);
  const Qhand = eye.Af * eye.yf + (eye.tw * eye.hw ** 2) / 8;
  approx(bandQ(bands, 0), Qhand, 1e-12, 'Q at the I neutral axis is flange plus half the web');
  approx(shearBalance(20e3, eye.I, bands), 20e3, 1e-6, '∫τ dA over the I returns V');
  const share = shearShare(20e3, eye.I, bands, -eye.hw / 2, eye.hw / 2);
  ok(share > 0.8, 'the web carries most of the shear');
  approx(shearShare(20e3, eye.I, bands, -eye.H / 2, eye.H / 2), 1, 1e-6, 'the whole I carries all of V');

  const boards = stackedBoards(0.04, 0.03, 3);
  const Qboard = 0.04 * 0.03 * 0.03;
  approx(boards.Q, Qboard, 1e-12, 'the top board first moment is A times its centroid');
  const q = shearFlow(8e3, boards.Q, boards.I);
  approx(fastenerSpacing(q, 1200, 2), (2 * 1200) / q, 1e-12, 'spacing is nF/q');
  approx(fastenerForce(q, 0.02, 2), (q * 0.02) / 2, 1e-12, 'each fastener carries q s / n');
  approx(shearFlow(16e3, boards.Q, boards.I), 2 * q, 1e-12, 'double the shear, double the flow');
  approx(fastenerSpacing(2 * q, 1200, 2), fastenerSpacing(q, 1200, 2) / 2, 1e-12, 'double the flow, halve the spacing');

  const box = boxSection(3.5 * 0.0254, 3 * 0.0254, (15 / 32) * 0.0254, 24 * 0.0254);
  const Qin = 3.5 * 3 * 10.5;
  const Iin = 2 * (3.5 * 27 / 12 + 10.5 * 10.5 ** 2) + 2 * ((15 / 32) * 24 ** 3 / 12);
  approx(box.Qf / 0.0254 ** 3, Qin, 1e-9, 'flange Q in inches is A times 10.5 in');
  approx(box.I / 0.0254 ** 4, Iin, 1e-9, 'box I in inches matches the parallel-axis sum');
  approx(shearBalance(1000, box.I, boxBands(box)), 1000, 1e-6, '∫τ dA over the box returns V');
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
