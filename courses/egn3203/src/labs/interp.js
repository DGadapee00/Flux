import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { interpChecked, maxErr, runge } from '@flux/subjects/math/interp.js';

/**
* Interpolation: the polynomial through n + 1 points of Runge's function 1/(1 + 25x²), with a
 * slider for n and a choice of equally spaced or Chebyshev points.
 *
 * Shows that more points do not always give a better fit: on equal spacing the error near the ends
 * grows without bound, 1.05 at n = 8 and 14 at n = 16, while Chebyshev points, crowded toward the
 * ends, bring it down to 0.04. The barycentric form is checked against Newton's divided differences
 * (packages/subjects/src/math/interp.js).
 */
const SCENARIOS = [
  { id: 'eq8', name: '8 equally spaced intervals', n: 8, kind: 'equal' },
  { id: 'eq16', name: '16 equally spaced intervals', n: 16, kind: 'equal' },
  { id: 'cheb16', name: '16 intervals, Chebyshev points', n: 16, kind: 'cheb' },
  { id: 'eq2', name: 'Three points, a quadratic', n: 2, kind: 'equal' },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, n: sc.n, kind: sc.kind });
}

const KEYS = [['ip-n', 'n']];

function curve(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: -1.05, hi: 1.05 }, { lo: -1, hi: 2 });
  axes(P, { xLabel: 'x', yLabel: 'y' });
  const xs = Array.from({ length: 421 }, (_, i) => -1.05 + (2.1 * i) / 420);
  line(P, xs.map((x) => [x, runge(x)]), { color: alpha(C.muted, 0.9), width: 1.5, dash: [6, 4] });
  let run = [];
  const flush = () => {
    if (run.length > 1) line(P, run, { color: C.gold, width: 2.5 });
    run = [];
  };
  for (const x of xs) {
    if (Math.abs(x) > 1) continue;
    const y = c.p(x);
    if (y > -1 && y < 2) run.push([x, y]);
    else flush();
  }
  flush();
  c.xs.forEach((x, i) => dot(P, x, c.ys[i], { color: C.blue, r: 4 }));
}

function errors(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 2, hi: 20 }, { lo: 1e-3, hi: 1e3, log: true });
  axes(P, { xLabel: 'degree n', yLabel: 'largest error on [−1, 1]' });
  const ns = Array.from({ length: 19 }, (_, i) => i + 2);
  line(P, ns.map((n) => [n, maxErr(n, 'equal')]), { color: C.red, width: 2.5 });
  line(P, ns.map((n) => [n, maxErr(n, 'cheb')]), { color: C.green, width: 2.5 });
  label(P, 'equally spaced', [12, maxErr(12, 'equal')], { color: C.red, align: 'right', dx: -8, dy: -12 });
  label(P, 'Chebyshev', [12, maxErr(12, 'cheb')], { color: C.green, align: 'left', dy: 16 });
  dot(P, state.n, c.err, { color: C.pink, r: 6, ring: C.text });
}

export default defineLab({
  id: 'interp',
  exam: 'u2',
  title: 'Interpolation',
  hint: 'Raise n on equal spacing and watch the ends swing. Then switch to Chebyshev points.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('eq8', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'n', lo: 2, hi: 20 }),
  controls() {
    return `
      <label class="field"><span>Points</span><select id="ip-k">${[['equal', 'Equally spaced'], ['cheb', 'Chebyshev, x = cos(iπ/n)']].map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></label>
      ${slider('ip-n', "Degree n (n + 1 points)", 8, 2, 20, 1)}
      <p class="tiny">f(x) = 1/(1 + 25x²) on [−1, 1], smooth everywhere. Left: f (dashed) and the interpolating polynomial through the dots, clipped to the frame. Right: the largest error on [−1, 1] against n, for both kinds of points.</p>`;
  },
  bind(api) {
    document.getElementById('ip-k')?.addEventListener('change', (e) => {
      api.slice().kind = e.target.value;
      api.bump();
    });
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    {
      const el = document.getElementById('ip-k');
      if (el) el.value = String(state.kind);
    }
    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    return interpChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      curve(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    curve(B, a, state, c);
    errors(B, b, state, c);
  },
  law: () => [String.raw`p(x) = \sum_{i=0}^{n} y_i\prod_{j\ne i}\frac{x - x_j}{x_i - x_j}`, String.raw`f(x) - p(x) = \frac{f^{(n+1)}(\xi)}{(n+1)!}\prod_{i=0}^{n}(x - x_i)`],
  liveRows(state, c) {
    return [
      kv('Points', String(state.n + 1)),
      kv('Largest error', fig(c.err)),
      kv('Where', `x = ${fig(c.at)}`),
      kv('Barycentric against divided differences', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['largest error', fig(c.err)], ['at x', fig(c.at)], ['points', String(state.n + 1)], ['spacing', state.kind === 'cheb' ? 'Chebyshev' : 'equal']]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Piecewise polynomials, splines, avoid the problem entirely by keeping each piece’s degree low; and data rarely let you choose where the points fall.`;
    if (state.kind === 'cheb') return { title: 'Chebyshev points tame the ends', body: `Crowding the points toward ±1 keeps Π(x − x_i) small everywhere, and the error falls as n rises: ${fig(c.err)} at n = ${state.n}. ${leavesOut}` };
    if (c.err > 0.5) return { title: 'More points, worse ends', body: `With ${state.n + 1} equally spaced points the polynomial passes through every one but swings near the ends, by ${fig(c.err)} at x = ${fig(c.at)}. Π(x − x_i) is largest there, and f’s high derivatives grow fast. Switch to Chebyshev points. ${leavesOut}` };
    return { title: 'A few points: a fair fit', body: `With ${state.n + 1} equally spaced points the error is ${fig(c.err)}. Add more and watch the ends. ${leavesOut}` };
  },
  app: false,
});
