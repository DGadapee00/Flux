/**
 * Second methods for strain-energy.js.
 *   node src/mechanics/strain-energy-selftest.js
 */
import { M_PER_FT, M_PER_IN, N_PER_LBF, PA_PER_PSI } from '../convert.js';
import { polarJ } from './torsion.js';
import {
  axialBar, bendingEnergy, cantileverStation, cantileverTipEnergy, dropHeightForStress,
  impactDrop, impactFactor, impactUnitGap, shearEnergyRect, torsionStrain, twoBarTruss,
} from './strain-energy.js';

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
const A = 4e-4;
const L = 1.5;
const N = 40e3;
const bar = axialBar(N, L, A, E);
approx(bar.delta, (N * L) / (A * E), 1e-12, 'axial stretch is NL/AE');
approx(bar.U, 0.5 * N * bar.delta, 1e-12, 'axial energy is half the load times the stretch');
approx(bar.gap, 0, 1e-12, 'the two axial writings agree');
const doubled = axialBar(2 * N, L, A, E);
approx(doubled.U, 4 * bar.U, 1e-12, 'doubling the axial load quadruples the energy');
approx(doubled.delta, 2 * bar.delta, 1e-12, 'doubling the axial load doubles the stretch');

const b = 0.04;
const h = 0.08;
const EI = E * b * h ** 3 / 12;
const P = 800;
const beamL = 2;
const tip = cantileverTipEnergy(P, beamL, EI);
approx(tip.delta, 0.00625, 1e-12, 'the 40 by 80 mm cantilever drops 6.25 mm');
approx(tip.U, 2.5, 1e-12, 'that cantilever stores 2.5 J');
approx(tip.gap, 0, 1e-6, 'bending quadrature and the elastic curve meet the closed tip');
const quadCoarse = bendingEnergy((x) => -P * (beamL - x), beamL, EI, 40);
const quadFine = bendingEnergy((x) => -P * (beamL - x), beamL, EI, 160);
const closedU = (P * P * beamL ** 3) / (6 * EI);
approx(Math.abs(quadFine - closedU) < Math.abs(quadCoarse - closedU), 1, 0, 'a finer moment grid is closer');

const mid = cantileverStation(P, beamL, beamL / 2, EI);
approx(mid.delta, 0.001953125, 1e-12, 'midspan of that cantilever drops 1.953 mm');
approx(mid.gap, 0, 1e-6, 'the dummy-load integral meets the elastic curve');
approx(cantileverStation(P, beamL, beamL, EI).delta, tip.delta, 1e-12, 'a dummy at the tip is the tip load');
const longer = cantileverTipEnergy(P, 2 * beamL, EI);
approx(longer.delta, 8 * tip.delta, 1e-12, 'doubling the length multiplies the tip drop by 8');

const G = 75e9;
const J = polarJ(0.02, 0);
const shaft = torsionStrain(500, 1.2, G, J);
approx(shaft.U, 0.5 * 500 * shaft.phi, 1e-12, 'torsion energy is half the torque times the angle');
approx(shaft.gap, 0, 1e-12, 'the two torsion writings agree');
approx(torsionStrain(1000, 1.2, G, J).U, 4 * shaft.U, 1e-12, 'doubling the torque quadruples the torsion energy');

const shear = shearEnergyRect(P, beamL, b * h, E / 2.6);
const ratio = shear.U / tip.U;
approx(ratio, 0.78 * (h / beamL) ** 2, 1e-12, 'shear energy over bending energy is 0.78 (h/L)²');
approx(ratio < 0.01, 1, 0, 'on this slender cantilever shear stores under 1% of the bending energy');

const truss = twoBarTruss(4000, 4, 0.5, 1e-4, E);
approx(truss.gap, 0, 1e-6, 'Castigliano, the shortening, and the joint solution agree');
const taller = twoBarTruss(4000, 4, 1, 1e-4, E);
approx(taller.delta < truss.delta, 1, 0, 'raising the joint shortens the vertical drop');
approx(taller.F < truss.F, 1, 0, 'raising the joint lowers the bar force');
approx(twoBarTruss(8000, 4, 0.5, 1e-4, E).U, 4 * truss.U, 1e-9, 'doubling the joint load quadruples the truss energy');

approx(impactFactor(0, 0.001), 2, 1e-15, 'a zero drop doubles the static stretch');
const drop = impactDrop(400 * N_PER_LBF, 30 * M_PER_FT, 0.118 * M_PER_IN ** 2, 12.2e6 * PA_PER_PSI, M_PER_IN);
approx(drop.gap, 0, 1e-4, 'the rope drop matches the mass-spring integration');
approx(drop.n > 2, 1, 0, 'a one-inch drop multiplies the static force by more than 2');
const sudden = impactDrop(400 * N_PER_LBF, 30 * M_PER_FT, 0.118 * M_PER_IN ** 2, 12.2e6 * PA_PER_PSI, 0);
approx(sudden.n, 2, 1e-12, 'released from contact, the factor is 2');
approx(sudden.gap, 0, 1e-3, 'the sudden case matches the integrator');
const soft = impactDrop(400 * N_PER_LBF, 60 * M_PER_FT, 0.118 * M_PER_IN ** 2, 12.2e6 * PA_PER_PSI, M_PER_IN);
approx(soft.force < drop.force, 1, 0, 'a longer rope catches the same drop with less force');

const sized = dropHeightForStress(2000, 2, Math.PI * 0.006 ** 2, E, 80e6);
approx(sized.h > 0, 1, 0, 'an allowable above the sudden stress leaves a positive drop');
const back = impactDrop(2000, 2, Math.PI * 0.006 ** 2, E, sized.h);
approx(back.stress, 80e6, 1e-6, 'dropping from that height meets the allowable stress');

approx(impactUnitGap(400, 30 * 12, 0.118, 13.5e6, 1), 0, 1e-9, 'inch impact and SI impact are the same rope');

console.log(`${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
