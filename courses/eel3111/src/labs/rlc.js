import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { PARTS, T_SHOW, rlcChecked, rlcClosed } from '@flux/subjects/em/rlc.js';

/**
* RLC step: a series RLC driven by a 10 V step and a parallel RLC driven by a 10 mA step, with a
 * slider for the resistance, the response drawn and the regime named.
 *
 * Shows that more resistance does not always mean more damping: in the series circuit ζ = (R/2)√(C/L)
 * grows with R, but in the parallel one ζ = (1/2R)√(L/C) shrinks. With L = 10 mH and C = 1 µF, 200 Ω
 * is critical in series and 50 Ω in parallel; a 2 kΩ parallel resistor leaves the tank ringing with a
 * 92% overshoot. The closed-form responses are checked by Runge–Kutta (packages/subjects/src/em/rlc.js).
 */
const SCENARIOS = [
  { id: 'ring', name: 'Series, 20 Ω: rings', topo: 'series', lR: 1.301 },
  { id: 'critical', name: 'Series, 200 Ω: critical', topo: 'series', lR: 2.301 },
  { id: 'parallel', name: 'Parallel, 50 Ω: critical', topo: 'parallel', lR: 1.699 },
  { id: 'parring', name: 'Parallel, 2 kΩ: rings', topo: 'parallel', lR: 3.301 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, topo: sc.topo, lR: sc.lR });
}

const KEYS = [['rl-r', 'lR']];

const fR = (state) => 10 ** state.lR;
const unitOf = (state) => (state.topo === 'parallel' ? 'mA' : 'V');
const scaleOf = (state) => (state.topo === 'parallel' ? 1000 : 1);

function resp(B, rect, state, c) {
  const k = scaleOf(state);
  const top = c.final * k * 2.05;
  const P = plotIn(B, rect, { lo: 0, hi: T_SHOW * 1000 }, { lo: 0, hi: top });
  axes(P, { xLabel: 'time (ms)', yLabel: state.topo === 'parallel' ? 'inductor current (mA)' : 'capacitor voltage (V)' });
  seg(P, [0, c.final * k], [T_SHOW * 1000, c.final * k], { color: alpha(C.muted, 0.8), width: 1, dash: [5, 4] });
  line(P, Array.from({ length: 401 }, (_, i) => [(T_SHOW * 1000 * i) / 400, c.y((T_SHOW * i) / 400) * k]), { color: C.gold, width: 2.5 });
  c.pts.filter((_, i) => i % 8 === 0).forEach(([t, y]) => dot(P, t * 1000, y * k, { color: C.blue, r: 2.5 }));
  label(P, `${c.regime}, ζ = ${fig(c.zeta)}`, [T_SHOW * 1000, top], { color: C.text, align: 'right', dy: 12 });
}

function zPlot(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 1, hi: 1e4, log: true }, { lo: 0.003, hi: 300, log: true });
  axes(P, { xLabel: 'resistance R (Ω)', yLabel: 'damping ratio ζ' });
  const rs = Array.from({ length: 81 }, (_, i) => 10 ** (i / 20));
  line(P, rs.map((R) => [R, rlcClosed({ topo: 'series', R }).zeta]), { color: C.gold, width: state.topo === 'series' ? 2.5 : 1.5 });
  line(P, rs.map((R) => [R, rlcClosed({ topo: 'parallel', R }).zeta]), { color: C.blue, width: state.topo === 'parallel' ? 2.5 : 1.5, dash: [6, 4] });
  seg(P, [1, 1], [1e4, 1], { color: alpha(C.red, 0.7), width: 1, dash: [3, 3] });
  label(P, 'critical, ζ = 1', [1.2, 1], { color: C.red, align: 'left', dy: -8 });
  label(P, 'series', [1e4, rlcClosed({ topo: 'series', R: 1e4 }).zeta], { color: C.gold, align: 'right', dy: 14 });
  label(P, 'parallel', [1e4, rlcClosed({ topo: 'parallel', R: 1e4 }).zeta], { color: C.blue, align: 'right', dy: -10 });
  dot(P, fR(state), c.zeta, { color: C.pink, r: 6, ring: C.text });
}

export default defineLab({
  id: 'rlc',
  exam: 'u4',
  title: 'RLC step',
  hint: 'Raise R in the series circuit and watch the ringing die. Do the same in the parallel one.',
  gapLimit: 1e-7,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('ring', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'lR', lo: 0, hi: 4 }),
  controls() {
    return `
      <label class="field"><span>Circuit</span><select id="rl-t">${[['series', 'Series RLC, 10 V step'], ['parallel', 'Parallel RLC, 10 mA step']].map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></label>
      ${slider('rl-r', "Resistance, log₁₀(R / 1 Ω)", 1.301, 0, 4, 0.01)}
      <p class="tiny">L = 10 mH and C = 1 µF, so f₀ = 1.59 kHz. Series: the capacitor’s voltage. Parallel: the inductor’s current. Left: the response over 4 ms, the closed form (line) and Runge–Kutta (dots). Right: ζ against R for both circuits; ζ = 1 is critical.</p>`;
  },
  bind(api) {
    document.getElementById('rl-t')?.addEventListener('change', (e) => {
      api.slice().topo = e.target.value;
      api.bump();
    });
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    {
      const el = document.getElementById('rl-t');
      if (el) el.value = String(state.topo);
    }
    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    return rlcChecked({ topo: state.topo, R: 10 ** state.lR });
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      resp(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    resp(B, a, state, c);
    zPlot(B, b, state, c);
  },
  law: () => [String.raw`L\ddot q + R\dot q + \frac{q}{C} = 0, \qquad \omega_0 = \frac{1}{\sqrt{LC}}`, String.raw`\text{series: } \alpha = \frac{R}{2L}, \qquad \text{parallel: } \alpha = \frac{1}{2RC}`, String.raw`\zeta = \frac{\alpha}{\omega_0}`],
  liveRows(state, c) {
    return [
      kv('R', `${fig(fR(state))} Ω`),
      kv('α and ω₀', `${fig(c.alpha)} s⁻¹, ${fig(c.w0)} rad/s`),
      kv('Damping ratio ζ', fig(c.zeta)),
      kv('Regime', c.regime),
      kv('Overshoot', c.zeta < 1 ? `${fig(100 * c.overshoot)}%` : 'none'),
      kv('Closed form against Runge–Kutta', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['ζ', fig(c.zeta)], ['regime', c.regime], ['R', `${fig(fR(state))} Ω`], ['overshoot', c.zeta < 1 ? `${fig(100 * c.overshoot)}%` : '0']]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Real inductors have winding resistance in series, which damps a parallel tank even with no parallel resistor, and real capacitors leak.`;
    if (state.topo === 'parallel') return { title: 'Parallel: more R, less damping', body: `The resistor sits across the tank and drains it only through the current it draws, V/R. A larger R draws less, so damping falls: at ${fig(fR(state))} Ω, ζ = ${fig(c.zeta)}, ${c.regime}. ${leavesOut}` };
    return { title: 'Series: more R, more damping', body: `The same current flows through R, L and C, so R takes energy out every cycle: at ${fig(fR(state))} Ω, ζ = ${fig(c.zeta)}, ${c.regime}${c.zeta < 1 ? `, overshooting by ${fig(100 * c.overshoot)}%` : ''}. ${leavesOut}` };
  },
  app: false,
});
