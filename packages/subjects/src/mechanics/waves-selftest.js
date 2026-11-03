/**
 * Self-test for mechanical waves. Printed chapter 16 numbers are checked against
 * the grader's tolerance, max(0.02, 0.015 |want|). The finite-difference pulse and
 * the standing-mode period are the second method.
 *
 *   node src/mechanics/waves-selftest.js
 */
import { G } from './constants.js';
import {
  beatFrequency, beatPeriodFromEnvelope, closedPipeFrequency, closedPipeLength, decibels,
  doppler, dopplerFromArrivals, intensityFromDecibels, intensityFromPressure,
  intensityFromPressureSamples, lengthFromPitch, levelChange, machAngle, machAngleFromWavefront,
  machNumber, modeFrequency, pipePeriodFromCrossings, pulseSpeed, radiatedPower, soundSpeed,
  sphereIntensity, standingPeriodFromCrossings, tensionForSpeed, travelingWave,
  waveFromConstants, wavePower, wavePowerSamples, waveSpeed, wavelength,
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

console.log('Sound speed, intensity, tubes');
const v30 = soundSpeed(30);
ok(grades(v30, 348.7), '30.0 °C air prints 348.7 m/s');
ok(grades(wavelength(v30, 20), 17) === false, 'the two-figure 17 m print does not grade against v/20');
ok(grades(wavelength(v30, 20000), 0.017), 'the 0.017 m print does grade, because the absolute floor is 0.02');
const air = intensityFromPressure(0.656, 1.29, 331);
ok(grades(air, 5.04e-4), 'a 0.656 Pa wave prints 5.04×10⁻⁴ W/m²');
ok(grades(decibels(air), 87), 'and 87 dB');
approx(intensityFromPressureSamples({ dp: 0.656, rho: 1.29, speed: 331 }), air, 1e-6, 'a period average of p·u matches (Δp)²/(2ρv)');
approx(levelChange(2), 3.01, 1e-4, 'twice the intensity is 3.01 dB');
approx(levelChange(0.25), -6.0206, 1e-4, 'four times the distance, one quarter the intensity, is −6.02 dB');
approx(decibels(2 * intensityFromDecibels(60)), 63.0103, 1e-4, 'two 60 dB sources are 63.01 dB, not 120');
const spread = sphereIntensity(1, 2);
approx(radiatedPower(1, 2), 1, 2e-4, 'summing I ΔA over the sphere returns the source power');
approx(sphereIntensity(1, 4) / spread, 0.25, 1e-12, 'double the distance and the intensity is ÷4');
const v22 = soundSpeed(22);
ok(grades(v22, 344), '22.0 °C air prints 344 m/s');
const stopped = closedPipeLength(v22, 128);
ok(grades(stopped, 0.672), 'a 128 Hz stopped pipe prints 0.672 m');
ok(grades(closedPipeFrequency(9, v22, stopped), 1152), 'the fourth overtone is 9 times the fundamental');
approx(9 * 128, 1152, 0, 'and that is 1.152 kHz, which the section prints as 1.15 kHz');
approx(v22 / (2 * stopped), 256, 1e-9, 'the same length, open at both ends, sounds at 256 Hz');

console.log('Beats, Doppler, Mach');
approx(beatFrequency(512, 256), 256, 0, '256 Hz against 512 Hz beats at 256 Hz');
approx(beatPeriodFromEnvelope({ f1: 440, f2: 442 }), 0.5, 0.02, 'a 2 Hz difference beats twice a second');
const approach = doppler({ f: 150, v: 340, vs: 35 });
const recede = doppler({ f: 150, v: 340, vs: -35 });
const walker = doppler({ f: 150, v: 340, vo: 35 });
ok(grades(approach, 167), 'the approaching train prints 167 Hz');
ok(grades(recede, 136), 'the receding train prints 136 Hz');
approx(approach - 150, 17.213, 1e-3, 'the rise is 17.2 Hz, which the section rounds to 17.0');
approx(150 - recede, 14, 0, 'the drop is 14.0 Hz exactly');
ok(Math.abs(walker - approach) > 1, 'the same speed, with the listener moving, is not the train result');
approx(doppler({ f: 150, v: 340, vo: 35, vs: -35 }), 150, 1e-12, 'rider and horn at one speed leave the pitch unchanged');
approx(dopplerFromArrivals({ f: 150, v: 340, vs: 35 }), approach, 2e-3, 'arrival gaps recover the approaching train');
approx(dopplerFromArrivals({ f: 150, v: 340, vs: -35 }), recede, 2e-3, 'and the receding train');
approx(dopplerFromArrivals({ f: 150, v: 340, vo: 35 }), walker, 2e-3, 'and a listener walking toward a still horn');
const jet = 3529.6 * 1000 / 3600;
approx(machNumber(jet, jet / 2.85), 2.85, 1e-12, '3529.60 km/h at Mach 2.85 divides to that Mach number');
approx(machAngle(2) * 180 / Math.PI, 30, 1e-12, 'Mach 2 opens a 30° half-angle');
approx(machAngleFromWavefront(2.85), machAngle(2.85), 2e-3, 'the tangent to a wavefront matches sin θ = 1/M');

console.log('Pipe modes, the second method');
const closedT = pipePeriodFromCrossings({ speed: v22, length: stopped, end: 'closed', harmonic: 1 });
approx(closedT, 1 / 128, 4e-3, 'a stopped pipe crosses at the 128 Hz period');
const closed3 = pipePeriodFromCrossings({ speed: v22, length: stopped, end: 'closed', harmonic: 3 });
approx(closed3, 1 / (3 * 128), 4e-3, 'and at the first overtone');
const openT = pipePeriodFromCrossings({ speed: v22, length: stopped, end: 'open', harmonic: 1 });
approx(openT, 1 / 256, 4e-3, 'the open pipe of that length crosses at 256 Hz');
const open2 = pipePeriodFromCrossings({ speed: v22, length: stopped, end: 'open', harmonic: 2 });
approx(open2, 1 / 512, 4e-3, 'and at its second harmonic');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
