import { C, axes, begin, dot, label, line, note, plotIn, sceneIn, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { battery, junction, resistor, wire } from './schematic.js';
import { bindSelect, bindSlider, put, select, showField, slider } from './widgets.js';
import { fig, si } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { LDR, NTC } from './sensors.js';
import { divider as divide, ldrResistance, ntcResistance, par } from '@flux/subjects/em/sensors.js';
import { solveCircuit } from '@flux/subjects/em/mna.js';

/**
 * Shows that a divider's output depends on the ratio of its two resistances, not their size, until
 * something reads it. A load across the lower resistor is in parallel with it, so it pulls the output
 * down, and the bigger the divider's resistances, the harder. It also shows how a sensor whose
 * resistance changes, an LDR or a thermistor, becomes a voltage, and that which way the output moves
 * depends on whether the sensor sits above or below the output.
 *
 * A 5 V supply feeds two resistances in series; the output is the node between them. With a
 * potentiometer the wiper splits one track into the two. Recompute: the divider formula with the load
 * in parallel with the lower part. Check: modified nodal analysis on the same circuit.
 */
const VS = 5;
const FIXED = [1e3, 2.2e3, 4.7e3, 10e3, 22e3, 47e3, 100e3, 220e3, 1e6];
const LOADS = [[0, 'nothing'], [10e6, 'a 10 MΩ voltmeter'], [100e3, '100 kΩ'], [10e3, '10 kΩ'], [1e3, '1 kΩ']];
const SENSORS = [['pot', 'potentiometer'], ['ldr', 'light-dependent resistor (GL5528)'], ['ntc', 'thermistor (10 kΩ NTC)']];

const SCENARIOS = [
  { id: 'pot10', name: 'A 10 kΩ potentiometer at half way', sensor: 'pot', potR: 10e3, x: 0.5, load: 0 },
  { id: 'pot100', name: 'A 100 kΩ potentiometer at half way', sensor: 'pot', potR: 100e3, x: 0.5, load: 0 },
  { id: 'ldr', name: 'An LDR below a 10 kΩ resistor, room light', sensor: 'ldr', pos: 'bottom', fixed: 10e3, lux: 300, load: 0 },
  { id: 'ntc', name: 'A thermistor below a 10 kΩ resistor, 25 °C', sensor: 'ntc', pos: 'bottom', fixed: 10e3, tC: 25, load: 0 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((x) => x.id === id) || SCENARIOS[0];
  Object.assign(state, { sensor: 'pot', potR: 10e3, x: 0.5, pos: 'bottom', fixed: 10e3, lux: 300, tC: 25, load: 0 }, sc, { scenarioId: sc.id });
  delete state.id;
  delete state.name;
}

/** The sensor's resistance at a value of its own input: light, temperature or wiper position. */
function sensorR(s, u) {
  if (s.sensor === 'ldr') return ldrResistance(LDR, u);
  return ntcResistance(NTC, u);
}

/** The two halves of the divider at the sensor input `u` (the state's own when omitted). */
export function halves(s, u = s.sensor === 'ldr' ? s.lux : s.sensor === 'ntc' ? s.tC : s.x) {
  if (s.sensor === 'pot') return { top: Math.max(1e-3, (1 - u) * s.potR), bottom: Math.max(1e-3, u * s.potR) };
  const r = sensorR(s, u);
  return s.pos === 'bottom' ? { top: s.fixed, bottom: r } : { top: r, bottom: s.fixed };
}

const loadOf = (s) => (s.load > 0 ? s.load : Infinity);
const vOut = (s, u) => {
  const h = halves(s, u);
  return divide(VS, h.top, h.bottom, loadOf(s)).v;
};

export default defineLab({
  id: 'divider',
  exam: 'u3',
  title: 'Voltage divider',
  app: false,
  hint: 'Move the sensor’s input, then add a load. The output follows the ratio until the load pulls it down.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('pot10', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'x', lo: 0.05, hi: 0.95 }),
  controls() {
    return `
      ${select('dv-sensor', 'Lower and upper parts', SENSORS, 'pot')}
      ${select('dv-potr', 'Potentiometer track', [[10e3, '10 kΩ'], [100e3, '100 kΩ']], 10e3)}
      ${slider('dv-x', 'Wiper position (fraction of the way up)', 0.5, 0.05, 0.95, 0.05)}
      ${select('dv-pos', 'Where the sensor sits', [['bottom', 'below the output'], ['top', 'above the output']], 'bottom')}
      ${select('dv-fixed', 'Fixed resistor', FIXED.map((r) => [r, si(r, 'Ω')]), 10e3)}
      ${slider('dv-lux', 'Light (log₁₀ lux)', 2.5, -1, 4, 0.1)}
      ${slider('dv-t', 'Temperature (°C)', 25, -20, 80, 1)}
      ${select('dv-load', 'What reads the output', LOADS, 0)}`;
  },
  bind(api) {
    bindSelect('dv-sensor', (s, v) => { s.sensor = v; }, api);
    bindSelect('dv-potr', (s, v) => { s.potR = Number(v); }, api);
    bindSlider('dv-x', (s, v) => { s.x = v; }, api);
    bindSelect('dv-pos', (s, v) => { s.pos = v; }, api);
    bindSelect('dv-fixed', (s, v) => { s.fixed = Number(v); }, api);
    bindSlider('dv-lux', (s, v) => { s.lux = 10 ** v; }, api);
    bindSlider('dv-t', (s, v) => { s.tC = v; }, api);
    bindSelect('dv-load', (s, v) => { s.load = Number(v); }, api);
  },
  syncControls(s) {
    put('dv-sensor', s.sensor);
    put('dv-potr', s.potR);
    put('dv-x', s.x);
    put('dv-pos', s.pos);
    put('dv-fixed', s.fixed);
    put('dv-lux', Math.log10(s.lux).toFixed(1));
    put('dv-t', s.tC);
    put('dv-load', s.load);
    const pot = s.sensor === 'pot';
    for (const id of ['dv-potr', 'dv-x']) showField(id, pot);
    for (const id of ['dv-pos', 'dv-fixed']) showField(id, !pot);
    showField('dv-lux', s.sensor === 'ldr');
    showField('dv-t', s.sensor === 'ntc');
  },
  compute(s) {
    const { top, bottom } = halves(s);
    const L = loadOf(s);
    const d = divide(VS, top, bottom, L);
    // Second method: nodal analysis on the circuit, the load as one more resistor.
    const edges = [
      { id: 'S', type: 'V', a: 'g', b: 'vs', value: VS },
      { id: 'T', type: 'R', a: 'vs', b: 'o', value: top },
      { id: 'B', type: 'R', a: 'o', b: 'g', value: bottom },
    ];
    if (Number.isFinite(L)) edges.push({ id: 'L', type: 'R', a: 'o', b: 'g', value: L });
    const m = solveCircuit(['g', 'vs', 'o'], edges, 'g');
    const gap = Math.abs(m.V.o - d.v) / VS;
    // Which way the output moves: darker, warmer, or the wiper further up.
    const u = s.sensor === 'ldr' ? s.lux : s.sensor === 'ntc' ? s.tC : s.x;
    const moved = s.sensor === 'ldr' ? u / 10 : s.sensor === 'ntc' ? u + 10 : Math.min(0.95, u + 0.1);
    return {
      top, bottom, v: d.v, vOpen: d.vOpen, rth: d.rth, gap,
      sag: d.vOpen - d.v,
      sagPct: d.vOpen > 1e-9 ? ((d.vOpen - d.v) / d.vOpen) * 100 : 0,
      iDiv: VS / (top + par(bottom, L)),
      rises: vOut(s, moved) > d.v,
      rSensor: s.sensor === 'pot' ? null : (s.pos === 'bottom' ? bottom : top),
    };
  },
  draw(canvas, s, c) {
    const B = begin(canvas);
    const [a, b] = split(B.free, 0.42);
    const P = sceneIn(B, a, { x0: -4, x1: 24, y0: -1.5, y1: 11.5 }, 10);
    const pot = s.sensor === 'pot';
    // On a phone the drawing is small: draw the circuit, leave the numbers to the readout.
    const tiny = P.k < 9;
    battery(P, [0, 0], [0, 10], { text: tiny ? '' : '5 V' });
    wire(P, [[0, 10], [6, 10]]);
    const isSensor = (half) => !pot && s.pos === half;
    const name = (half) => (tiny ? '' : pot ? si(half === 'top' ? c.top : c.bottom, 'Ω') : isSensor(half) ? `${s.sensor === 'ldr' ? 'LDR' : 'NTC'} ${si(half === 'top' ? c.top : c.bottom, 'Ω')}` : si(s.fixed, 'Ω'));
    resistor(P, [6, 10], [6, 5], { text: name('top'), side: 1, vary: isSensor('top'), light: isSensor('top') && s.sensor === 'ldr' });
    resistor(P, [6, 5], [6, 0], { text: name('bottom'), side: 1, vary: isSensor('bottom'), light: isSensor('bottom') && s.sensor === 'ldr' });
    wire(P, [[6, 0], [0, 0]]);
    wire(P, [[6, 5], [16, 5]], { dots: [[6, 5]] });
    if (!tiny) label(P, `V_out = ${fig(c.v)} V`, [16.4, 5], { color: C.yellow, bold: true, align: 'left' });
    if (s.load > 0) {
      wire(P, [[14, 5], [14, 4]]);
      resistor(P, [14, 4], [14, 0.8], { text: tiny ? '' : `load ${si(s.load, 'Ω')}`, side: 1, color: C.pink });
      wire(P, [[14, 0.8], [14, 0], [6, 0]], { dots: [[6, 0]] });
      junction(P, [14, 5]);
    }
    if (pot && !tiny) label(P, `wiper at ${fig(s.x * 100)}%`, [6, 11], { color: C.muted });

    // The output against the sensor's own input, with and without the load.
    const xs = [];
    let X;
    let xLabel;
    if (s.sensor === 'ldr') {
      X = { lo: 0.1, hi: 10000, log: true };
      xLabel = 'light (lux)';
      for (let k = 0; k <= 120; k += 1) xs.push(10 ** (-1 + (5 * k) / 120));
    } else if (s.sensor === 'ntc') {
      X = { lo: -20, hi: 80 };
      xLabel = 'temperature (°C)';
      for (let k = 0; k <= 100; k += 1) xs.push(-20 + k);
    } else {
      X = { lo: 0, hi: 100 };
      xLabel = 'wiper position (%)';
      for (let k = 5; k <= 95; k += 1) xs.push(k / 100);
    }
    const Q = plotIn(B, b, X, { lo: 0, hi: VS }, { left: 42, right: 14, top: 20, bottom: 40 });
    axes(Q, { xLabel, yLabel: 'V_out (V)' });
    const px = (u) => (pot ? u * 100 : u);
    const open = xs.map((u) => [px(u), divide(VS, halves(s, u).top, halves(s, u).bottom).v]);
    line(Q, open, { color: C.teal, width: 2 });
    if (s.load > 0) line(Q, xs.map((u) => [px(u), vOut(s, u)]), { color: C.pink, width: 2, dash: [6, 4] });
    const u0 = s.sensor === 'ldr' ? s.lux : s.sensor === 'ntc' ? s.tC : s.x;
    dot(Q, px(u0), c.v, { color: C.yellow });
    note(Q, s.load > 0 ? `teal: no load · pink: with ${si(s.load, 'Ω')}` : 'no load', px(xs[0]), VS * 0.94, { color: C.muted, dx: 4 });
  },
  law: () => [String.raw`V_{\text{out}} = V_s\,\frac{R_{\text{lower}}}{R_{\text{upper}} + R_{\text{lower}}}`, String.raw`R_{\text{lower}} \to R_{\text{lower}} \parallel R_{\text{load}}`],
  liveRows(s, c) {
    return [
      kv('upper part', si(c.top, 'Ω')),
      kv('lower part', si(c.bottom, 'Ω')),
      kv('output with nothing attached', `${fig(c.vOpen)} V`),
      kv('pulled down by the load', `${fig(c.sag)} V (${fig(c.sagPct)}%)`),
      kv('divider’s own resistance, upper ∥ lower', si(c.rth, 'Ω')),
    ].join('');
  },
  readout(s, c) {
    return cells([
      ['output', `${fig(c.v)} V`],
      [s.sensor === 'pot' ? 'divider current' : 'sensor', s.sensor === 'pot' ? si(c.iDiv, 'A') : si(c.rSensor, 'Ω')],
    ]);
  },
  coach(s, c) {
    const out = String.raw`<b>What the model leaves out.</b> Every resistance is exact. Real resistors are ±5%, the GL5528 is anywhere from 10 to 20 kΩ at 10 lux, and a thermistor carries its own tolerance. Current through a sensor also warms it a little, which a thermistor reads as a change in temperature.`;
    const which = s.sensor === 'ldr' ? 'darker' : s.sensor === 'ntc' ? 'warmer' : 'further up';
    const body = [
      `The output is the share of 5 V the lower part takes: ${si(c.bottom, 'Ω')} of ${si(c.top + c.bottom, 'Ω')}, ${fig(c.vOpen)} V with nothing attached. Scale both parts by ten and the share is the same.`,
      s.load > 0
        ? `The ${si(s.load, 'Ω')} load sits in parallel with the lower part, so it pulls the output down ${fig(c.sagPct)}%, to ${fig(c.v)} V. A load barely matters when it is much larger than the divider’s own ${si(c.rth, 'Ω')}.`
        : 'Nothing reads the output yet. Pick a load and watch it pull the output down.',
      s.sensor === 'pot' ? '' : `${s.pos === 'bottom' ? 'The sensor is below the output' : 'The sensor is above the output'}, so when it gets ${which} the output ${c.rises ? 'rises' : 'falls'}. Swap the two parts to reverse that.`,
      out,
    ].filter(Boolean);
    return { title: s.load > 0 && c.sagPct > 10 ? 'The load drags the output down' : 'The output follows the ratio', body };
  },
});
