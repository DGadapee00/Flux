import assert from 'node:assert/strict';
import test from 'node:test';
import { bestFixed, divider, ldrLux, ldrResistance, millman, ntcResistance, ntcTemp, par } from '../src/em/sensors.js';
import { solveCircuit } from '../src/em/mna.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1e-12, Math.abs(b)), `${a} vs ${b}`);
const gl5528 = { r10: 15e3, gamma: 0.6, rdark: 1e6 };
const ntc = { r25: 10e3, beta: 3950 };

test('an LDR follows its gamma line in light, levels off in the dark, and inverts', () => {
  // A decade more light divides the line's resistance by 10^γ; the parallel dark resistance barely matters in daylight.
  const r10 = 15e3 * 1e6 / (15e3 + 1e6);
  close(ldrResistance(gl5528, 10), r10, 1e-12);
  close(ldrResistance(gl5528, 1000) / ldrResistance(gl5528, 10000), 10 ** 0.6, 1e-3);
  assert.ok(ldrResistance(gl5528, 1e-6) > 0.99e6 && ldrResistance(gl5528, 1e-6) < 1e6);
  for (const lux of [0.1, 1, 10, 300, 5000]) close(ldrLux(gl5528, ldrResistance(gl5528, lux)), lux, 1e-9);
});

test('an NTC is 10 kΩ at 25 °C, falls as it warms, and inverts', () => {
  close(ntcResistance(ntc, 25), 10e3, 1e-12);
  assert.ok(ntcResistance(ntc, 50) < 10e3 && ntcResistance(ntc, 0) > 10e3);
  // The beta equation's own check: ln(R₀/R₅₀) = B (1/273.15 − 1/323.15).
  close(Math.log(ntcResistance(ntc, 0) / ntcResistance(ntc, 50)), 3950 * (1 / 273.15 - 1 / 323.15), 1e-12);
  for (const t of [-20, 0, 37, 80]) close(ntcTemp(ntc, ntcResistance(ntc, t)), t, 1e-9);
});

test('a loaded divider by formula matches nodal analysis', () => {
  for (const [top, bottom, load] of [[10e3, 10e3, Infinity], [100e3, 100e3, 1e3], [4.7e3, 22e3, 10e3], [1e6, 1e3, 1e6]]) {
    const edges = [
      { id: 'S', type: 'V', a: 'g', b: 'vs', value: 5 },
      { id: 'T', type: 'R', a: 'vs', b: 'o', value: top },
      { id: 'B', type: 'R', a: 'o', b: 'g', value: bottom },
    ];
    if (Number.isFinite(load)) edges.push({ id: 'L', type: 'R', a: 'o', b: 'g', value: load });
    const sol = solveCircuit(['g', 'vs', 'o'], edges, 'g');
    close(divider(5, top, bottom, load).v, sol.V.o, 1e-9);
    // And by Millman: the output is the conductance-weighted average of 5 V and 0 V.
    close(divider(5, top, bottom, load).v, millman([[5, top], [0, par(bottom, load)]]), 1e-12);
  }
});

test('the output depends on the ratio until a load is attached', () => {
  close(divider(5, 10e3, 10e3).v, divider(5, 100e3, 100e3).v, 1e-12);
  // A 1 kΩ load collapses a 100 kΩ divider, but takes only a third off a 1 kΩ one.
  assert.ok(divider(5, 100e3, 100e3, 1e3).v < 0.1);
  assert.ok(divider(5, 1e3, 1e3, 1e3).v > 1.6);
});

test('the geometric mean beats its neighbours for swing', () => {
  const ra = 2e3;
  const rb = 60e3;
  const swing = (r) => divider(5, ra, r).v - divider(5, rb, r).v;
  const best = bestFixed(ra, rb);
  for (const k of [0.5, 0.8, 1.25, 2]) assert.ok(swing(best) > swing(best * k));
  // Doubling both ends doubles the best resistor: it scales with the sensor.
  close(bestFixed(2 * ra, 2 * rb), 2 * best, 1e-12);
});
