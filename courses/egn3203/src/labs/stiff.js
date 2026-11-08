import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { LAMBDA, factor, stiffChecked } from '@flux/subjects/math/stiff.js';

/**
* Stiff: a two-mode system with rates 1 and 1000 per second, integrated by explicit or implicit
 * Euler, with a slider for the step.
 *
 * Shows that the step must keep every mode stable, not only resolve the motion you can see: the fast
 * mode dies out within 10 ms, yet explicit Euler with any step over 0.002 s makes it grow tenfold
 * every few steps and the answer explodes. Implicit Euler is stable at every step. The per-mode
 * closed form is checked by marching the coupled system (packages/subjects/src/math/stiff.js).
 */
const SCENARIOS = [
  { id: 'small', name: 'Explicit, h = 0.001 s', method: 'explicit', lh: -3 },
  { id: 'edge', name: 'Explicit, h = 0.0019 s', method: 'explicit', lh: -2.7212 },
  { id: 'over', name: 'Explicit, h = 0.0021 s', method: 'explicit', lh: -2.6778 },
  { id: 'implicit', name: 'Implicit, h = 0.01 s', method: 'implicit', lh: -2 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, method: sc.method, lh: sc.lh });
}

const KEYS = [['sf-h', 'lh']];

function traj(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 0, hi: 0.5 }, { lo: -0.5, hi: 1.2 });
  axes(P, { xLabel: 'time (s)', yLabel: 'y₁' });
  line(P, Array.from({ length: 201 }, (_, i) => [(0.5 * i) / 200, c.exact((0.5 * i) / 200)[0]]), { color: alpha(C.muted, 0.9), width: 1.5, dash: [6, 4] });
  const every = Math.max(1, Math.floor(c.n / 400));
  let run = [];
  const flush = () => {
    if (run.length > 1) line(P, run, { color: C.gold, width: 2.2 });
    run = [];
  };
  for (let k = 0; k <= c.n; k += every) {
    const y = c.at(k)[0];
    if (y > -0.5 && y < 1.2) run.push([k * c.h, y]);
    else flush();
  }
  flush();
  if (!c.stable) label(P, 'blows up', [0.5, 1.2], { color: C.red, align: 'right', dy: 12 });
}

function gains(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 1e-4, hi: 0.05, log: true }, { lo: 1e-3, hi: 100, log: true });
  axes(P, { xLabel: 'step h (s)', yLabel: 'growth per step |g|' });
  seg(P, [1e-4, 1], [0.05, 1], { color: alpha(C.red, 0.8), width: 1.5, dash: [5, 4] });
  const hs = Array.from({ length: 161 }, (_, i) => 1e-4 * 500 ** (i / 160));
  LAMBDA.forEach((l, j) => {
    const pts = hs.map((h) => [h, Math.max(1e-3, Math.min(100, Math.abs(factor(state.method, h, l))))]);
    line(P, pts, { color: j ? C.blue : C.green, width: 2.2 });
    label(P, j ? 'fast mode, −1000' : 'slow mode, −1', pts[j ? 120 : 20], { color: j ? C.blue : C.green, align: 'left', dx: 6, dy: j ? -10 : 14 });
    dot(P, c.h, Math.max(1e-3, Math.min(100, Math.abs(c.g[j]))), { color: C.pink, r: 5, ring: C.text });
  });
}

export default defineLab({
  id: 'stiff',
  exam: 'u2',
  title: 'Stiff',
  hint: 'Raise the explicit step past 0.002 s and watch the answer explode, though the fast mode had long died. Then switch to implicit.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('small', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'lh', lo: -4, hi: -1.3 }),
  controls() {
    return `
      <label class="field"><span>Method</span><select id="sf-m">${[['explicit', 'Explicit Euler'], ['implicit', 'Implicit Euler']].map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></label>
      ${slider('sf-h', "Step, log₁₀(h / 1 s)", -3, -4, -1.3, 0.005)}
      <p class="tiny">y′ = Ay with eigenvalues −1 and −1000, starting from y = (1, 0), run to 0.5 s. Left: the first component against time, exact (dashed) and stepped, clipped to the frame. Right: how much each step multiplies each mode, |g|, against h; above 1 the mode grows.</p>`;
  },
  bind(api) {
    document.getElementById('sf-m')?.addEventListener('change', (e) => {
      api.slice().method = e.target.value;
      api.bump();
    });
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    {
      const el = document.getElementById('sf-m');
      if (el) el.value = String(state.method);
    }
    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    return stiffChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      traj(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    traj(B, a, state, c);
    gains(B, b, state, c);
  },
  law: () => [String.raw`y_{n+1} = (1 + h\lambda)\,y_n \ \text{(explicit)}`, String.raw`y_{n+1} = \frac{y_n}{1 - h\lambda} \ \text{(implicit)}`, String.raw`|1 + h\lambda| \le 1 \iff h \le \frac{2}{|\lambda|}`],
  liveRows(state, c) {
    return [
      kv('Step', `${fig(c.h * 1000)} ms`),
      kv('Growth per step, slow and fast', `${fig(c.g[0])}, ${fig(c.g[1])}`),
      kv('Explicit limit 2/1000', `${fig(c.hLimit * 1000)} ms`),
      kv('Size at 0.5 s', c.size.toExponential(2)),
      kv('Error against exact', c.err.toExponential(1)),
      kv('Per-mode form against the march', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['step', `${fig(c.h * 1000)} ms`], ['fast mode g', fig(c.g[1])], ['stable', c.stable ? 'yes' : 'no'], ['error', c.err.toExponential(0)]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Implicit methods must solve a system every step, linear here and nonlinear in general, by Newton’s method; stiff solvers also change their step and order as they go.`;
    if (!c.stable) return { title: 'An invisible mode blows up', body: `Each explicit step multiplies the fast mode by 1 + hλ = ${fig(c.g[1])}. Its size is beyond 1, so the mode, which in truth vanished within milliseconds, grows every step: by 0.5 s the answer is ${c.size.toExponential(1)}. The step must be under ${fig(c.hLimit * 1000)} ms however slow the visible motion. ${leavesOut}` };
    if (state.method === 'implicit') return { title: 'Implicit Euler: stable at any step', body: `Each step divides each mode by 1 − hλ, which is above 1 for every negative λ: the fast mode is damped by ${fig(1 / Math.abs(c.g[1]))} per step. The step is chosen for accuracy alone; the error at 0.5 s is ${c.err.toExponential(1)}. ${leavesOut}` };
    return { title: 'Stable, but only just', body: `At ${fig(c.h * 1000)} ms the fast mode’s factor is ${fig(c.g[1])}, inside ±1, so it dies out. Past 2 ms it would not. ${leavesOut}` };
  },
  app: false,
});
