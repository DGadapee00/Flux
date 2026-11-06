import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { backSubstitute, cramer, eliminate } from '@flux/subjects/math/linalg.js';

/**
 * Elimination: a linear system reduced one row operation at a time, then solved by back substitution.
 *
 * Shows that row operations change the equations but never their solution, and that the order of
 * operations matters in floating point: a tiny pivot, left in place, wipes out the information in
 * the other row. Back substitution on each step's triangle is checked against Cramer's rule on the
 * same numbers (packages/subjects/src/math/linalg.js); the error against the true solution is the
 * lesson, not the check.
 */
const SYSTEMS = {
  three: { A: [[2, 1, -1], [-3, -1, 2], [-2, 1, 2]], b: [8, -11, -3], x: [2, 3, -1] },
  swap: { A: [[0, 2, 1], [1, 1, 1], [2, 1, 0]], b: [5, 6, 4], x: [1, 2, 1] },
  lines: { A: [[1, 2], [3, -1]], b: [5, 1], x: [1, 2] },
  tiny: { A: [[1e-17, 1], [1, 1]], b: [1, 2], x: [1, 1] },
};

const SCENARIOS = [
  { id: 'three', name: 'Three equations, three unknowns', system: 'three', pivot: true, step: 0 },
  { id: 'swap', name: 'A zero in the pivot spot', system: 'swap', pivot: true, step: 0 },
  { id: 'lines', name: 'Two lines meeting', system: 'lines', pivot: false, step: 0 },
  { id: 'tiny', name: 'A tiny pivot, no swap', system: 'tiny', pivot: false, step: 1 },
  { id: 'tiny-pivot', name: 'The same, with pivoting', system: 'tiny', pivot: true, step: 2 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, system: sc.system, pivot: sc.pivot, step: sc.step });
}

const show = (v) => {
  if (v === 0) return '0';
  const a = Math.abs(v);
  if (a >= 1e5 || a < 1e-3) return v.toExponential(1);
  return String(Number(v.toFixed(3)));
};

export default defineLab({
  id: 'elimination',
  exam: 'u1',
  title: 'Elimination',
  hint: 'Step through the row operations: the equations change, the solution does not. Then try a tiny pivot with and without swapping rows.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('three', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'step', lo: 0, hi: 6 }),
  controls() {
    return `
      <label class="field"><span>System</span><select id="el-sys"><option value="three">3 × 3</option><option value="swap">3 × 3, zero pivot</option><option value="lines">2 × 2: two lines</option><option value="tiny">2 × 2, pivot 10⁻¹⁷</option></select></label>
      <label class="field"><span>Pivoting</span><select id="el-piv"><option value="on">Swap in the largest entry</option><option value="off">Keep rows in order</option></select></label>
      ${slider('el-k', 'row operations done', 0, 0, 6, 1)}
      <p class="tiny">Each step is one row operation. Back substitution runs once the system is triangular.</p>`;
  },
  bind(api) {
    document.getElementById('el-sys')?.addEventListener('change', (e) => {
      api.slice().system = e.target.value;
      api.bump();
    });
    document.getElementById('el-piv')?.addEventListener('change', (e) => {
      api.slice().pivot = e.target.value === 'on';
      api.bump();
    });
    bindSlider('el-k', (s, v) => { s.step = v; }, api);
  },
  syncControls(state) {
    const sys = document.getElementById('el-sys');
    if (sys) sys.value = state.system;
    const piv = document.getElementById('el-piv');
    if (piv) piv.value = state.pivot ? 'on' : 'off';
    const el = document.getElementById('el-k');
    if (el && document.activeElement !== el) el.value = String(state.step);
  },
  compute(state) {
    const sys = SYSTEMS[state.system] || SYSTEMS.three;
    // A zero pivot cannot be eliminated without a swap: force pivoting there.
    const pivot = state.pivot || state.system === 'swap';
    const steps = eliminate(sys.A, sys.b, { pivot });
    const k = Math.max(0, Math.min(steps.length - 1, Math.round(state.step)));
    const cur = steps[k];
    const last = steps.at(-1);
    const n = sys.b.length;
    const x = backSubstitute(last.M);
    const xc = cramer(last.M.map((r) => r.slice(0, n)), last.M.map((r) => r[n]));
    const gap = Math.max(...x.map((v, i) => Math.abs(v - xc[i]) / Math.max(1, Math.abs(xc[i]))));
    const err = Math.max(...x.map((v, i) => Math.abs(v - sys.x[i])));
    const residual = Math.max(...sys.A.map((row, i) => Math.abs(row.reduce((s, a, j) => s + a * x[j], 0) - sys.b[i])));
    return { steps, k, cur, n, x, truth: sys.x, err, residual, done: k === steps.length - 1, pivotForced: pivot && !state.pivot, gap };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const [top, bottom] = c.n === 2 ? split(B.free, 0.45) : [B.free, null];
    const T = plotIn(B, top, { lo: 0, hi: c.n + 2 }, { lo: 0, hi: c.n + 1.5 }, { left: 14, right: 14, top: 18, bottom: 12 });
    const M = c.cur.M;
    for (let i = 0; i < c.n; i++) {
      for (let j = 0; j <= c.n; j++) {
        const x = j + 0.6 + (j === c.n ? 0.5 : 0);
        const y = c.n - i + 0.4;
        const lead = j === i && Math.abs(M[i][j]) > 0;
        if (lead) poly(T, [[x - 0.32, y - 0.2], [x + 0.32, y - 0.2], [x + 0.32, y + 0.2], [x - 0.32, y + 0.2]], { fill: alpha(C.gold, 0.18), stroke: null });
        label(T, show(M[i][j]), [x, y], { color: j === c.n ? C.teal : Math.abs(M[i][j]) < 1e-15 && j < i ? C.dim : C.text, bold: lead });
      }
    }
    label(T, `step ${c.k} of ${c.steps.length - 1}: ${c.cur.text}`, [(c.n + 2) / 2, c.n + 1.2], { color: C.yellow });
    if (c.n === 2 && bottom) {
      const P = plotIn(B, bottom, { lo: -1, hi: 3 }, { lo: -1, hi: 4 });
      axes(P, { xLabel: 'x₁', yLabel: 'x₂' });
      const colors = [C.pink, C.blue];
      M.forEach((row, i) => {
        const [a, b, r] = row;
        // a x1 + b x2 = r, drawn over x1 in [−1, 3] (or as a vertical line when b is 0).
        const pts = Math.abs(b) > 1e-12
          ? [[-1, (r + a) / b], [3, (r - 3 * a) / b]]
          : [[r / a, -1], [r / a, 4]];
        line(P, pts, { color: colors[i], width: 2.5 });
      });
      dot(P, c.truth[0], c.truth[1], { color: C.yellow, r: 5 });
    }
  },
  law: () => [String.raw`A\mathbf x = \mathbf b \;\longrightarrow\; U\mathbf x = \mathbf c`, String.raw`x_i = \frac{1}{u_{ii}}\Big(c_i - \sum_{j>i} u_{ij}x_j\Big)`],
  liveRows(state, c) {
    return [
      kv('solution found', `(${c.x.map((v) => fig(v)).join(', ')})`),
      kv('true solution', `(${c.truth.join(', ')})`),
      kv('largest error', show(c.err)),
      kv('residual |Ax − b|', show(c.residual)),
      kv('back substitution against Cramer', show(c.gap)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['step', `${c.k} of ${c.steps.length - 1}`],
      ['x₁ found', fig(c.x[0])],
      ['error', show(c.err)],
      ['pivoting', state.pivot || c.pivotForced ? 'on' : 'off'],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Small systems by hand. Real solvers factor A = LU once with pivoting and reuse it for every right-hand side; the work grows as about two thirds of n³.`;
    let title = 'The equations change, the solution does not';
    let body = String.raw`Each row operation subtracts a multiple of one equation from another, which any solution of the old system still satisfies, and which can be undone. So every step has the same solution. The goal is a triangle, solved from the bottom up.`;
    if (state.system === 'tiny' && !state.pivot) {
      title = 'A tiny pivot destroys the answer';
      body = String.raw`Dividing by 10⁻¹⁷ makes the multiplier 10¹⁷. Subtracting 10¹⁷ times row 1 from row 2 swamps row 2's own numbers, which are lost in rounding. Back substitution then gives x₁ = ${fig(c.x[0])} instead of 1.`;
    } else if (state.system === 'tiny') {
      title = 'Swap first, and the answer survives';
      body = String.raw`Swapping the rows puts 1 in the pivot spot, so the multiplier is 10⁻¹⁷ and nothing is swamped. The solution comes out right: x₁ = ${fig(c.x[0])}.`;
    } else if (c.pivotForced) {
      title = 'A zero pivot needs a swap';
      body = String.raw`The first entry is 0, so nothing can be eliminated with it. Swapping in a row with a nonzero leading entry changes nothing about the solution and lets elimination go on.`;
    } else if (c.n === 2) {
      title = 'Two lines, one meeting point';
      body = String.raw`Each equation is a line. Eliminating x₁ from the second turns it horizontal, but it still passes through the same point: the lines keep meeting at the solution.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
