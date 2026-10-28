/**
 * Self-test for torsion.js. The closed-form polar moment against a trapezoid
 * of ∫ ρ² dA, the recovered torque against that same integral, and the
 * fixed-end split against the two-spring assembly.
 *
 *   node src/mechanics/torsion-selftest.js
 */
import { FT_LBF_PER_S_PER_HP, M_PER_FT, N_PER_LBF } from '../convert.js';
import { circleSection } from './materials.js';
import {
  fixedFixedTorsion, gearPair, polarJ, polarJQuadrature, roundShaft, sectionGap,
  seriesTwist, solidDiameterForShear, solidDiameterForTwist, solidDiameterRequired,
  torqueFromHorsepower, torqueFromPower, torqueFromShearField, torsionShear, twistAngle,
} from './torsion.js';

let passed = 0;
let failed = 0;

function approx(a, b, tol, name) {
  const scale = Math.max(Math.abs(b), 1e-12);
  const good = Number.isFinite(a) && Math.abs(a - b) <= tol * scale;
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

const G = 75e9;
const d = 0.04;
const T = 500;
const L = 1.2;

console.log('Polar moment');
{
  const solid = polarJ(d / 2, 0);
  approx(solid, circleSection(d).J, 1e-15, 'solid J matches circleSection');
  approx(solid, (Math.PI * d ** 4) / 32, 1e-15, 'solid J is pi d^4/32');
  const hollow = polarJ(0.02, 0.015);
  approx(hollow, (Math.PI / 32) * (0.04 ** 4 - 0.03 ** 4), 1e-15, 'hollow J is pi/32 (do^4 - di^4)');
  approx(hollow / solid, 1 - 0.75 ** 4, 1e-15, 'same outside, J ratio is 1 - (di/do)^4');
  const gap = sectionGap(T, d / 2, 0);
  ok(gap.gap < 1e-6, `quadrature gap ${gap.gap} is under 1e-6`);
  const gapH = sectionGap(T, 0.02, 0.015);
  ok(gapH.gap < 1e-6, `hollow quadrature gap ${gapH.gap} is under 1e-6`);
  const coarse = polarJQuadrature(0.02, 0, 40);
  const fine = polarJQuadrature(0.02, 0, 160);
  ok(Math.abs(fine - solid) < Math.abs(coarse - solid), 'a finer grid is closer to the closed J');
}

console.log('Stress and angle');
{
  const shaft = roundShaft(T, L, G, d, 0);
  approx(shaft.tauMax, (16 * T) / (Math.PI * d ** 3), 1e-12, 'outer shear is 16T/(pi d^3)');
  approx(shaft.tauIn, 0, 1e-12, 'the centre of a solid shaft is unstressed');
  approx(shaft.phi, (T * L) / (G * shaft.J), 1e-12, 'angle is TL/GJ');
  const twice = roundShaft(2 * T, L, G, d, 0);
  approx(twice.tauMax, 2 * shaft.tauMax, 1e-12, 'double the torque doubles the stress');
  approx(twice.phi, 2 * shaft.phi, 1e-12, 'double the torque doubles the angle');
  const longer = roundShaft(T, 2 * L, G, d, 0);
  approx(longer.phi, 2 * shaft.phi, 1e-12, 'double the length doubles the angle');
  approx(longer.tauMax, shaft.tauMax, 1e-12, 'length does not change the stress');
  const thick = roundShaft(T, L, G, 2 * d, 0);
  approx(thick.tauMax, shaft.tauMax / 8, 1e-12, 'double the diameter divides the stress by 8');
  approx(thick.phi, shaft.phi / 16, 1e-12, 'double the diameter divides the angle by 16');
  const tube = roundShaft(T, L, G, d, 0.03);
  approx(tube.tauIn, tube.tauMax * 0.75, 1e-12, 'inside stress is (di/do) times the outside stress');
  approx(tube.strength, 1 - 0.75 ** 4, 1e-12, 'strength ratio at the same outside diameter');
  approx(tube.areaFrac, 1 - 0.75 ** 2, 1e-12, 'area ratio at the same outside diameter');
}

console.log('Power');
{
  const si = torqueFromPower(20e3, 1800);
  approx(si.omega, 1800 * (2 * Math.PI) / 60, 1e-15, '1800 rpm is 60 pi rad/s');
  approx(si.T, 20e3 / si.omega, 1e-15, 'torque is power over omega');
  const fast = torqueFromPower(20e3, 3600);
  approx(fast.T, si.T / 2, 1e-12, 'double the speed halves the torque');
  const hp = torqueFromHorsepower(5, 1750);
  const watts = 5 * FT_LBF_PER_S_PER_HP * N_PER_LBF * M_PER_FT;
  const fromW = torqueFromPower(watts, 1750);
  approx(hp.T, fromW.T, 1e-12, 'horsepower and watts give the same torque');
  const gears = gearPair(si.T, 1800, 20, 40);
  approx(gears.T2, 2 * si.T, 1e-15, 'a 2:1 reduction doubles the torque');
  approx(gears.rpm2, 900, 1e-15, 'the output turns at half speed');
  approx(gears.T2 * gears.rpm2, si.T * 1800, 1e-12, 'the two shafts carry the same power');
}

console.log('Series and fixed ends');
{
  const series = seriesTwist([
    { d: 0.04, L: 0.8 },
    { d: 0.025, L: 0.4 },
  ], G, 400);
  const byHand = series.parts.reduce((s, p) => s + twistAngle(400, p.L, G, p.J), 0);
  approx(series.phi, byHand, 1e-12, 'the series angle is the sum of the segments');
  approx(series.phiK, series.phi, 1e-12, 'the series spring matches the sum');
  ok(series.parts[1].phi > series.parts[0].phi, 'the thinner segment twists further');
  const ends = fixedFixedTorsion(600, 1.5, 0.5, G, polarJ(0.02, 0));
  approx(ends.Tleft, 400, 1e-12, 'the short side carries T(L-a)/L');
  approx(ends.Tright, 200, 1e-12, 'the long side carries the rest');
  ok(ends.gap < 1e-12, `stiffness and compatibility agree (${ends.gap})`);
  const nearer = fixedFixedTorsion(600, 1.5, 0.3, G, polarJ(0.02, 0));
  ok(nearer.Tleft > ends.Tleft, 'moving the torque toward a wall loads that wall more');
  const recovered = torqueFromShearField(ends.Tleft, 0.02, 0);
  approx(recovered, ends.Tleft, 1e-6, 'the left-segment stress field integrates back to its torque');
}

console.log('Required diameter');
{
  const P = torqueFromPower(15e3, 1200);
  const tau = 80e6;
  const phi = 1.5 * Math.PI / 180;
  const need = solidDiameterRequired(P.T, 1.2, G, tau, phi);
  const back = torsionShear(P.T, need.dShear / 2, polarJ(need.dShear / 2, 0));
  approx(back, tau, 1e-9, 'the stress diameter meets the allowable shear');
  const ang = twistAngle(P.T, 1.2, G, polarJ(need.dTwist / 2, 0));
  approx(ang, phi, 1e-9, 'the twist diameter meets the allowable angle');
  approx(need.d, Math.max(need.dShear, need.dTwist), 1e-15, 'the shaft takes the larger diameter');
  const bigger = solidDiameterForShear(2 * P.T, tau);
  approx(bigger / need.dShear, 2 ** (1 / 3), 1e-12, 'double the torque grows the stress diameter by 2^(1/3)');
  const looser = solidDiameterForTwist(P.T, 1.2, G, 2 * phi);
  approx(looser / need.dTwist, 0.5 ** 0.25, 1e-12, 'double the allowed angle shrinks that diameter by 2^(-1/4)');
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
