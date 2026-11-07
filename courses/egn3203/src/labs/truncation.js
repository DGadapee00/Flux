import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { METHODS, differences } from '@flux/subjects/math/differences.js';

/**
 * Truncation: the derivative of sin x at x = 1 by forward, central and five-point differences, as
 * the step h shrinks.
 *
 * Shows that methods do not all improve at the same rate: halving h halves the forward error,
 * quarters the central one and divides the five-point one by sixteen. Their slopes on log axes are
 * the orders 1, 2 and 4. Below some h the round-off in sin x, divided by h, takes over and every
 * error climbs again: there is a best step. The exact derivative cos 1 is checked by complex-step
 * differentiation, which subtracts nothing (packages/subjects/src/math/differences.js).
 */
const SCENARIOS = [
  { id: 'tenth', name: 'h = 0.1: three methods, three accuracies', lh: -1 },
  { id: 'small', name: 'h = 10⁻⁸: round-off takes over', lh: -8 },
  { id: 'best', name: 'h = 10⁻³: near the five-point method’s best', lh: -3 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((x) => x.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, lh: sc.lh });
}

const COLORS = { forward: C.pink, central: C.gold, five: C.teal };
const e = (v) => (v === 0 ? '0' : v.toExponential(2));

export default defineLab({
  id: 'truncation',
  exam: 'u2',
  title: 'Truncation',
  hint: 'Halve h and read each error: one halves, one quarters, one falls sixteenfold. Then keep shrinking h and watch round-off turn them all back up.',
  gapLimit: 1e-14,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('tenth', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'lh', lo: -12, hi: -0.5 }),
  controls() {
    return `
      ${slider('tr-lh', 'Step h = 10 to the power', -1, -12, -0.5, 0.05)}
      <p class="tiny">f(x) = sin x at x = 1; the exact derivative is cos 1 = 0.540302. Pink: forward. Gold: central. Teal: five-point.</p>`;
  },
  bind(api) {
    bindSlider('tr-lh', (s, v) => { s.lh = v; }, api);
  },
  syncControls(state) {
    const el = document.getElementById('tr-lh');
    if (el && document.activeElement !== el) el.value = String(state.lh);
  },
  compute(state) {
    const r = differences(10 ** state.lh);
    const curves = {};
    for (const id of Object.keys(METHODS)) curves[id] = [];
    for (let i = 0; i <= 230; i++) {
      const lh = -12 + (11.5 * i) / 230;
      const p = differences(10 ** lh);
      for (const id of Object.keys(METHODS)) curves[id].push([lh, Math.log10(Math.max(p.methods[id].error, 1e-17))]);
    }
    const best = {};
    for (const id of Object.keys(METHODS)) best[id] = curves[id].reduce((a, b) => (b[1] < a[1] ? b : a))[0];
    return { ...r, lh: state.lh, curves, best };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const P = plotIn(B, B.free, { lo: -12, hi: -0.5 }, { lo: -17, hi: 0 });
    axes(P, { xLabel: 'log₁₀ h', yLabel: 'log₁₀ error' });
    for (const [id, pts] of Object.entries(c.curves)) line(P, pts, { color: COLORS[id], width: 2 });
    for (const [id, m] of Object.entries(c.methods)) dot(P, c.lh, Math.log10(Math.max(m.error, 1e-17)), { color: COLORS[id], r: 5, ring: C.text });
    // The empty top-left corner holds the key; the curves only reach it below 10⁻⁴.
    // Spaced in pixels, so the key stays legible on a short plot.
    label(P, 'forward: slope 1', [-11.6, -0.4], { color: C.pink, align: 'left', dy: 0 });
    label(P, 'central: slope 2', [-11.6, -0.4], { color: C.gold, align: 'left', dy: 14 });
    label(P, 'five-point: slope 4', [-11.6, -0.4], { color: C.teal, align: 'left', dy: 28 });
    if (P.box.y1 - P.box.y0 > 250) label(P, 'left of the dip, round-off grows as 1/h', [-11.6, -0.4], { color: alpha(C.text, 0.7), align: 'left', dy: 42 });
  },
  law: () => [String.raw`\frac{f(x+h) - f(x)}{h} = f'(x) + \frac h2 f''(x) + \dots`, String.raw`\text{error} \approx K h^p \;\Rightarrow\; p \approx \log_2\frac{E(h)}{E(h/2)}`],
  liveRows(state, c) {
    const row = (id) => {
      const m = c.methods[id];
      return kv(`${m.name} (order ${m.order})`, `error ${e(m.error)}, observed order ${m.observed == null ? '—' : fig(m.observed)}`);
    };
    return [
      kv('h', e(c.h)),
      row('forward'),
      row('central'),
      row('five'),
      kv('Best h (forward, central, five-point)', ['forward', 'central', 'five'].map((id) => `10^${fig(c.best[id])}`).join(', ')),
      kv('cos 1 against the complex step', e(c.gap)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['h', e(c.h)],
      ['forward error', e(c.methods.forward.error)],
      ['central error', e(c.methods.central.error)],
      ['five-point error', e(c.methods.five.error)],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Noisy data. Measured values carry far more error than u, so the best step for differencing data is much larger, and higher order buys less. Smoothing or fitting first is the usual answer.`;
    const f = c.methods.forward;
    if (f.observed != null && f.observed > 0.9 && c.methods.central.observed > 1.8) {
      return {
        title: 'Order is the slope',
        body: `Halving h here changes the forward error by a factor of ${fig(2 ** f.observed)}, the central by ${fig(2 ** c.methods.central.observed)}${c.methods.five.observed > 3.5 ? `, and the five-point by ${fig(2 ** c.methods.five.observed)}` : ''}. The Taylor series says why: forward differencing leaves an error term in h, central cancels it and leaves h², five points cancel up to h⁴. ${leavesOut}`,
      };
    }
    return {
      title: 'Too small a step: round-off takes over',
      body: `At h = ${e(c.h)} each difference subtracts values of sin x that agree in most of their digits, and divides the round-off by h. The errors now grow as h shrinks. The best step is near 10^${fig(c.best.forward)} for the forward difference and 10^${fig(c.best.five)} for the five-point one: higher order reaches its best sooner, at a larger h. ${leavesOut}`,
    };
  },
  app: false,
});
