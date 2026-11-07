import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, axes, begin, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { SUPPLY, powerChecked } from '@flux/subjects/em/acpower.js';

/**
 * Power factor: a 5 kW motor on a 240 V, 60 Hz supply, with a slider for its power factor and a
 * capacitor across it to correct it, the line current and the power triangle shown.
 *
 * Shows that volts times amps is not the power used: at a power factor of 0.6 the motor does 5 kW of
 * work but the line carries 34.7 A, as for 8.3 kW, and the wires lose 2.8 times as much as they
 * need to. A 307 µF capacitor supplies the motor's reactive power locally and the line current
 * falls to 20.8 A. The closed form is phasor arithmetic; the second method averages v(t) i(t) and
 * i(t)² over a cycle (packages/subjects/src/em/acpower.js).
 */
const SCENARIOS = [
  { id: 'poor', name: 'A motor at power factor 0.6', pf: 0.6, Cuf: 0 },
  { id: 'fixed', name: 'The same with 307 µF across it', pf: 0.6, Cuf: 307 },
  { id: 'over', name: 'Overcorrected with 450 µF', pf: 0.6, Cuf: 450 },
  { id: 'good', name: 'A motor at power factor 0.95', pf: 0.95, Cuf: 0 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, pf: sc.pf, Cuf: sc.Cuf });
}

const KEYS = [['pf-pf', 'pf'], ['pf-c', 'Cuf']];
const kw = (x) => `${fig(x / 1000)} kW`;
const kvar = (x) => `${fig(x / 1000)} kvar`;
const amps = (x) => `${fig(x)} A`;

/** One cycle: the instantaneous power, with the part flowing back to the supply shaded. */
function wave(B, rect, c) {
  const w = c.wave;
  const T = 1000 / SUPPLY.f;
  const pk = w.p.map((x) => x / 1000);
  const hi = Math.max(...pk, 1);
  const lo = Math.min(...pk, 0);
  const P = plotIn(B, rect, { lo: 0, hi: T }, { lo: lo - 0.6, hi: hi * 1.15 });
  axes(P, { xLabel: 'time (ms)', yLabel: 'power into the load (kW)' });
  const pts = w.ts.map((t, k) => [t * 1000, pk[k]]);
  // Shade below zero: energy going back to the supply.
  let run = [];
  const flush = () => {
    if (run.length > 1) poly(P, [[run[0][0], 0], ...run, [run[run.length - 1][0], 0]], { fill: alpha(C.red, 0.3), stroke: null });
    run = [];
  };
  for (const q of pts) {
    if (q[1] < 0) run.push(q);
    else flush();
  }
  flush();
  seg(P, [0, 0], [T, 0], { color: alpha(C.text, 0.35), width: 1 });
  seg(P, [0, SUPPLY.P / 1000], [T, SUPPLY.P / 1000], { color: alpha(C.green, 0.8), width: 1.5, dash: [6, 4] });
  label(P, `average ${kw(SUPPLY.P)}: the work`, [T, SUPPLY.P / 1000], { color: C.green, align: 'right', dy: -10 });
  line(P, pts, { color: C.gold, width: 2.5 });
  if (lo < -0.01) label(P, 'flowing back', [T * 0.02, lo], { color: C.red, align: 'left', dy: -8 });
}

/** The power triangles: the motor's alone, dashed, and the line's after the capacitor. */
function triangle(B, rect, c) {
  const P0 = SUPPLY.P / 1000;
  const qm = c.Qm / 1000;
  const q = c.Q / 1000;
  const top = Math.max(qm, 1) * 1.45;
  const bottom = Math.min(q, 0) * 1.3 - 0.5;
  const span = Math.max(P0 * 1.5, top - bottom);
  const P = plotIn(B, rect, { lo: -0.3, hi: span - 0.3 }, { lo: bottom, hi: top });
  axes(P, { xLabel: 'real power P (kW)', yLabel: 'reactive power Q (kvar)' });
  seg(P, [-0.3, 0], [span - 0.3, 0], { color: alpha(C.text, 0.3), width: 1 });
  // Motor alone.
  line(P, [[0, 0], [P0, 0], [P0, qm], [0, 0]], { color: alpha(C.muted, 0.8), width: 1.5, dash: [5, 4] });
  // Above the hypotenuse's middle, clear of the axis.
  label(P, `motor: S = ${fig(Math.hypot(P0, qm))} kVA`, [P0 / 2, qm], { color: C.muted });
  // The capacitor pulls Q down.
  if (c.Qc > 1) arrow(P, [P0 + 0.15 * P0, qm], -Math.PI / 2, Math.max(8, Math.abs(P.Y(qm - c.Qc / 1000) - P.Y(qm))), { color: C.blue, width: 2, head: 7 });
  if (c.Qc > 1) label(P, `capacitor −${kvar(c.Qc)}`, [P0 + 0.15 * P0, qm - c.Qc / 2000], { color: C.blue, align: 'left', dx: 8 });
  // The line's triangle.
  line(P, [[0, 0], [P0, 0], [P0, q], [0, 0]], { color: C.gold, width: 2.5 });
  label(P, `line: ${fig(c.S / 1000)} kVA, power factor ${fig(c.pfLine)}`, [0, top], { color: C.gold, align: 'left', dx: 4, dy: 10 });
}

export default defineLab({
  id: 'power',
  exam: 'u2',
  title: 'Power factor',
  hint: 'Lower the power factor: the work stays 5 kW, but the line current climbs. Then add capacitance until the line current is as small as it gets.',
  gapLimit: 1e-8,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('poor', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'Cuf', lo: 0, hi: 600 }),
  controls() {
    return `
      ${slider('pf-pf', 'Motor’s power factor, cos θ (lagging)', 0.6, 0.4, 1, 0.01)}
      ${slider('pf-c', 'Correcting capacitor (µF)', 0, 0, 600, 1)}
      <p class="tiny">The motor does ${SUPPLY.P / 1000} kW of work on a ${SUPPLY.V} V, ${SUPPLY.f} Hz supply; the wires to it have ${SUPPLY.Rline} Ω. The capacitor sits across the motor. Top: the power flowing into motor and capacitor through one cycle, red where it flows back. Bottom: the power triangles, P across and Q up.</p>`;
  },
  bind(api) {
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    return powerChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      triangle(B, B.free, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.5 * W } : { ...B.free, y1: B.free.y0 + 0.5 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    wave(B, a, c);
    triangle(B, b, c);
  },
  law: () => [String.raw`P = V_\text{rms}I_\text{rms}\cos\theta, \qquad Q = V_\text{rms}I_\text{rms}\sin\theta`, String.raw`S = \sqrt{P^2 + Q^2} = V_\text{rms}I_\text{rms}`, String.raw`Q_C = V^2\omega C`],
  liveRows(state, c) {
    return [
      kv('Work done, P', kw(SUPPLY.P)),
      kv('Reactive: motor, capacitor, net', `${kvar(c.Qm)}, ${kvar(c.Qc)}, ${kvar(Math.abs(c.Q) < 1 ? 0 : c.Q)}`),
      kv('Line current, and V × I', `${amps(c.I)}, ${fig(c.VI / 1000)} kVA`),
      kv('Line power factor', `${fig(c.pfLine)} ${Math.abs(c.Q) < 1 ? '' : c.lagging ? 'lagging' : 'leading'}`),
      kv('Loss in the wires', `${fig(c.loss)} W (uncorrected ${fig(c.lossMotorOnly)} W)`),
      kv('Capacitance for power factor 1', `${fig(c.Cfull)} µF`),
      kv('Phasors against the cycle average', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['line current', amps(c.I)],
      ['power factor', fig(c.pfLine)],
      ['wire loss', `${fig(c.loss)} W`],
      ['work', kw(SUPPLY.P)],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> A motor's power factor changes with its load, so fixed capacitors are sized for typical running; harmonics from electronic loads distort the current, which a capacitor cannot correct and can make worse.`;
    if (c.pfLine > 0.995) {
      return { title: 'Corrected: the line carries only the work', body: `The capacitor supplies the motor's ${kvar(c.Qm)} of reactive power across the motor itself, so the line carries ${amps(c.I)}, just P/V, and the wires lose ${fig(c.loss)} W instead of ${fig(c.lossMotorOnly)} W. ${leavesOut}` };
    }
    if (!c.lagging) {
      return { title: 'Overcorrected', body: `${fig(state.Cuf)} µF supplies more reactive power than the motor uses, ${kvar(c.Qc)} against ${kvar(c.Qm)}, so the line now leads and the current climbs back to ${amps(c.I)}. ${fig(c.Cfull)} µF would be just right. ${leavesOut}` };
    }
    return { title: 'Volts times amps is not the work', body: `The motor does ${kw(SUPPLY.P)} of work, but its current lags by ${fig((c.theta * 180) / Math.PI)}°: the line carries ${amps(c.I)}, as if for ${fig(c.VI / 1000)} kVA. Part of each cycle the energy flows back to the supply. The wires lose ${fig(c.loss)} W; a ${fig(c.Cfull)} µF capacitor would bring that to ${fig((SUPPLY.P / SUPPLY.V) ** 2 * SUPPLY.Rline)} W. ${leavesOut}` };
  },
  app: false,
});
