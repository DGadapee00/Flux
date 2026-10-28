/**
 * Self-test for elastic.js. Closed forms against a double integral of M/EI,
 * and the propped reaction against a finite-difference eigenvalue-free residual.
 *
 *   node src/mechanics/elastic-selftest.js
 */
import {
  cantileverTipDeflection, cantileverUniformDeflection, deflectionGap, integrateFixed,
  integrateSimple, proppedFiniteDifference, proppedGap, proppedUniform, rectInertia,
  simplePointDeflection, simplePointStation, simpleUniformDeflection,
} from './elastic.js';

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

const E = 200e9;
const I = rectInertia(0.04, 0.08);
const EI = E * I;

console.log('Cantilever tip');
{
  const beam = cantileverTipDeflection(2000, 2, EI);
  approx(beam.drop, (2000 * 8) / (3 * EI), 1e-12, 'tip drop PL^3/3EI');
  approx(beam.at(0).y, 0, 1e-12, 'root does not move');
  approx(beam.at(0).slope, 0, 1e-12, 'root slope is zero');
  approx(beam.slopeTip, -(2000 * 4) / (2 * EI), 1e-12, 'tip slope PL^2/2EI');
  const curve = integrateFixed(beam.moment, 2, EI, 4000);
  ok(deflectionGap(beam.at, curve) < 1e-6, 'tip curve matches the integral');
  const doubled = cantileverTipDeflection(4000, 2, EI);
  approx(doubled.drop, 2 * beam.drop, 1e-12, 'double the load doubles the drop');
  const longer = cantileverTipDeflection(2000, 4, EI);
  approx(longer.drop, 8 * beam.drop, 1e-12, 'double the span multiplies the drop by 8');
  const wider = cantileverTipDeflection(2000, 2, E * rectInertia(0.08, 0.08));
  approx(wider.drop, beam.drop / 2, 1e-12, 'double the width halves the drop');
  const deeper = cantileverTipDeflection(2000, 2, E * rectInertia(0.04, 0.16));
  approx(deeper.drop, beam.drop / 8, 1e-12, 'double the depth divides the drop by 8');
}

console.log('Cantilever uniform and simple spans');
{
  const uni = cantileverUniformDeflection(4000, 3, EI);
  approx(uni.drop, (4000 * 81) / (8 * EI), 1e-12, 'uniform cantilever tip wL^4/8EI');
  const curve = integrateFixed(uni.moment, 3, EI, 4000);
  ok(deflectionGap(uni.at, curve) < 1e-6, 'uniform cantilever matches the integral');
  const simple = simpleUniformDeflection(5000, 4, EI);
  approx(simple.drop, (5 * 5000 * 256) / (384 * EI), 1e-12, 'simple midspan 5wL^4/384EI');
  ok(Math.abs(simple.at(2).slope) < 1e-12, 'simple uniform slope is zero at midspan');
  const simpleCurve = integrateSimple(simple.moment, 4, EI, 4000);
  ok(deflectionGap(simple.at, simpleCurve) < 1e-6, 'simple uniform matches the integral');
  const heavy = simpleUniformDeflection(10000, 4, EI);
  approx(heavy.drop, 2 * simple.drop, 1e-12, 'double the uniform load doubles the drop');
}

console.log('Off-center point load');
{
  const mid = simplePointDeflection(10000, 4, 2, EI);
  approx(mid.drop, (10000 * 64) / (48 * EI), 1e-12, 'midspan point load is PL^3/48EI');
  approx(mid.xMax, 2, 1e-12, 'a centered load bottoms at midspan');
  const off = simplePointDeflection(10000, 4, 1, EI);
  approx(off.xMax, 4 - Math.sqrt(5), 1e-12, 'quarter-span load bottoms at L − √5');
  ok(Math.abs(off.xMax - 1) > 0.5, 'the lowest point is not under the load');
  ok(Math.abs(off.at(off.xMax).slope) < 1e-9, 'slope is zero at the lowest point');
  approx(off.under, (10000 * 1 * 9) / (3 * EI * 4), 1e-12, 'drop under the load is Pa²b²/3EIL');
  ok(off.drop > off.under * 1.05, 'the lowest point drops farther than the load point');
  const curve = integrateSimple(off.moment, 4, EI, 4000, off.breaks);
  ok(deflectionGap(off.at, curve) < 1e-6, 'off-center curve matches the integral');
  approx(simplePointStation(4, 3) + simplePointStation(4, 1), 4, 1e-12, 'a load at 3 m mirrors a load at 1 m');
}

console.log('Propped cantilever');
{
  const beam = proppedUniform(4000, 3, EI);
  approx(beam.R, (3 * 4000 * 3) / 8, 1e-12, 'prop reaction is 3wL/8');
  approx(beam.Mwall, -(4000 * 9) / 8, 1e-12, 'wall moment is −wL²/8');
  approx(beam.at(0).y, 0, 1e-12, 'wall does not move');
  approx(beam.at(0).slope, 0, 1e-12, 'wall slope is zero');
  approx(beam.at(3).y, 0, 1e-9, 'prop does not move');
  ok(Math.abs(beam.at(beam.xMax).slope) < 1e-9, 'slope is zero at the lowest point');
  const z = (1 + Math.sqrt(33)) / 16;
  approx(beam.xMax, 3 * (1 - z), 1e-12, 'lowest point is L(1 − (1+√33)/16) from the wall');
  ok(Math.abs(beam.xMax - 1.5) > 0.2, 'the lowest point is not at midspan');
  const curve = integrateFixed(beam.moment, 3, EI, 4000);
  ok(deflectionGap(beam.at, curve) < 1e-6, 'propped curve matches the integral');
  const fd = proppedGap(4000, 3, EI, 400);
  ok(fd.gap < 1e-4, `finite differences recover the prop and the curve (${fd.gap})`);
  const doubled = proppedUniform(8000, 3, EI);
  approx(doubled.R, 2 * beam.R, 1e-12, 'double the load doubles the prop');
  approx(doubled.drop, 2 * beam.drop, 1e-12, 'double the load doubles the drop');
  const longer = proppedUniform(4000, 6, EI);
  approx(longer.R, 2 * beam.R, 1e-12, 'double the span doubles the prop');
  approx(longer.Mwall, 4 * beam.Mwall, 1e-12, 'double the span multiplies the wall moment by 4');
  const coarse = proppedFiniteDifference(4000, 3, EI, 40);
  const fine = proppedFiniteDifference(4000, 3, EI, 80);
  ok(Math.abs(fine.R - beam.R) < Math.abs(coarse.R - beam.R), 'a finer grid moves the reaction closer');
}

console.log(failed === 0 ? `\n${passed} passed` : `\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
