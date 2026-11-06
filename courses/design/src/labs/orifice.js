import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, line, note, plotIn, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { orificeDp, orificeFlow, orificeFlowNumeric } from '@flux/subjects/design/instruments.js';

/**
 * Orifice: water through a plate with a hole in a pipe, the pressure drop read by a transmitter.
 *
 * Shows that the drop rises as the square of the flow. A transmitter's error is a fixed share of its
 * span in pressure, so in flow it grows as the flow falls: a meter read near the bottom of its range
 * is coarse. The flow is found from the drop by the meter equation and again by bisection on the drop
 * equation (packages/subjects/src/design/instruments.js).
 */
const ACCURACY = 0.0025; // transmitter error, share of span: an example value

const SCENARIOS = [
  { id: 'design', name: 'At design flow', D: 50, beta: 0.5, Q: 15, span: 1 },
  { id: 'low', name: 'At a fifth of design flow', D: 50, beta: 0.5, Q: 3, span: 1 },
  { id: 'small', name: 'A smaller bore, β = 0.35', D: 50, beta: 0.35, Q: 15, span: 1 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, D: sc.D, beta: sc.beta, Q: sc.Q, span: sc.span });
}

const SI = (state, Q = state.Q) => ({ Q: Q / 3600, D: state.D / 1000, beta: state.beta });

export default defineLab({
  id: 'orifice',
  exam: 'u5',
  title: 'Orifice meter',
  hint: 'Turn the flow down to a fifth: the drop falls to a twenty-fifth, and the transmitter’s small error becomes a large share of the reading.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('design', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'Q', lo: 0.5, hi: 20 }),
  controls() {
    return `
      ${slider('or-Q', 'flow (m³/h)', 15, 0.5, 20, 0.1)}
      ${slider('or-D', 'pipe bore D (mm)', 50, 25, 100, 1)}
      ${slider('or-b', 'β = hole ÷ bore', 0.5, 0.3, 0.7, 0.01)}
      ${slider('or-s', 'transmitter span (bar)', 1, 0.1, 3, 0.05)}
      <p class="tiny">Water, C_d = 0.61 (Wikipedia gives 0.6 to 0.85). The transmitter is taken as good to ±0.25% of its span: an example value.</p>`;
  },
  bind(api) {
    bindSlider('or-Q', (s, v) => { s.Q = v; }, api);
    bindSlider('or-D', (s, v) => { s.D = v; }, api);
    bindSlider('or-b', (s, v) => { s.beta = v; }, api);
    bindSlider('or-s', (s, v) => { s.span = v; }, api);
  },
  syncControls(state) {
    for (const [id, val] of [['or-Q', state.Q], ['or-D', state.D], ['or-b', state.beta], ['or-s', state.span]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    }
  },
  compute(state) {
    const p = SI(state);
    const dp = orificeDp(p);
    const back = orificeFlow({ ...p, dp });
    const num = orificeFlowNumeric({ ...p, dp });
    const gap = Math.abs(num - back) / p.Q + Math.abs(back - p.Q) / p.Q;
    const spanPa = state.span * 1e5;
    const err = ACCURACY * spanPa;
    // Flow error from ±err in Δp: Q ∝ √Δp.
    const flowErr = (dpv) => (Math.sqrt(dpv + err) - Math.sqrt(Math.max(dpv - err, 0))) / (2 * Math.sqrt(Math.max(dpv, 1e-12)));
    const curve = Array.from({ length: 81 }, (_, i) => {
      const Q = 0.25 + (i / 80) * 19.75;
      const d = orificeDp(SI(state, Q));
      return [Q, d / 1e5, Math.min(flowErr(d) * 100, 50)];
    });
    return { dp, dpBar: dp / 1e5, share: dp / spanPa, flowErrPct: flowErr(dp) * 100, overRange: dp > spanPa, curve, gap };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const [top, bottom] = split(B.free, 0.5);
    const yHi = Math.max(state.span, ...c.curve.map(([, d]) => d)) * 1.1;
    const P = plotIn(B, top, { lo: 0, hi: 20 }, { lo: 0, hi: Math.min(yHi, state.span * 3) });
    axes(P, { xLabel: 'flow (m³/h)', yLabel: 'drop (bar)' });
    line(P, c.curve.map(([q, d]) => [q, d]), { color: C.teal, width: 2.5 });
    seg(P, [0, state.span], [20, state.span], { color: C.pink, width: 1.5, dash: [5, 4] });
    note(P, 'transmitter span', 0.5, state.span, { color: C.pink });
    dot(P, state.Q, c.dpBar, { color: C.yellow, r: 5 });
    const Q = plotIn(B, bottom, { lo: 0, hi: 20 }, { lo: 0, hi: 20 });
    axes(Q, { xLabel: 'flow (m³/h)', yLabel: 'flow error (±%)' });
    line(Q, c.curve.map(([q, , e]) => [q, Math.min(e, 20)]), { color: C.gold, width: 2.5 });
    dot(Q, state.Q, Math.min(c.flowErrPct, 20), { color: C.yellow, r: 5 });
    seg(Q, [0, 1], [20, 1], { color: alpha(C.text, 0.4), width: 1, dash: [3, 4] });
  },
  law: () => [String.raw`Q = C_d A_2 \sqrt{\frac{2\,\Delta p}{\rho\,(1 - \beta^4)}}`, String.raw`\frac{\delta Q}{Q} = \frac{1}{2}\,\frac{\delta(\Delta p)}{\Delta p}`],
  liveRows(state, c) {
    return [
      kv('pressure drop', `${fig(c.dp / 1000)} kPa`),
      kv('share of the span', `${fig(c.share * 100)}%`),
      kv('transmitter error', `±${fig(ACCURACY * state.span * 100)} kPa`),
      kv('meter equation against bisection', `${fig(c.gap * 100)}%`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['drop', `${fig(c.dpBar)} bar`],
      ['of span', c.overRange ? 'over range' : `${fig(c.share * 100)}%`],
      ['flow error', `±${fig(c.flowErrPct)}%`],
      ['flow', `${fig(state.Q)} m³/h`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> A constant C_d and a fully developed flow. Real installations need straight pipe upstream, and C_d drifts at low Reynolds numbers and as the plate's edge wears.`;
    let title = 'Read well within its range';
    let body = String.raw`At ${fig(state.Q)} m³/h the drop is ${fig(c.dpBar)} bar, ${fig(c.share * 100)}% of the span, and the flow is good to ±${fig(c.flowErrPct)}%.`;
    if (c.overRange) {
      title = 'Over range';
      body = String.raw`The drop, ${fig(c.dpBar)} bar, is past the transmitter's ${fig(state.span)} bar span: the reading pins at the top. A larger hole (higher β), a larger bore or a wider span brings it back.`;
    } else if (c.share < 0.1) {
      title = 'Near the bottom, the reading is coarse';
      body = String.raw`The drop goes as the flow squared, so at ${fig(state.Q)} m³/h it is only ${fig(c.share * 100)}% of the span. The transmitter's fixed error is now ±${fig(c.flowErrPct)}% of the flow. This is why a single orifice meter covers only a narrow range of flow.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
