/**
 * Self-test for mechanical waves. Printed chapter 16 numbers are checked against
 * the grader's tolerance, max(0.02, 0.015 |want|). The finite-difference pulse and
 * the standing-mode period are the second method.
 *
 *   node src/mechanics/waves-selftest.js
 */
import { G } from './constants.js';
import {
  lengthFromPitch, modeFrequency, pulseSpeed, standingPeriodFromCrossings, tensionForSpeed,
  travelingWave, waveFromConstants, wavePower, wavePowerSamples, waveSpeed,
} from './waves.js';

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

const HIGH_MU = 3.09e-4;
const LOW_MU = 5.78e-3;
const HIGH_F = 56.4;

console.log('Speed and a traveling wave');
const rope = 30 / 6;
approx(rope, 5, 0, '30.00 m in 6.00 s is 5.00 m/s');
ok(grades(1 / 2, 0.5) && grades(5 * 0.5, 2.5), '2.00 Hz on that rope is T = 0.50 s and λ = 2.50 m');
const read = waveFromConstants(6.28, 1.57);
ok(grades(read.lambda, 1), 'k = 6.28 m⁻¹ prints λ = 1.0 m');
ok(grades(read.T, 4), 'ω = 1.57 s⁻¹ prints T = 4 s');
approx(read.v, 0.25, 1e-12, 'v = ω/k = 0.25 m/s exactly for those two figures');
const crest = travelingWave({ A: 0.2, k: 6.28, omega: 1.57, x: Math.PI / (2 * 6.28), t: 0 });
approx(crest.vy, 0, 1e-12, 'at a crest the transverse velocity is zero');
approx(crest.y, 0.2, 1e-12, 'and the displacement is the amplitude');
const node = travelingWave({ A: 0.2, k: 6.28, omega: 1.57, x: 0, t: 0 });
approx(node.y, 0, 0, 'at x = 0 and t = 0 the string is at equilibrium');
approx(node.vy, -0.2 * 1.57, 0, 'and the transverse velocity is −Aω');

console.log('Guitar string');
const vHigh = waveSpeed(HIGH_F, HIGH_MU);
ok(grades(vHigh, 427.23), 'high E at 56.40 N prints 427.23 m/s');
const vFour = waveSpeed(4 * HIGH_F, HIGH_MU);
approx(vFour / vHigh, 2, 1e-12, 'four times the tension doubles the speed');
const lowSame = tensionForSpeed(LOW_MU, vHigh);
ok(grades(lowSame, 1055), 'the low E at that speed prints 1055 N');
const scale = lengthFromPitch(vHigh, 329.63);
approx(scale, vHigh / (2 * 329.63), 0, 'the scale length is v/(2f) from the printed pitch');
const vLow = 2 * scale * 82.41;
const lowTune = tensionForSpeed(LOW_MU, vLow);
ok(lowTune < 100 && lowTune > 40, 'tuned to 82.41 Hz the low string is tens of newtons, not 1055');
approx(waveSpeed(lowTune, LOW_MU), vLow, 1e-9, 'that tension reproduces the low-E speed');

console.log('Power and standing modes');
const muP = 0.07 / 2;
const vP = waveSpeed(90, muP);
const wP = 2 * Math.PI * 60;
const power = wavePower({ mu: muP, A: 0.04, omega: wP, v: vP });
ok(grades(power, 201.59), 'the vibrator prints 201.59 W');
approx(wavePowerSamples({ mu: muP, A: 0.04, omega: wP, v: vP }), power, 1e-6, 'a period average of −F (∂y/∂x)(∂y/∂t) matches');
approx(wavePower({ mu: muP, A: 0.08, omega: wP, v: vP }) / power, 4, 1e-12, 'double the amplitude and the power is ×4');
const vStand = waveSpeed(2 * G, 0.006);
ok(grades(vStand, 57.15), 'a 2.00 kg hanger prints 57.15 m/s at g = 9.81');
ok(grades(modeFrequency(1, vStand, 2), 14.29), 'the fundamental prints 14.29 Hz');
ok(grades(modeFrequency(2, vStand, 2), 28.58), 'the second mode prints 28.58 Hz');
ok(grades(modeFrequency(3, vStand, 2), 42.87), 'the third mode prints 42.87 Hz');

console.log('Second method');
approx(pulseSpeed({ tension: HIGH_F, mu: HIGH_MU }), vHigh, 0.01, 'a finite-difference pulse travels at √(F/μ)');
approx(pulseSpeed({ tension: 4 * HIGH_F, mu: HIGH_MU }), 2 * vHigh, 0.01, 'and at twice that when the tension is ×4');
const period = standingPeriodFromCrossings({ tension: 2 * G, mu: 0.006, length: 2, mode: 1 });
approx(period, 1 / modeFrequency(1, vStand, 2), 2e-3, 'finite-difference crossings recover the fundamental period');
const period3 = standingPeriodFromCrossings({ tension: 2 * G, mu: 0.006, length: 2, mode: 3 });
approx(period3, 1 / modeFrequency(3, vStand, 2), 2e-3, 'and the third mode');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
