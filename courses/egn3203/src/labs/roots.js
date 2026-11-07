import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { CUBICS, f, findRoots } from '@flux/subjects/math/roots.js';

/**
 * Roots: Newton's method and bisection on a cubic, with Newton's tangents drawn and both methods'
 * errors step by step.
 *
 * Shows that Newton's method does not find the nearest root: on x³ − x a start at 0.45, nearest the
 * root at 0, lands on −1, and on x³ − 2x + 2 a start at 0 cycles for ever. Bisection always closes in,
 * a binary digit a step; Newton, when it works, doubles the digits each step. Both are checked
 * against the cubic's roots in closed form (packages/subjects/src/math/roots.js).
 */
const SCENARIOS = [
  { id: 'good', name: 'x³ − 2x + 2 from −2', fn: 'cycle', x0: -2, a: -3, b: 0 },
  { id: 'cycle', name: 'The same cubic from 0: a cycle', fn: 'cycle', x0: 0, a: -3, b: 0 },
  { id: 'near', name: 'x³ − x from 0.3', fn: 'three', x0: 0.3, a: 0.5, b: 2 },
  { id: 'jump', name: 'x³ − x from 0.45: a jump', fn: 'three', x0: 0.45, a: 0.5, b: 2 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, fn: sc.fn, x0: sc.x0, a: sc.a, b: sc.b });
}

const KEYS = [['rt-x', 'x0'], ['rt-a', 'a'], ['rt-b', 'b']];

export default defineLab({
  id: 'roots',
  exam: 'u2',
  title: 'Roots',
  hint: 'Slide Newton’s start across x³ − x between 0.4 and 0.6 and watch which root it lands on. Then start x³ − 2x + 2 at 0.',
  gapLimit: 1e-12,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('good', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'x0', lo: -3, hi: 3 }),
  controls() {
    return `
      <label class="field"><span>Cubic</span><select id="rt-f">${Object.entries(CUBICS).map(([id, c]) => `<option value="${id}">${c.name}</option>`).join('')}</select></label>
      ${slider('rt-x', 'Newton’s start x₀', -2, -3, 3, 0.001)}
      ${slider('rt-a', 'Bisection bracket, left end a', -3, -3, 3, 0.05)}
      ${slider('rt-b', 'Bisection bracket, right end b', 0, -3, 3, 0.05)}
      <p class="tiny">Gold: f. Pink: Newton’s tangents, each from the curve down to the axis. Teal bars under the axis: the bisection brackets, halving. Bisection needs f(a) and f(b) of opposite sign.</p>`;
  },
  bind(api) {
    document.getElementById('rt-f')?.addEventListener('change', (e) => {
      api.slice().fn = e.target.value;
      api.bump();
    });
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    const el = document.getElementById('rt-f');
    if (el) el.value = state.fn;
    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    const r = findRoots(state);
    return { ...r, converged: r.newton.converged, faster: r.nwSteps != null && r.bsSteps != null && r.nwSteps < r.bsSteps };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const wide = W > 1.5 * (B.free.y1 - B.free.y0) && W > 560;
    const both = wide || B.free.y1 - B.free.y0 > 420;
    const [top, bottom] = both ? split(B.free, wide ? 0.55 : 0.58) : [B.free, null];
    const cub = CUBICS[state.fn];
    const Y = 6;
    const P = plotIn(B, top, { lo: -3, hi: 3 }, { lo: -Y, hi: Y });
    axes(P, { xLabel: 'x', yLabel: 'f(x)' });
    seg(P, [-3, 0], [3, 0], { color: alpha(C.text, 0.4), width: 1 });
    // The curve in pieces, cut where it leaves the plot rather than flattened against its edge.
    let piece = [];
    for (let i = 0; i <= 600; i++) {
      const x = -3 + (6 * i) / 600;
      const y = f(cub, x);
      if (Math.abs(y) <= Y) piece.push([x, y]);
      else if (piece.length) {
        line(P, piece, { color: C.gold, width: 2.5 });
        piece = [];
      }
    }
    if (piece.length) line(P, piece, { color: C.gold, width: 2.5 });
    for (const r of c.exact) dot(P, r, 0, { color: C.green, r: 4 });
    // Newton's first steps: down to the curve, then along the tangent to the axis.
    const xs = c.newton.xs;
    const inView = (x) => Math.abs(x) <= 3.2;
    for (let k = 0; k < Math.min(8, xs.length - 1); k++) {
      const [x, nx] = [xs[k], xs[k + 1]];
      if (!inView(x)) break;
      const y = Math.max(-Y, Math.min(Y, f(cub, x)));
      seg(P, [x, 0], [x, y], { color: alpha(C.pink, 0.5), width: 1, dash: [2, 2] });
      if (inView(nx)) seg(P, [x, y], [nx, 0], { color: C.pink, width: 1.8 });
    }
    dot(P, state.x0, 0, { color: C.yellow, r: 6, ring: C.text });
    label(P, 'x₀', [state.x0, 0], { color: C.yellow, dy: 14 });
    // Bisection brackets, stacked under the axis.
    c.bisect.brackets.slice(0, 8).forEach(([lo, hi], i) => {
      const yb = -0.8 - 0.55 * i;
      seg(P, [lo, yb], [hi, yb], { color: alpha(C.teal, 0.9 - 0.08 * i), width: 3 });
    });
    if (!c.bisect.valid) label(P, 'no sign change in [a, b]: bisection cannot start', [0, -Y], { color: C.red, dy: -12 });
    const msg = c.converged ? `Newton lands on ${fig(c.nwRoot)}${c.jumped ? `, not the nearest root ${fig(c.nearestToStart)}` : ''}` : 'Newton does not settle';
    label(P, msg, [3, Y], { color: c.converged ? (c.jumped ? C.red : C.green) : C.red, align: 'right', dy: 12 });
    if (!bottom) return;
    // Errors step by step, on a log scale.
    const Q = plotIn(B, bottom, { lo: 0, hi: 40 }, { lo: 1e-16, hi: 10, log: true });
    axes(Q, { xLabel: 'step', yLabel: 'error', yFmt: (v) => (Math.round(Math.log10(v)) % 4 === 0 ? v.toExponential(0) : '') });
    const pts = (errs) => errs.map((e, k) => [k, Math.max(1e-16, Math.min(10, e))]).filter(([k]) => k <= 40);
    line(Q, pts(c.bsErr), { color: C.teal, width: 2 });
    line(Q, pts(c.nwErr), { color: C.pink, width: 2 });
    label(Q, 'bisection', [Math.min(30, c.bsErr.length - 1), 1e-6], { color: C.teal, dy: -10 });
    label(Q, 'Newton', [6, 1e-14], { color: C.pink, dy: -8, align: 'left' });
  },
  law: () => [String.raw`x_{k+1} = x_k - \frac{f(x_k)}{f'(x_k)}`, String.raw`\text{bisection: } |e_{k}| \le \frac{b - a}{2^{k+1}}`],
  liveRows(state, c) {
    return [
      kv('Roots in closed form', c.exact.map((r) => fig(r)).join(', ')),
      kv('Newton’s first iterates', c.newton.xs.slice(0, 5).map((x) => fig(x)).join(', ')),
      kv('Newton', c.converged ? `${fig(c.nwRoot)} in ${c.nwSteps} steps` : 'does not settle'),
      kv('Bisection', c.bisect.valid ? `${fig(c.bsRoot)} in ${c.bsSteps} steps` : 'no sign change'),
      kv('Against the closed form', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['Newton', c.converged ? fig(c.nwRoot) : 'no root'],
      ['its steps', c.converged ? `${c.nwSteps}` : '–'],
      ['bisection', c.bisect.valid ? fig(c.bsRoot) : '–'],
      ['its steps', c.bisect.valid ? `${c.bsSteps}` : '–'],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Library solvers combine the two: they keep a bracket and take Newton or secant steps only while those stay inside it, so they are fast and sure.`;
    if (!c.converged) {
      return { title: 'Newton is not sure', body: `From x₀ = ${fig(state.x0)} the tangents bounce: ${c.newton.xs.slice(0, 5).map((x) => fig(x)).join(' → ')}. Newton needs a start near a root; bisection, given a sign change, always closes in. ${leavesOut}` };
    }
    if (c.jumped) {
      return { title: 'Not the nearest root', body: `x₀ = ${fig(state.x0)} is closest to ${fig(c.nearestToStart)}, but f′ is small there, so the first tangent shoots far away and Newton settles on ${fig(c.nwRoot)}. ${leavesOut}` };
    }
    return { title: 'Fast once close', body: `Newton reaches ${fig(c.nwRoot)} to ten digits in ${c.nwSteps} steps, the digits roughly doubling each time. Bisection takes ${c.bsSteps ?? '–'}, one binary digit a step. ${leavesOut}` };
  },
  app: false,
});
