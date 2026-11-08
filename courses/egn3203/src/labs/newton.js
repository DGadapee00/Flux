import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { F, ROOTS, newtonChecked } from '@flux/subjects/math/newton2.js';

/**
* Newton in 2D: where the circle x² + y² = 4 crosses y = 1 − eˣ, found by Newton's method from a
 * starting point you drag, beside the same problem solved one equation at a time.
 *
 * Shows that a system cannot be solved one equation at a time: fixing y from one equation and then x
 * from the other makes each step undo part of the last, and the error falls slowly, if at all.
 * Newton moves both unknowns together along the tangent planes and doubles its correct digits each
 * step: from (−1, 1) it is within 10⁻⁹ in four steps. The roots are checked by substituting one
 * equation into the other and bisecting (packages/subjects/src/math/newton2.js).
 */
const SCENARIOS = [
  { id: 'left', name: 'Start at (−1, 1)', x0: -1, y0: 1 },
  { id: 'right', name: 'Start at (2, −2)', x0: 2, y0: -2 },
  { id: 'far', name: 'Start at (1, 1)', x0: 1, y0: 1 },
  { id: 'corner', name: 'Start at (−2, 2)', x0: -2, y0: 2 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, x0: sc.x0, y0: sc.y0 });
}

const KEYS = [['nw-x', 'x0'], ['nw-y', 'y0']];

function square(r) {
  const s = Math.min(r.x1 - r.x0, r.y1 - r.y0);
  const cx = (r.x0 + r.x1) / 2;
  const cy = (r.y0 + r.y1) / 2;
  return { ...r, x0: cx - s / 2, x1: cx + s / 2, y0: cy - s / 2, y1: cy + s / 2 };
}

function plane(B, rect, state, c) {
  const P = plotIn(B, square(rect), { lo: -3, hi: 3 }, { lo: -3, hi: 3 });
  axes(P, { xLabel: 'x', yLabel: 'y' });
  line(P, Array.from({ length: 181 }, (_, i) => [2 * Math.cos((i * Math.PI) / 90), 2 * Math.sin((i * Math.PI) / 90)]), { color: C.muted, width: 1.8 });
  line(P, Array.from({ length: 121 }, (_, i) => [-3 + (4.4 * i) / 120, 1 - Math.exp(-3 + (4.4 * i) / 120)]).filter((p) => p[1] > -3), { color: C.muted, width: 1.8, dash: [6, 3] });
  const clip = (p) => [Math.max(-3, Math.min(3, p[0])), Math.max(-3, Math.min(3, p[1]))];
  line(P, c.alt.map(clip), { color: alpha(C.blue, 0.85), width: 1.6, dash: [4, 3] });
  line(P, c.path.map(clip), { color: C.gold, width: 2.2 });
  c.path.slice(0, 8).forEach((p) => dot(P, ...clip(p), { color: C.gold, r: 3.5 }));
  dot(P, state.x0, state.y0, { color: C.pink, r: 6, ring: C.text });
  for (const r of ROOTS) dot(P, r[0], r[1], { color: C.green, r: 5, ring: C.text });
}

function conv(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 0, hi: 12 }, { lo: 1e-16, hi: 100, log: true });
  axes(P, { xLabel: 'step', yLabel: 'distance to the root', yFmt: (v) => {
    const e = Math.round(Math.log10(v));
    return Math.abs(v / 10 ** e - 1) < 1e-6 && e % 4 === 0 ? `1e${e}` : '';
  } });
  const cl = (e) => Math.max(1e-16, Math.min(100, e));
  line(P, c.errs.slice(0, 13).map((e, k) => [k, cl(e)]), { color: C.gold, width: 2.5 });
  c.errs.slice(0, 13).forEach((e, k) => dot(P, k, cl(e), { color: C.gold, r: 3.5 }));
  const alt = c.altErrs.filter((_, k) => k % 2 === 0 || k === c.altErrs.length - 1).slice(0, 13);
  line(P, alt.map((e, k) => [k, cl(e)]), { color: C.blue, width: 2, dash: [4, 3] });
  label(P, 'Newton', [1, cl(c.errs[1] ?? 1)], { color: C.gold, align: 'left', dx: 8 });
  label(P, 'one at a time', [Math.min(12, alt.length - 1), cl(alt[alt.length - 1])], { color: C.blue, align: 'right', dy: -10 });
}

export default defineLab({
  id: 'newton',
  exam: 'u2',
  title: 'Newton in 2D',
  hint: 'Start at (−1, 1) and count Newton’s steps to ten digits. Then watch the one-at-a-time path crawl.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('left', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'x0', lo: -3, hi: -0.5 }),
  controls() {
    return `
      ${slider('nw-x', "Start x₀", -1, -3, 3, 0.05)}
      ${slider('nw-y', "Start y₀", 1, -3, 3, 0.05)}
      <p class="tiny">F(x, y) = (x² + y² − 4, eˣ + y − 1). Left: the two curves, Newton’s steps (gold) and the one-at-a-time steps (blue, dashed): y from the second equation, then x from the first. Right: distance to the nearest root against the step, on a log scale.</p>`;
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
    return newtonChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      plane(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    plane(B, a, state, c);
    conv(B, b, state, c);
  },
  law: () => [String.raw`J(\mathbf x_k)\,\Delta\mathbf x = -\mathbf F(\mathbf x_k), \qquad \mathbf x_{k+1} = \mathbf x_k + \Delta\mathbf x`, String.raw`J = \begin{bmatrix} 2x & 2y \\ e^x & 1 \end{bmatrix}`],
  liveRows(state, c) {
    return [
      kv('Root reached', `(${fig(c.root[0])}, ${fig(c.root[1])})`),
      kv('Newton steps to 10⁻⁹', c.steps >= 0 ? String(c.steps) : 'not within 40'),
      kv('Errors, first steps', c.errs.slice(1, 5).map((e) => e.toExponential(0)).join(', ')),
      kv('One at a time after 8 half-steps', (c.altErrs[8] ?? c.altErrs[c.altErrs.length - 1]).toExponential(0)),
      kv('Newton against substitution and bisection', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['root x', fig(c.root[0])], ['root y', fig(c.root[1])], ['steps', c.steps >= 0 ? String(c.steps) : '—'], ['start', `(${fig(state.x0)}, ${fig(state.y0)})`]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Far from a root Newton’s step can overshoot or land where J is singular; practical solvers limit the step (a line search or trust region) and may update J cheaply instead of recomputing it.`;
    if (c.steps < 0) return { title: 'No root from here', body: `From (${fig(state.x0)}, ${fig(state.y0)}) the tangent planes send Newton far away before it settles. Start nearer a crossing. ${leavesOut}` };
    return { title: 'Both unknowns move together', body: `Newton replaces both curves by their tangent planes and solves for the step in x and y at once: it reaches (${fig(c.root[0])}, ${fig(c.root[1])}) to 10⁻⁹ in ${c.steps} steps, the error roughly squaring each step near the end. Fixing one unknown from one equation, then the other from the other, undoes part of each move and gains only a fixed fraction per step. ${leavesOut}` };
  },
  app: false,
});
