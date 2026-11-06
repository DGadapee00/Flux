import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, line, note, plotIn, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { motorStep, motorSteady } from '@flux/subjects/design/instruments.js';

/**
 * Motor: a small brushed DC motor from free running to stall.
 *
 * Shows the motor's straight torque-speed line and its power curve: the power out peaks at half the
 * stall torque, not at top speed, and the current is set by the load, not by the speed. The steady
 * point is checked by stepping the motor's electrical and mechanical equations in time from rest
 * (packages/subjects/src/design/instruments.js). The motor's constants are example values.
 */
const R = 2; // Ω
const K = 0.02; // N·m/A = V·s/rad

const SCENARIOS = [
  { id: 'light', name: 'Lightly loaded', V: 12, load: 0.02 },
  { id: 'half', name: 'Half the stall torque', V: 12, load: 0.06 },
  { id: 'heavy', name: 'Near stall', V: 12, load: 0.11 },
  { id: 'low-v', name: 'Half the voltage, same load', V: 6, load: 0.02 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, V: sc.V, load: sc.load });
}

const rpm = (w) => (w * 60) / (2 * Math.PI);

export default defineLab({
  id: 'motor',
  exam: 'u6',
  title: 'DC motor',
  hint: 'Load the motor from free running toward stall: the speed falls in a straight line, the current rises, and the power out peaks halfway.',
  gapLimit: 1e-4,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('light', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'load', lo: 0, hi: 0.11 }),
  controls() {
    return `
      ${slider('mo-V', 'supply voltage (V)', 12, 3, 12, 0.5)}
      ${slider('mo-T', 'load torque (N·m)', 0.02, 0, 0.12, 0.001)}
      <p class="tiny">Example motor: 2 Ω winding, k = 0.02 N·m/A (also V·s/rad). At 12 V it stalls at 0.12 N·m and runs free at 5,730 rpm.</p>`;
  },
  bind(api) {
    bindSlider('mo-V', (s, v) => { s.V = v; }, api);
    bindSlider('mo-T', (s, v) => { s.load = v; }, api);
  },
  syncControls(state) {
    for (const [id, val] of [['mo-V', state.V], ['mo-T', state.load]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    }
  },
  compute(state) {
    const p = { V: state.V, R, k: K, load: Math.min(state.load, (K * state.V) / R) };
    const a = motorSteady(p);
    const n = motorStep(p);
    const gap = Math.max(Math.abs(n.w - a.w) / a.w0, Math.abs(n.i - a.i) / (state.V / R));
    const line12 = Array.from({ length: 41 }, (_, i) => {
      const t = (i / 40) * a.stall;
      const m = motorSteady({ ...p, load: t });
      return [t, rpm(m.w), m.Pout];
    });
    return { ...a, rpm: rpm(a.w), eff: a.Pin > 0 ? a.Pout / a.Pin : 0, line12, trace: n.trace, stalled: state.load >= (K * state.V) / R, gap };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const [left, right] = split(B.free, 0.6);
    const P = plotIn(B, left, { lo: 0, hi: 0.125 }, { lo: 0, hi: 6200 });
    axes(P, { xLabel: 'load torque (N·m)', yLabel: 'speed (rpm)' });
    line(P, c.line12.map(([t, r]) => [t, r]), { color: C.teal, width: 2.5 });
    const pMax = Math.max(...c.line12.map(([, , p]) => p), 1);
    line(P, c.line12.map(([t, , p]) => [t, (p / pMax) * 3000]), { color: C.gold, width: 2, dash: [6, 4] });
    note(P, `power out, peak ${fig(pMax)} W`, c.stall * 0.5, 3000, { color: C.gold, dy: -8 });
    seg(P, [c.stall / 2, 0], [c.stall / 2, 3000], { color: alpha(C.gold, 0.5), width: 1, dash: [3, 3] });
    dot(P, state.load, c.rpm, { color: C.yellow, r: 6 });
    const Q = plotIn(B, right, { lo: 0, hi: 400 }, { lo: 0, hi: 6200 });
    axes(Q, { xLabel: 'time from start (ms)', yLabel: 'speed (rpm)' });
    line(Q, c.trace.map(([t, w]) => [t * 1000, rpm(w)]), { color: C.pink, width: 2 });
  },
  law: () => [String.raw`V = iR + k\omega,\qquad \tau = k\,i`, String.raw`\omega = \frac{V}{k} - \frac{R}{k^2}\,\tau,\qquad P_\text{max} = \frac{V^2}{4R}\ \text{at}\ \tau = \frac{\tau_s}{2}`],
  liveRows(state, c) {
    return [
      kv('stall torque $kV/R$', `${fig(c.stall)} N·m`),
      kv('free speed $V/k$', `${fig(rpm(c.w0))} rpm`),
      kv('current $\\tau/k$', `${fig(c.i)} A`),
      kv('power in', `${fig(c.Pin)} W`),
      kv('efficiency', `${fig(c.eff * 100)}%`),
      kv('steady line against stepping in time', `${fig(c.gap * 100)}%`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['speed', `${fig(c.rpm)} rpm`],
      ['current', `${fig(c.i)} A`],
      ['power out', `${fig(c.Pout)} W`],
      ['efficiency', `${fig(c.eff * 100)}%`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Friction and the brushes' voltage drop, and heat: the winding's resistance rises as it warms. Near stall the current is high for long, and the winding overheats, which is what sizes most motors.`;
    let title = 'Fast, but not much power';
    let body = String.raw`Lightly loaded, the motor runs near its free speed, ${fig(c.rpm)} rpm, but gives only ${fig(c.Pout)} W. Power is torque times speed, and the torque is small.`;
    const frac = state.load / c.stall;
    if (frac > 0.4 && frac < 0.6) {
      title = 'Peak power at half the stall torque';
      body = String.raw`Torque times speed peaks halfway down the line: ${fig(c.Pout)} W here, out of ${fig(c.Pmax)} W possible. Efficiency is only ${fig(c.eff * 100)}% at this point, so motors usually run lighter than this.`;
    } else if (frac >= 0.85) {
      title = 'Near stall: all current, little motion';
      body = String.raw`The motor draws ${fig(c.i)} A, close to its stall current of ${fig(state.V / R)} A, and turns only ${fig(c.rpm)} rpm. Nearly all the power in becomes heat in the winding.`;
    } else if (state.V < 12) {
      title = 'Voltage sets the speed';
      body = String.raw`At ${fig(state.V)} V the line shifts down: free speed ${fig(rpm(c.w0))} rpm. The current for this load is unchanged, ${fig(c.i)} A, because current follows torque.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
