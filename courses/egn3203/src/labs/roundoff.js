import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { FAMILIES, U, roundoff } from '@flux/subjects/math/roundoff.js';

/**
 * Round-off: one formula computed two ways in double precision, the direct way and a rewritten way
 * that never subtracts nearly equal numbers, against its Taylor series.
 *
 * Shows that a computer's answer is not always good to 16 digits. (1 − cos x)/x² loses every digit
 * by x = 10⁻⁸, though its true value is 1/2; 2 sin²(x/2)/x² keeps them all. The stable form is
 * checked against the series on every slider stop (packages/subjects/src/math/roundoff.js); the
 * direct form's error is the lesson. Everything here runs in the browser's own double precision.
 */
const SCENARIOS = [
  { id: 'cosine', name: '(1 − cos x)/x² near x = 10⁻⁴', family: 'cosine', lx: -4 },
  { id: 'cosine-zero', name: 'The same at x = 10⁻⁹: the direct form gives 0', family: 'cosine', lx: -9 },
  { id: 'expm1', name: '(eˣ − 1)/x near x = 10⁻⁸', family: 'expm1', lx: -8 },
  { id: 'sqrt', name: '√(x² + 1) − x at x = 10⁶', family: 'sqrt', lx: 6 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((x) => x.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, family: sc.family, lx: sc.lx });
}

const range = (family) => (FAMILIES[family]?.small === false ? { lo: 1, hi: 9 } : { lo: -10, hi: 0 });
const e = (v) => (v === 0 ? '0' : v.toExponential(2));

export default defineLab({
  id: 'roundoff',
  exam: 'u2',
  title: 'Round-off',
  hint: 'Slide x toward 0 and watch the direct form’s error climb until no digit is right. The rewritten form stays at the round-off floor.',
  gapLimit: 1e-13,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('cosine', s);
    return s;
  },
  applyScenario: apply,
  sweep: (s) => ({ key: 'lx', ...range(s.family) }),
  controls() {
    return `
      <label class="field"><span>Formula</span><select id="ro-fam">${Object.entries(FAMILIES).map(([id, f]) => `<option value="${id}">${f.name}</option>`).join('')}</select></label>
      ${slider('ro-lx', 'x = 10 to the power', -4, -10, 9, 0.05)}
      <p class="tiny">Pink: the formula as written. Teal: rewritten so nothing nearly equal is subtracted. Dashed: the unit round-off u = 2⁻⁵³ ≈ 1.1 × 10⁻¹⁶.</p>`;
  },
  bind(api) {
    document.getElementById('ro-fam')?.addEventListener('change', (ev) => {
      const s = api.slice();
      s.family = ev.target.value;
      const r = range(s.family);
      s.lx = Math.min(r.hi, Math.max(r.lo, s.lx));
      api.bump();
    });
    bindSlider('ro-lx', (s, v) => {
      const r = range(s.family);
      s.lx = Math.min(r.hi, Math.max(r.lo, v));
    }, api);
  },
  syncControls(state) {
    const f = document.getElementById('ro-fam');
    if (f) f.value = state.family;
    const el = document.getElementById('ro-lx');
    if (el) {
      const r = range(state.family);
      el.min = String(r.lo);
      el.max = String(r.hi);
      if (document.activeElement !== el) el.value = String(state.lx);
    }
  },
  compute(state) {
    const r = roundoff(state.family, 10 ** state.lx);
    const { lo, hi } = range(state.family);
    const curve = [];
    for (let i = 0; i <= 160; i++) {
      const lx = lo + ((hi - lo) * i) / 160;
      const p = roundoff(state.family, 10 ** lx);
      curve.push([lx, p.relDirect, p.relStable]);
    }
    return { ...r, lx: state.lx, curve, lo, hi, gap: r.relStable };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const P = plotIn(B, B.free, { lo: c.lo, hi: c.hi }, { lo: -17, hi: 0.5 });
    axes(P, { xLabel: 'log₁₀ x', yLabel: 'log₁₀ relative error' });
    const L = (v) => Math.log10(Math.max(v, 1e-17));
    seg(P, [c.lo, Math.log10(U)], [c.hi, Math.log10(U)], { color: alpha(C.text, 0.45), width: 1, dash: [4, 4] });
    line(P, c.curve.map(([x, d]) => [x, L(d)]), { color: C.pink, width: 2 });
    line(P, c.curve.map(([x, , s]) => [x, L(s)]), { color: C.teal, width: 2 });
    dot(P, c.lx, L(c.relDirect), { color: C.pink, r: 6, ring: C.text });
    dot(P, c.lx, L(c.relStable), { color: C.teal, r: 5 });
    // Each label sits in empty space beside its curve.
    label(P, `${c.name} as written`, [c.lo + (c.small ? 0.25 : 0.22) * (c.hi - c.lo), c.small ? -1.5 : -4], { color: C.pink });
    label(P, `${c.stableName}`, [(c.lo + c.hi) / 2, -13], { color: C.teal });
  },
  law: () => [String.raw`\operatorname{fl}(x) = x(1 + \delta), \quad |\delta| \le u = 2^{-53}`, String.raw`1 - \cos x = 2\sin^2\tfrac{x}{2}`],
  liveRows(state, c) {
    return [
      kv('x', e(c.x)),
      kv('As written', `${c.direct}`),
      kv('Rewritten', `${c.stable}`),
      kv('Taylor series', `${c.truth}`),
      kv('Correct digits, as written', fig(c.digitsDirect)),
      kv('Correct digits, rewritten', fig(c.digitsStable)),
      kv('Estimated error as written', e(c.estimate)),
      kv('Rewritten against the series', e(c.gap)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['x', e(c.x)],
      ['error, as written', e(c.relDirect)],
      ['error, rewritten', e(c.relStable)],
      ['digits lost', fig(16 - c.digitsDirect)],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Other formats. Single precision keeps about 7 digits, so the same loss arrives far sooner; and the order of a long sum changes its round-off.`;
    let title = 'Each operation is good to about 16 digits';
    let body = `At x = ${e(c.x)} the formula as written still has ${fig(c.digitsDirect)} correct digits. The error grows as the two numbers it subtracts get closer: about ${e(c.estimate)} here.`;
    if (c.relDirect > 0.5) {
      title = 'Every digit is gone';
      body = `The two numbers being subtracted are equal in double precision, so the difference is ${c.direct === 0 ? '0' : 'pure round-off'}. The true value is ${fig(c.truth)}. The rewritten form ${c.stableName} never subtracts nearly equal numbers and keeps ${fig(c.digitsStable)} digits.`;
    } else if (c.digitsDirect < 10) {
      title = 'Cancellation eats the leading digits';
      body = `The two numbers being subtracted agree in their first ${fig(16 - c.digitsDirect)} digits, which cancel. What is left is mostly round-off: ${fig(c.digitsDirect)} correct digits. The rewritten form keeps ${fig(c.digitsStable)}.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
