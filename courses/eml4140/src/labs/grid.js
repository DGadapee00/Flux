import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { ROD, explicitRun } from '@flux/subjects/heat/explicit.js';

/**
* Grid: a 10 cm copper rod with its ends at 0, cooling from a half sine, stepped by the explicit
 * finite-difference scheme, with sliders for the number of cells and the time step.
 *
 * Shows that a finer grid at the same time step is not always more accurate: with Δt = 30 ms, 20 cells
 * give Fo = 0.13 and a good answer, but 40 cells give Fo = 0.53, past the limit of 1/2, and the
 * finest grid mode flips sign and grows every step until the solution blows up. The scheme's result
 * is checked exactly against each grid mode's amplification factor
 * (packages/subjects/src/heat/explicit.js).
 */
const SCENARIOS = [
  {
    'id': 'fine',
    'name': '20 cells, Δt = 30 ms',
    'N': 20,
    'dtms': 30
  },
  {
    'id': 'refined',
    'name': '40 cells, same Δt: unstable',
    'N': 40,
    'dtms': 30
  },
  {
    'id': 'smallstep',
    'name': '40 cells, Δt = 10 ms',
    'N': 40,
    'dtms': 10
  },
  {
    'id': 'coarse',
    'name': '10 cells, Δt = 100 ms',
    'N': 10,
    'dtms': 100
  }
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, N: sc.N, dtms: sc.dtms });
}

const KEYS = [['gd-n', 'N'], ['gd-dt', 'dtms']];

function rod(B, rect, state, c) {
  const top = Math.min(Math.max(c.peak, 0.12) * 1.2, 2);
  const P = plotIn(B, rect, { lo: 0, hi: 100 }, { lo: -top, hi: top });
  axes(P, { xLabel: 'position along the rod (mm)', yLabel: 'temperature (share of the start)' });
  seg(P, [0, 0], [100, 0], { color: alpha(C.text, 0.3), width: 1 });
  line(P, c.xs.map((x, i) => [x * 100, c.exact[i]]), { color: alpha(C.muted, 0.9), width: 2, dash: [5, 4] });
  const pts = c.xs.map((x, i) => [x * 100, Math.max(-top, Math.min(top, c.T[i]))]);
  line(P, pts, { color: c.stable ? C.gold : C.red, width: 2.5 });
  for (const p of pts) dot(P, p[0], p[1], { color: c.stable ? C.gold : C.red, r: 3 });
  label(P, c.blewUp ? `blew up after ${c.done} steps (${fig(c.tDone)} s)` : `after ${fig(c.tDone)} s`, [100, top], { color: c.stable ? C.muted : C.red, align: 'right', dy: 10 });
}

function modes(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 0, hi: 1 }, { lo: -1.6, hi: 1.1 });
  axes(P, { xLabel: 'grid mode, from smoothest (0) to finest (1)', yLabel: 'growth per step, G' });
  seg(P, [0, -1], [1, -1], { color: alpha(C.red, 0.7), width: 1.5, dash: [5, 4] });
  label(P, 'G = −1: beyond this, it grows', [1, -1], { color: C.red, align: 'right', dy: 12 });
  seg(P, [0, 0], [1, 0], { color: alpha(C.text, 0.3), width: 1 });
  const pts = Array.from({ length: 101 }, (_, i) => [i / 100, 1 - 4 * c.Fo * Math.sin((Math.PI * i) / 200) ** 2]);
  line(P, pts.map(([x, y]) => [x, Math.max(-1.6, y)]), { color: c.stable ? C.teal : C.red, width: 2.5 });
  label(P, `Fo = ${fig(c.Fo)}`, [0, 1.1], { color: c.stable ? C.teal : C.red, align: 'left', dx: 4, dy: 10 });
}

export default defineLab({
  id: 'grid',
  exam: 'u1',
  title: 'Grid',
  hint: 'Keep Δt at 30 ms and double the cells from 20 to 40: the answer does not improve, it explodes.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('fine', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'dtms', lo: 1, hi: 100 }),
  controls() {
    return `
      ${slider('gd-n', "Cells", 20, 5, 60, 1)}
      ${slider('gd-dt', "Time step Δt (ms)", 30, 1, 100, 1)}
      <p class="tiny">Copper, α = 1.1 × 10⁻⁴ m²/s, rod 10 cm long, ends held at 0, run for 20 s. The start is a half sine plus a millionth of the finest grid mode, as round-off would add. Grey: the exact solution.</p>`;
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
    return explicitRun(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      rod(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    rod(B, a, state, c);
    modes(B, b, state, c);
  },
  law: () => [String.raw`T_i^{n+1} = T_i^n + \mathrm{Fo}\,(T_{i-1}^n - 2T_i^n + T_{i+1}^n), \quad \mathrm{Fo} = \frac{\alpha\,\Delta t}{\Delta x^2}`, String.raw`G_k = 1 - 4\,\mathrm{Fo}\sin^2\frac{k\pi}{2N}, \qquad \text{stable} \iff \mathrm{Fo} \le \tfrac12`],
  liveRows(state, c) {
    return [
      kv('Δx and Fo', `${fig(100 / state.N)} mm, ${fig(c.Fo)}`),
      kv('Growth of the finest mode per step', fig(c.Gfine)),
      kv('Steps run', `${c.done} of ${c.steps}`),
      kv('Error against the exact solution', c.err.toExponential(1)),
      kv('Run against the mode formula', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['Fo', fig(c.Fo)], ['stable', c.stable ? 'yes' : 'no'], ['finest mode G', fig(c.Gfine)], ['error', c.err.toExponential(1)]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Implicit schemes, such as backward Euler and Crank–Nicolson, which are stable at any time step and pay for it by solving a system each step.`;
    if (!c.stable) return { title: 'Past Fo = ½ it blows up', body: `With ${state.N} cells and Δt = ${state.dtms} ms, Fo = ${fig(c.Fo)}. The finest grid mode is multiplied by ${fig(c.Gfine)} every step: it flips sign and grows, from a millionth to a million in ${c.done} steps. Refining the grid raised Fo; the time step must shrink with Δx². ${leavesOut}` };
    return { title: 'Stable: every mode decays', body: `Fo = ${fig(c.Fo)} is below ½, so every grid mode shrinks each step, the finest by a factor ${fig(c.Gfine)}. The answer misses the exact solution by ${c.err.toExponential(1)}. ${leavesOut}` };
  },
  app: false,
});
