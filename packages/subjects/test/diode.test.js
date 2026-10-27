import assert from 'node:assert/strict';
import test from 'node:test';
import {
  VT, currentAt, fromForward, nextE12Up, parallelShare, parallelShareBisect, seriesCurrent, seriesCurrentBisect, voltageAt,
} from '../src/em/diode.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1e-12, Math.abs(b)), `${a} vs ${b}`);
const red = fromForward({ vf: 2.0, iF: 0.02 });

test('the model passes through its datasheet point, and V(I) and I(V) invert each other', () => {
  close(voltageAt(red, 0.02), 2.0, 1e-12);
  for (const i of [1e-6, 1e-3, 0.01, 0.02, 0.05]) close(currentAt(red, voltageAt(red, i)), i, 1e-9);
});

test('a decade more current costs n·V_T·ln 10 at the junction, plus the series drop', () => {
  // Far above I_s, the junction voltage rises by n V_T ln 10 per decade of current.
  const dv = voltageAt(red, 0.01) - voltageAt(red, 0.001);
  close(dv, red.n * VT * Math.log(10.000000) + 0.009 * red.rs, 1e-6);
});

test('one loop: Newton and bisection agree, and halving R nearly doubles the current', () => {
  const a = seriesCurrent(5, 150, [red]);
  close(a, seriesCurrentBisect(5, 150, [red]), 1e-9);
  // 5 V − 2 V over 150 Ω is about 20 mA; the LED's slope makes it a little less.
  assert.ok(a > 0.0185 && a < 0.0201, String(a));
  const b = seriesCurrent(5, 75, [red]);
  assert.ok(b / a > 1.8 && b / a < 2, String(b / a));
  // The LED's voltage moves a little (about 0.2 V); the resistor's moves far more.
  const dLed = voltageAt(red, b) - voltageAt(red, a);
  assert.ok(dLed > 0 && dLed < 0.25, String(dLed));
  assert.ok(Math.abs(b * 75 - a * 150) > 0 && dLed < 0.1 * 5);
});

test('two LEDs in series need twice the voltage; a supply below threshold lights nothing', () => {
  close(seriesCurrent(9, 220, [red, red]), seriesCurrentBisect(9, 220, [red, red]), 1e-9);
  assert.equal(seriesCurrent(-5, 150, [red]), 0);
  // Below about 1.5 V a red LED passes well under a microamp: dark.
  assert.ok(seriesCurrent(1.2, 150, [red]) < 1e-6);
});

test('two LEDs in parallel on one resistor: Newton and bisection agree, and the lower-V_f one hogs', () => {
  const lo = fromForward({ vf: 1.95, iF: 0.02 });
  const hi = fromForward({ vf: 2.05, iF: 0.02 });
  const n = parallelShare(5, 75, [lo, hi]);
  const b = parallelShareBisect(5, 75, [lo, hi]);
  close(n.v, b.v, 1e-9);
  close(n.currents[0], b.currents[0], 1e-7);
  // KVL: the source equals the shared voltage plus the resistor's drop.
  close(n.v + 75 * (n.currents[0] + n.currents[1]), 5, 1e-9);
  // 0.1 V of spread in V_f makes about a 3 : 2 split.
  assert.ok(n.currents[0] > 1.4 * n.currents[1]);
});

test('E12: the next standard value at or above a target', () => {
  assert.equal(nextE12Up(150), 150);
  assert.equal(nextE12Up(151), 180);
  assert.equal(nextE12Up(350), 390);
  assert.equal(nextE12Up(9.9), 10);
  assert.equal(nextE12Up(4600), 4700);
});
