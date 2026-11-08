import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { EPS, X0, diffChecked, errorsAt } from '@flux/subjects/math/fdiff.js';

/**
* Derivative: the forward and central differences of sin x at x = 1, with a slider for the step h,
 * their errors against cos 1 drawn on log axes.
 *
 * Shows that a smaller step is not always more accurate: the error falls as h shrinks, bottoms out
 * near h = 10⁻⁸ (forward) or 10⁻⁵ (central), then climbs as round-off takes over. At h = 10⁻¹⁵ both
 * are wrong in the second digit. The reference cos 1 is checked by the complex step, which has no
 * subtraction (packages/subjects/src/math/fdiff.js).
 */
const SCENARIOS = [
  { id: 'coarse', name: 'h = 0.001', lh: -3 },
  { id: 'central', name: 'h = 10⁻⁵, best for central', lh: -5 },
  { id: 'forward', name: 'h = 10⁻⁸, best for forward', lh: -8 },
  { id: 'tiny', name: 'h = 10⁻¹³', lh: -13 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, lh: sc.lh });
}

const KEYS = [['nd-h', 'lh']];

function errs(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 1e-16, hi: 0.1, log: true }, { lo: 1e-13, hi: 1, log: true });
  const dec = (k) => (v) => {
    const e = Math.round(Math.log10(v));
    return Math.abs(v / 10 ** e - 1) < 1e-6 && e % k === 0 ? `1e${e}` : '';
  };
  axes(P, { xLabel: 'step h', yLabel: 'error in the derivative', xFmt: dec(3), yFmt: dec(3) });
  const ls = Array.from({ length: 151 }, (_, i) => -16 + (15 * i) / 150);
  const clip = (v) => Math.max(1e-13, Math.min(1, v));
  line(P, ls.map((l) => [10 ** l, clip(errorsAt(l).f)]), { color: C.red, width: 1.8 });
  line(P, ls.map((l) => [10 ** l, clip(errorsAt(l).c)]), { color: C.blue, width: 1.8 });
  const f = Math.abs(Math.sin(X0));
  line(P, ls.map((l) => [10 ** l, clip((10 ** l / 2) * f + (EPS * f) / 10 ** l)]), { color: alpha(C.red, 0.6), width: 1.2, dash: [5, 4] });
  line(P, ls.map((l) => [10 ** l, clip((10 ** (2 * l) / 6) * Math.cos(X0) + (EPS * f) / 10 ** l)]), { color: alpha(C.blue, 0.6), width: 1.2, dash: [5, 4] });
  label(P, 'forward', [0.1, clip(errorsAt(-1).f)], { color: C.red, align: 'right', dy: -10 });
  label(P, 'central', [0.1, clip(errorsAt(-1).c)], { color: C.blue, align: 'right', dy: 14 });
  dot(P, c.h, clip(c.errF), { color: C.red, r: 6, ring: C.text });
  dot(P, c.h, clip(c.errC), { color: C.blue, r: 6, ring: C.text });
}

export default defineLab({
  id: 'derivative',
  exam: 'u2',
  title: 'Derivative',
  hint: 'Shrink h from 10⁻² and watch the forward error fall, then turn up below 10⁻⁸.',
  gapLimit: 1e-12,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('coarse', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'lh', lo: -16, hi: -1 }),
  controls() {
    return `
      ${slider('nd-h', "Step, log₁₀ h", -2, -16, -1, 0.05)}
      <p class="tiny">Double precision, ε = 2⁻⁵² ≈ 2.2 × 10⁻¹⁶. Solid: the errors actually computed. Dashed: truncation plus round-off, (h/2)|f″| + ε|f|/h for forward and (h²/6)|f‴| + ε|f|/h for central.</p>`;
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
    return diffChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    errs(B, B.free, state, c);
  },
  law: () => [String.raw`\frac{f(x+h) - f(x)}{h} = f'(x) + \frac h2 f''(x) + \cdots`, String.raw`\frac{f(x+h) - f(x-h)}{2h} = f'(x) + \frac{h^2}{6}f'''(x) + \cdots`, String.raw`\text{round-off} \approx \frac{\varepsilon|f|}{h}`],
  liveRows(state, c) {
    return [
      kv('Step h', c.h.toExponential(1)),
      kv('Forward: value, error', `${c.fwd.toFixed(12)}, ${c.errF.toExponential(1)}`),
      kv('Central: value, error', `${c.cen.toFixed(12)}, ${c.errC.toExponential(1)}`),
      kv('Best h, forward and central', `${c.hOptF.toExponential(0)}, ${c.hOptC.toExponential(0)}`),
      kv('cos 1 against the complex step', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['h', c.h.toExponential(0)], ['forward error', c.errF.toExponential(1)], ['central error', c.errC.toExponential(1)], ['exact', fig(c.exact)]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Measured data carry far more noise than ε, which moves the best h up a long way; automatic differentiation and the complex step avoid the subtraction altogether.`;
    if (c.h < c.hOptF / 3) return { title: 'Round-off has taken over', body: `At h = ${c.h.toExponential(0)} the two values of sin agree in all but the last few digits, and subtracting them leaves mostly rounding: the forward error is ${c.errF.toExponential(1)}, worse than at h = 10⁻⁸. The round-off term ε|f|/h grows as h shrinks. ${leavesOut}` };
    if (c.h > c.hOptC * 3) return { title: 'Truncation dominates', body: `At h = ${c.h.toExponential(0)} the error is the Taylor series’ next term: forward ${c.errF.toExponential(1)} ≈ (h/2)|f″|, central ${c.errC.toExponential(1)} ≈ (h²/6)|f‴|. Shrink h and both fall, the central one faster. ${leavesOut}` };
    return { title: 'Near the best step', body: `Truncation and round-off are about equal here. The central difference is best near h = ${c.hOptC.toExponential(0)}, with error ${c.errC.toExponential(1)}; the forward difference near ${c.hOptF.toExponential(0)}. ${leavesOut}` };
  },
  app: false,
});
