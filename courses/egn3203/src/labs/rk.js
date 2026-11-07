import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { EQUATIONS, compare } from '@flux/subjects/math/rungekutta.js';

/**
 * RK4: one equation solved by Euler, the midpoint method and classical RK4, each given the same
 * number of slope evaluations.
 *
 * Shows that many cheap steps do not beat a few good ones: with 64 evaluations, Euler's 64 steps miss
 * by 4 × 10⁻³ while RK4's 16 steps miss by 10⁻⁶. Doubling the budget halves Euler's error and cuts
 * RK4's sixteenfold. Errors are against each equation's exact solution, itself checked against a
 * very fine RK4 run (packages/subjects/src/math/rungekutta.js).
 */
const T = 4;
const SCENARIOS = [
  { id: 'budget', name: '64 evaluations on the forced decay', eq: 'forced', lN: 6 },
  { id: 'tight', name: 'Only 16 evaluations', eq: 'forced', lN: 4 },
  { id: 'rich', name: '256 evaluations', eq: 'forced', lN: 8 },
  { id: 'growth', name: '256 evaluations on y′ = y cos t', eq: 'growth', lN: 8 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, eq: sc.eq, lN: sc.lN });
}

const NAMES = { euler: 'Euler', midpoint: 'midpoint', rk4: 'RK4' };
const COLORS = { euler: C.gold, midpoint: C.blue, rk4: C.pink };
const sci = (x) => x.toExponential(1);

/** The exact solution and each method's steps. */
function solution(B, rect, state, c) {
  const eq = EQUATIONS[state.eq];
  const exact = Array.from({ length: 201 }, (_, i) => [(T * i) / 200, eq.exact((T * i) / 200)]);
  const ys = exact.map((p) => p[1]).concat(...['euler', 'midpoint', 'rk4'].map((m) => c[m].pts.map((p) => p[1])));
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  const pad = 0.12 * (hi - lo || 1);
  const P = plotIn(B, rect, { lo: 0, hi: T }, { lo: lo - pad, hi: hi + pad });
  axes(P, { xLabel: 't', yLabel: 'y' });
  line(P, exact, { color: alpha(C.text, 0.6), width: 2 });
  for (const m of ['euler', 'midpoint', 'rk4']) {
    line(P, c[m].pts, { color: alpha(COLORS[m], 0.85), width: 1.5 });
    if (c[m].n <= 64) for (const [t, y] of c[m].pts) dot(P, t, y, { color: COLORS[m], r: m === 'rk4' ? 4 : 2.5 });
  }
  // Above the plot, in its top margin, clear of the curves.
  label(P, `${2 ** state.lN} slope evaluations each`, [T, hi + pad], { color: C.muted, align: 'right', dy: -12 });
}

/** Error at t = 4 against the budget, log–log, with the budget marked. */
function errors(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 4, hi: 1024, log: true }, { lo: 1e-14, hi: 1, log: true });
  axes(P, { xLabel: 'slope evaluations', yLabel: 'error at t = 4', yFmt: (v) => (Math.round(Math.log10(v)) % 2 === 0 ? v.toExponential(0) : ''), xFmt: (v) => String(Math.round(v)) });
  seg(P, [2 ** state.lN, 1e-14], [2 ** state.lN, 1], { color: alpha(C.muted, 0.6), width: 1, dash: [3, 3] });
  for (const m of ['euler', 'midpoint', 'rk4']) {
    line(P, c.curves[m], { color: COLORS[m], width: 2 });
    dot(P, 2 ** state.lN, Math.max(c[m].error, 1e-14), { color: COLORS[m], r: 5, ring: C.text });
    const last = c.curves[m][c.curves[m].length - 1];
    label(P, NAMES[m], last, { color: COLORS[m], align: 'right', dx: -4, dy: -10 });
  }
}

export default defineLab({
  id: 'rk',
  exam: 'u2',
  title: 'Runge–Kutta',
  hint: 'Give all three methods the same budget. Euler takes the most steps, RK4 the fewest, yet RK4 lands closest. Double the budget and watch the slopes: 1, 2 and 4.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('budget', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'lN', lo: 2, hi: 10 }),
  controls() {
    return `
      <label class="field"><span>Equation</span><select id="rk-eq">${Object.entries(EQUATIONS).map(([id, e]) => `<option value="${id}">${e.name}</option>`).join('')}</select></label>
      ${slider('rk-n', 'Slope evaluations, log₂ N', 6, 2, 10, 1)}
      <p class="tiny">From t = 0 to 4. Each method gets the same N evaluations of the slope f(t, y): Euler takes N steps of one evaluation, the midpoint method N/2 of two, RK4 N/4 of four. Grey: the exact solution. Gold: Euler. Blue: midpoint. Pink: RK4.</p>`;
  },
  bind(api) {
    document.getElementById('rk-eq')?.addEventListener('change', (e) => {
      api.slice().eq = e.target.value;
      api.bump();
    });
    bindSlider('rk-n', (s, v) => { s.lN = Math.round(v); }, api);
  },
  syncControls(state) {
    const el = document.getElementById('rk-eq');
    if (el) el.value = state.eq;
    const e = document.getElementById('rk-n');
    if (e && document.activeElement !== e) e.value = String(state.lN);
  },
  compute(state) {
    const r = compare({ eq: state.eq, evals: 2 ** Math.round(state.lN), T });
    return { ...r, eulerErr: r.euler.error, midErr: r.midpoint.error, rk4Err: r.rk4.error };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      solution(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.52 * W } : { ...B.free, y1: B.free.y0 + 0.5 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    solution(B, a, state, c);
    errors(B, b, state, c);
  },
  law: () => [String.raw`\text{Euler: } y_{n+1} = y_n + h f(t_n, y_n), \quad e \propto h`, String.raw`\text{RK4: } y_{n+1} = y_n + \tfrac{h}{6}(k_1 + 2k_2 + 2k_3 + k_4)`, String.raw`e_\text{RK4} \propto h^4`],
  liveRows(state, c) {
    return [
      kv('Steps: Euler, midpoint, RK4', `${c.euler.n}, ${c.midpoint.n}, ${c.rk4.n}`),
      kv('Step size: Euler, RK4', `${fig(c.euler.h)}, ${fig(c.rk4.h)}`),
      kv('Error at t = 4: Euler', sci(c.euler.error)),
      kv('Midpoint', sci(c.midpoint.error)),
      kv('RK4', sci(c.rk4.error)),
      kv('Exact y(4)', fig(c.exactT)),
      kv('Exact against 20 000 RK4 steps', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['budget', String(2 ** state.lN)],
      ['Euler error', sci(c.euler.error)],
      ['RK4 error', sci(c.rk4.error)],
      ['RK4 vs Euler', c.ratio >= 1 ? `${fig(c.ratio)}× better` : `${fig(1 / c.ratio)}× worse`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Adaptive solvers, such as MATLAB’s ode45, which pair two Runge–Kutta methods to estimate the error and change h as they go; and stiff equations, where explicit methods need tiny steps to stay stable at all.`;
    if (c.ratio < 1) {
      return { title: 'Too few steps to tell', body: `With only ${2 ** state.lN} evaluations RK4 gets ${c.rk4.n} steps of length ${fig(c.rk4.h)}, too long to follow the curve, and here Euler happens to land closer. Raise the budget a little and RK4 pulls far ahead. ${leavesOut}` };
    }
    return { title: 'A few good steps beat many cheap ones', body: `Each method made ${2 ** state.lN} slope evaluations. Euler spent them on ${c.euler.n} steps and misses by ${sci(c.euler.error)}; RK4 took only ${c.rk4.n} steps, four times longer, and misses by ${sci(c.rk4.error)}, ${fig(c.ratio)} times less. Its error falls as h⁴, so halving the step cuts it sixteenfold; Euler’s only halves. ${leavesOut}` };
  },
  app: false,
});
