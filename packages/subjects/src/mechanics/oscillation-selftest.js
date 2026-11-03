/**
 * Self-test for the oscillation additions: damping, drive, the exact pendulum,
 * and RK4 against the closed forms. Printed chapter 15 numbers are checked
 * against the grader's tolerance, max(0.02, 0.015 |want|).
 *
 *   node src/mechanics/oscillation-selftest.js
 */
import { G } from './constants.js';
import {
  agm, amplitudePeakOmega, angularPeriodFromCrossings, coupledDamper, criticalDamping,
  drivenAmplitude, drivenLag, drivenSteadyAmplitude, gravityFromPendulum, pendulumPeriod,
  pendulumPeriodExact, pendulumPeriodSeries, resonanceAmplitude, shm, springOmega, springPeriod,
  springPeriodFromCrossings, torsionConstant, tunedDamperLength, underdampedMotion, underdampedOmega,
  verticalShift,
} from './oscillation.js';

let passed = 0;
let failed = 0;

function approx(a, b, tol, name) {
  const scale = Math.max(1, Math.abs(b));
  const good = Number.isFinite(a) && Math.abs(a - b) <= tol * scale;
  if (good) passed += 1;
  else failed += 1;
  console.log(`  ${good ? 'PASS' : 'FAIL'}  ${name}${good ? '' : `\n        got ${a}  expected ${b}`}`);
}

function ok(cond, name) {
  if (cond) passed += 1;
  else failed += 1;
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${name}`);
}

function grades(got, want) {
  return Math.abs(got - want) <= Math.max(0.02, 0.015 * Math.abs(want));
}

/** Simpson on the complete elliptic integral K(k) = ∫_0^{π/2} (1 − k² sin²φ)^(−1/2) dφ. */
function ellipticK(k) {
  const n = 4000;
  const h = (Math.PI / 2) / n;
  const kk = k * k;
  let sum = 0;
  for (let i = 0; i <= n; i += 1) {
    const phi = i * h;
    const w = i === 0 || i === n ? 1 : i % 2 === 0 ? 2 : 4;
    const s = Math.sin(phi);
    sum += w / Math.sqrt(1 - kk * s * s);
  }
  return (sum * h) / 3;
}

console.log('Spring and the block');
approx(springOmega(2, 32), 4, 1e-15, 'ω = 4 rad/s for 2.00 kg and 32.0 N/m');
approx(springPeriod(2, 32), Math.PI / 2, 1e-15, 'T = π/2 s');
ok(grades(Math.PI / 2, 1.57), 'the printed 1.57 s grades');
const at = shm({ A: 0.02, omega: 4, t: 0 });
approx(at.x, 0.02, 1e-15, 'released from rest at +0.0200 m');
approx(at.v, 0, 1e-15, 'the velocity is zero there');
approx(at.a, -0.32, 1e-12, 'a_max = 0.320 m/s²');
approx(0.02 * 4, 0.08, 1e-15, 'v_max = 0.0800 m/s');
approx(1 / 4e-7, 2.5e6, 1e-15, 'ultrasound: 0.400 μs is 2.50 MHz');
const crossings = springPeriodFromCrossings(2, 32);
approx(crossings, Math.PI / 2, 1e-8, 'RK4 zero crossings recover the period');
approx(springPeriodFromCrossings(1, (2 * Math.PI / 4e-7) ** 2), 4e-7, 1e-6, 'the same check at a microsecond period');

console.log('Vertical shift and damping');
approx(verticalShift(2, 32), (2 * G) / 32, 1e-15, 'the 2.00 kg block hangs 0.613 m lower');
approx(criticalDamping(0.5, 200), 2 * Math.sqrt(100), 1e-12, 'critical b is 2√(mk)');
const b = 2;
const m = 1;
const k = 100;
approx(underdampedOmega(m, k, b), Math.sqrt(100 - 1), 1e-12, 'underdamped ω drops by (b/2m)²');
ok(!Number.isFinite(underdampedOmega(m, k, criticalDamping(m, k) + 1)), 'overdamping is not a real ω');
const ring = underdampedMotion({ A0: 0.05, mass: m, k, b, t: 0.4 });
approx(ring.envelope, 0.05 * Math.exp(-0.4), 1e-12, 'the envelope is A₀ e^(−bt/2m)');
const later = underdampedMotion({ A0: 0.05, mass: m, k, b, t: 0.4 + 1e-6 });
approx((later.x - ring.x) / 1e-6, ring.v, 1e-4, 'the velocity matches a short difference');

console.log('Drive');
const w0 = 10;
approx(drivenAmplitude({ F0: 2, mass: 1, k: 100, b: 0.5, omega: w0 }), 2 / (0.5 * w0), 1e-12, 'at ω₀, A = F₀/(b ω₀)');
approx(resonanceAmplitude(2, 0.5, w0), 0.4, 1e-15, 'the book’s peak is that amplitude');
approx(drivenLag(1, 100, 0.5, w0), Math.PI / 2, 1e-12, 'the lag is π/2 on resonance');
approx(drivenLag(1, 100, 0.5, 1), 0, 0.02, 'well below resonance the lag is near 0');
ok(drivenLag(1, 100, 0.5, 40) > 2.5, 'well above resonance the lag is near π');
const peakW = amplitudePeakOmega(1, 100, 0.5);
ok(peakW < w0 && peakW > 9.9, 'the true peak sits just under ω₀');
const steady = drivenSteadyAmplitude({ mass: 1, k: 100, b: 0.5, F0: 2, omega: w0 });
approx(steady, 0.4, 2e-3, 'RK4 to steady state matches A at resonance');
const off = drivenAmplitude({ F0: 2, mass: 1, k: 100, b: 0.5, omega: 5 });
const steadyOff = drivenSteadyAmplitude({ mass: 1, k: 100, b: 0.5, F0: 2, omega: 5 });
approx(steadyOff, off, 2e-3, 'and off resonance too');

console.log('Pendulum');
const L = 0.75;
const gPrint = gravityFromPendulum(L, 1.7357);
approx(gPrint, 9.8281, 1e-4, '75.000 cm and 1.7357 s give g = 9.8281 m/s²');
ok(grades(gPrint, 9.8281), 'that printed g grades');
const deg = Math.PI / 180;
approx(pendulumPeriodExact(L, 2 * deg), pendulumPeriodSeries(L, 2 * deg), 1e-6, 'at 2° the series matches the AGM');
const kEll = Math.sin(30 * deg);
const fromK = 4 * Math.sqrt(L / G) * ellipticK(kEll);
approx(pendulumPeriodExact(L, 60 * deg), fromK, 1e-8, 'at 60° the AGM matches the elliptic integral');
ok(pendulumPeriodExact(L, 60 * deg) > pendulumPeriod(L) * 1.05, 'a large angle has a longer period');
const swung = angularPeriodFromCrossings(G / L, 60 * deg);
approx(swung, pendulumPeriodExact(L, 60 * deg), 1e-5, 'RK4 of θ̈ = −(g/L) sin θ matches the AGM');
approx(agm(1, 1), 1, 1e-15, 'AGM(1, 1) is 1, so the small-angle period is exact');

console.log('Skyscraper and torsion');
const length = tunedDamperLength(0.5);
ok(grades(length, 1.49), '0.50 Hz prints 1.49 m at g = 9.81');
approx(length, (3 * G * 4) / (8 * Math.PI * Math.PI), 1e-15, 'L = 3gT²/(8π²)');
const rodPeriod = angularPeriodFromCrossings((3 * G) / (2 * length), 0.005);
approx(rodPeriod, 2, 1e-5, 'a rod of that length has a 2.00 s period');
const I = (4 * 0.3 * 0.3) / 12;
const kappa = torsionConstant(I, 0.5);
ok(grades(kappa, 4.73), 'the torsion constant prints 4.73 N·m');
const beat = coupledDamper({ M: 1e6, m: 1e5, L: length, f: 0.5, t1: 8, steps: 8000 });
approx(beat.energy1, beat.energy0, 1e-5, 'the building and the beam keep their energy');
ok(beat.thPeak > 1e-3, 'the beam swings');
ok(beat.opposed, 'the beam spends time on the other side of the building');
const traced = coupledDamper({ M: 1e6, m: 1e5, L: length, f: 0.5, t1: 8, steps: 4000, trace: 41 });
ok(traced.traceT.length === 41 && traced.traceX.length === 41, 'a requested trace has one sample per slot');
approx(traced.traceT[0], 0, 0, 'the trace starts at the release');
approx(traced.traceX[0], 0.02, 0, 'the building starts at its offset');
approx(traced.traceTh[0], 0, 0, 'the beam starts vertical');
approx(traced.traceT[40], 8, 1e-12, 'the trace ends at t1');
approx(traced.traceX[40], traced.x, 0, 'the last sample is the state that was returned');
approx(traced.traceTh[40], traced.th, 0, 'and the same for the beam angle');
console.log(`        beam peak ${beat.thPeak.toExponential(3)} rad, opposed ${beat.opposed}`);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
