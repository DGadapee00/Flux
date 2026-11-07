import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { amplifierChecked, closedGain } from '@flux/subjects/em/opamp.js';

/**
 * Op amp: an inverting amplifier with sliders for its two resistors, the op amp's open-loop gain,
 * the supply and the input.
 *
 * Shows that the op amp's own gain hardly sets the circuit's gain: from A = 10⁵ to 10³, a hundredfold
 * drop, the gain moves from −9.999 to −9.891, about 1%. The resistors set it, −R_f/R₁, until the
 * output reaches a rail and clips. The gain comes from the closed form; the second method solves the
 * node equation and the op amp's equation together by elimination (packages/subjects/src/em/opamp.js).
 */
const HEADROOM = 1.5; // V the output stays inside each rail
const SCENARIOS = [
  { id: 'ideal', name: 'A gain of 10 with A = 10⁵', lA: 5, R1: 10, Rf: 100, Vs: 15, amp: 0.5 },
  { id: 'weak', name: 'The same with A = 10³', lA: 3, R1: 10, Rf: 100, Vs: 15, amp: 0.5 },
  { id: 'clip', name: 'Driven into the rails', lA: 5, R1: 10, Rf: 100, Vs: 15, amp: 2 },
  { id: 'hundred', name: 'A gain of 100 with A = 10³', lA: 3, R1: 1, Rf: 100, Vs: 15, amp: 0.1 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, lA: sc.lA, R1: sc.R1, Rf: sc.Rf, Vs: sc.Vs, amp: sc.amp });
}

const KEYS = [['oa-a', 'lA'], ['oa-r1', 'R1'], ['oa-rf', 'Rf'], ['oa-vs', 'Vs'], ['oa-in', 'amp']];
const params = (s) => ({ A: 10 ** s.lA, R1: 1000 * s.R1, Rf: 1000 * s.Rf, Vsat: s.Vs - HEADROOM, amp: s.amp });
const volts = (v) => `${fig(v)} V`;

/** One period of the input and the output, with the rails. */
function waves(B, rect, state, c) {
  const vsat = state.Vs - HEADROOM;
  const top = Math.max(state.Vs, state.amp) * 1.1;
  const P = plotIn(B, rect, { lo: 0, hi: 1 }, { lo: -top, hi: top });
  axes(P, { xLabel: 'time (one period)', yLabel: 'volts' });
  for (const s of [1, -1]) {
    seg(P, [0, s * vsat], [1, s * vsat], { color: alpha(C.red, 0.6), width: 1, dash: [5, 4] });
    label(P, s > 0 ? `rail ${volts(vsat)}` : `rail ${volts(-vsat)}`, [1, s * vsat], { color: C.red, align: 'right', dy: -9 });
  }
  seg(P, [0, 0], [1, 0], { color: alpha(C.text, 0.3), width: 1 });
  line(P, c.ts.map((t, i) => [t, c.vin[i]]), { color: C.teal, width: 2 });
  line(P, c.ts.map((t, i) => [t, c.vout[i]]), { color: c.clipped ? C.red : C.gold, width: 2.5 });
  label(P, 'in', [0.25, state.amp], { color: C.teal, dy: -10 });
  label(P, 'out', [0.75, -c.vout[c.ts.length >> 2]], { color: c.clipped ? C.red : C.gold, dy: -10 });
}

/** The circuit's gain against the op amp's, on a log scale, with −R_f/R₁ marked. */
function gainPlot(B, rect, state, c) {
  const p = params(state);
  const ideal = Math.abs(c.ideal);
  const P = plotIn(B, rect, { lo: 1, hi: 7, log: false }, { lo: 0, hi: ideal * 1.25 });
  axes(P, { xLabel: 'op amp gain, log₁₀ A', yLabel: '|circuit gain|' });
  seg(P, [1, ideal], [7, ideal], { color: alpha(C.green, 0.8), width: 1.5, dash: [6, 4] });
  label(P, `R_f/R₁ = ${fig(ideal)}`, [1, ideal], { color: C.green, align: 'left', dx: 6, dy: -10 });
  const curve = Array.from({ length: 121 }, (_, k) => {
    const lA = 1 + (6 * k) / 120;
    return [lA, Math.abs(closedGain({ ...p, A: 10 ** lA }))];
  });
  line(P, curve, { color: C.gold, width: 2.5 });
  dot(P, state.lA, Math.abs(c.G), { color: C.pink, r: 6, ring: C.text });
  label(P, fig(Math.abs(c.G)), [state.lA, Math.abs(c.G)], { color: C.pink, align: state.lA > 5 ? 'right' : 'left', dx: state.lA > 5 ? -10 : 10, dy: 14 });
}

export default defineLab({
  id: 'opamp',
  exam: 'u5',
  title: 'Op amp',
  hint: 'Drop the op amp’s gain a hundredfold, from 10⁵ to 10³: the circuit’s gain barely moves. Then turn up the input until the output flattens against a rail.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('ideal', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'lA', lo: 1, hi: 7 }),
  controls() {
    return `
      ${slider('oa-a', 'Op amp’s own gain, log₁₀ A', 5, 1, 7, 0.05)}
      ${slider('oa-r1', 'Input resistor R₁ (kΩ)', 10, 1, 50, 0.5)}
      ${slider('oa-rf', 'Feedback resistor R_f (kΩ)', 100, 1, 500, 1)}
      ${slider('oa-vs', 'Supply, ± (V)', 15, 5, 18, 0.5)}
      ${slider('oa-in', 'Input amplitude (V)', 0.5, 0.05, 3, 0.05)}
      <p class="tiny">Inverting amplifier: R₁ from the input to the − input, R_f from the output back to it, + input grounded. The output stays ${HEADROOM} V inside each supply rail. Teal: input. Gold: output, red once it clips.</p>`;
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
    return amplifierChecked(params(state));
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      waves(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.52 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    waves(B, a, state, c);
    gainPlot(B, b, state, c);
  },
  law: () => [String.raw`G = \frac{v_\text{out}}{v_\text{in}} = \frac{-R_f/R_1}{1 + (1 + R_f/R_1)/A}`, String.raw`G \to -\frac{R_f}{R_1}, \qquad v_- \to 0 \quad \text{as } A \to \infty`, String.raw`|v_\text{out}| \le V_\text{sat}`],
  liveRows(state, c) {
    return [
      kv('Circuit gain, and −R_f/R₁', `${fig(c.G)}, ${fig(c.ideal)}`),
      kv('Gain error from the op amp', `${fig(100 * c.error)}%`),
      kv('Largest v₋, the “virtual ground”', `${fig(1000 * c.vmPeak)} mV`),
      kv('Output peak', volts(c.peak)),
      kv('Largest input before clipping', volts(c.maxIn)),
      kv('Formula against elimination', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['gain', fig(c.G)],
      ['−R_f/R₁', fig(c.ideal)],
      ['error', `${fig(100 * c.error)}%`],
      ['output', c.clipped ? 'clipped' : `±${fig(c.peak)} V`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> A real op amp's gain falls with frequency, so at high frequency there is less to spare; it has an input offset and bias currents, and its output can only change so fast.`;
    if (c.clipped) {
      return { title: 'Clipped at the rail', body: `The gain is ${fig(c.G)}, so an input above ${volts(c.maxIn)} asks for more than the rail can give. The output flattens at ${volts(c.peak)}, and while it does v₋ leaves zero: the virtual ground only holds while the op amp is in its linear range. ${leavesOut}` };
    }
    if (c.error > 0.05) {
      return { title: 'Not enough gain to spare', body: `With A = ${fig(10 ** state.lA)} and R_f/R₁ = ${fig(-c.ideal)}, the loop has little gain left over: the circuit gives ${fig(c.G)}, ${fig(100 * c.error)}% short. Feedback works when A is far larger than 1 + R_f/R₁. ${leavesOut}` };
    }
    return { title: 'The resistors set the gain', body: `The op amp multiplies by ${fig(10 ** state.lA)}, yet the circuit's gain is ${fig(c.G)}, within ${fig(100 * c.error)}% of −R_f/R₁ = ${fig(c.ideal)}. Feedback holds v₋ within ${fig(1000 * c.vmPeak)} mV of ground, so the current through R₁ all goes through R_f. ${leavesOut}` };
  },
  app: false,
});
