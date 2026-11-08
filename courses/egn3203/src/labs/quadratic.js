import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { quadChecked, rayleigh } from '@flux/subjects/math/quadform.js';

/**
* Quadratic form: a symmetric 2×2 matrix you edit, with the level curves of xᵀAx and its
 * eigenvectors drawn, beside the Rayleigh quotient around the unit circle.
 *
 * Shows that positive entries do not make a matrix positive definite: [[1, 2], [2, 1]] has
 * eigenvalues 3 and −1, and its level curves are hyperbolas, a saddle. [[2, 1], [1, 2]] has 3 and 1:
 * ellipses, a bowl. The eigenvalue formula is checked by finding the extremes of the Rayleigh
 * quotient around the circle (packages/subjects/src/math/quadform.js).
 */
const SCENARIOS = [
  { id: 'bowl', name: 'A bowl: [[2, 1], [1, 2]]', a: 2, b: 1, c: 2 },
  { id: 'saddle', name: 'Positive entries, a saddle: [[1, 2], [2, 1]]', a: 1, b: 2, c: 1 },
  { id: 'tilted', name: 'A long bowl: [[3, 1], [1, 1]]', a: 3, b: 1, c: 1 },
  { id: 'trough', name: 'A trough: [[1, 1], [1, 1]]', a: 1, b: 1, c: 1 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, a: sc.a, b: sc.b, c: sc.c });
}

const KEYS = [['qf-a', 'a'], ['qf-b', 'b'], ['qf-c', 'c']];

function square(r) {
  const s = Math.min(r.x1 - r.x0, r.y1 - r.y0);
  const cx = (r.x0 + r.x1) / 2;
  const cy = (r.y0 + r.y1) / 2;
  return { ...r, x0: cx - s / 2, x1: cx + s / 2, y0: cy - s / 2, y1: cy + s / 2 };
}

function levels(B, rect, state, c) {
  const P = plotIn(B, square(rect), { lo: -2.5, hi: 2.5 }, { lo: -2.5, hi: 2.5 });
  axes(P, { xLabel: 'x₁', yLabel: 'x₂' });
  for (const k of [-4, -2, -1, 1, 2, 4]) {
    let run = [];
    const flush = () => {
      if (run.length > 1) line(P, run, { color: k > 0 ? alpha(C.gold, 0.85) : alpha(C.blue, 0.85), width: 1.6 });
      run = [];
    };
    for (let i = 0; i <= 720; i++) {
      const phi = (2 * Math.PI * i) / 720;
      const R = rayleigh(state, phi);
      if (R * k > 1e-9) {
        const r = Math.sqrt(k / R);
        if (r < 3.6) run.push([r * Math.cos(phi), r * Math.sin(phi)]);
        else flush();
      } else flush();
    }
    flush();
  }
  for (const [ang, lam, col] of [[c.theta, c.l1, C.red], [c.theta + Math.PI / 2, c.l2, C.green]]) {
    const u = [Math.cos(ang), Math.sin(ang)];
    seg(P, [-2.3 * u[0], -2.3 * u[1]], [2.3 * u[0], 2.3 * u[1]], { color: col, width: 2, dash: [6, 4] });
    label(P, `λ = ${fig(lam)}`, [2.3 * u[0], 2.3 * u[1]], { color: col, dx: u[0] >= 0 ? 4 : -4, align: u[0] >= 0 ? 'left' : 'right', dy: -8 });
  }
}

function quotient(B, rect, state, c) {
  const lo = Math.min(-1, c.l2 - 0.5);
  const hi = Math.max(1, c.l1 + 0.5);
  const P = plotIn(B, rect, { lo: 0, hi: 180 }, { lo, hi });
  axes(P, { xLabel: 'angle around the unit circle (degrees)', yLabel: 'xᵀAx on the circle' });
  seg(P, [0, 0], [180, 0], { color: alpha(C.text, 0.35), width: 1 });
  line(P, Array.from({ length: 181 }, (_, i) => [i, rayleigh(state, (i * Math.PI) / 180)]), { color: C.gold, width: 2.5 });
  const deg = (r) => ((((r * 180) / Math.PI) % 180) + 180) % 180;
  dot(P, deg(c.theta), c.l1, { color: C.red, r: 5 });
  dot(P, deg(c.theta + Math.PI / 2), c.l2, { color: C.green, r: 5 });
  label(P, `largest ${fig(c.l1)}`, [deg(c.theta), c.l1], { color: C.red, dy: -12 });
  label(P, `smallest ${fig(c.l2)}`, [deg(c.theta + Math.PI / 2), c.l2], { color: C.green, dy: 16 });
}

export default defineLab({
  id: 'quadratic',
  exam: 'u1',
  title: 'Quadratic form',
  hint: 'Start from the bowl and raise b past 2: every entry stays positive, but the ellipses open into hyperbolas.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('bowl', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'b', lo: -3, hi: 3 }),
  controls() {
    return `
      ${slider('qf-a', "a, the top-left entry", 2, -3, 3, 0.1)}
      ${slider('qf-b', "b, both off-diagonal entries", 1, -3, 3, 0.1)}
      ${slider('qf-c', "c, the bottom-right entry", 2, -3, 3, 0.1)}
      <p class="tiny">A = [[a, b], [b, c]] and q(x) = xᵀAx. Left: level curves q = ±1, ±2, ±4 (gold positive, blue negative) with the eigenvectors. Right: q on the unit circle against the angle; its highest and lowest values are the eigenvalues.</p>`;
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
    return quadChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      levels(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.6 * W } : { ...B.free, y1: B.free.y0 + 0.6 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    levels(B, a, state, c);
    quotient(B, b, state, c);
  },
  law: () => [String.raw`\lambda = \frac{a + c}{2} \pm \sqrt{\left(\frac{a - c}{2}\right)^2 + b^2}`, String.raw`A = Q\Lambda Q^{\mathsf T}, \qquad \mathbf x^{\mathsf T}A\mathbf x = \lambda_1u^2 + \lambda_2v^2`],
  liveRows(state, c) {
    return [
      kv('Eigenvalues', `${fig(c.l1)}, ${fig(c.l2)}`),
      kv('Eigenvector angle', `${fig((c.theta * 180) / Math.PI)}°`),
      kv('Determinant and trace', `${fig(c.det)}, ${fig(c.trace)}`),
      kv('Kind', c.kind),
      kv('Formula against the circle’s extremes', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['λ₁', fig(c.l1)], ['λ₂', fig(c.l2)], ['kind', c.kind.split(':')[0]], ['det', fig(c.det)]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> In n dimensions the same holds with n eigenvalues; checking them all is costly, so a Cholesky factorisation, which succeeds only for a positive definite matrix, is the usual test.`;
    const allPos = state.a > 0 && state.b > 0 && state.c > 0;
    if (c.l2 < -1e-12 && allPos) return { title: 'Positive entries, still a saddle', body: `Every entry is positive, but λ = ${fig(c.l1)} and ${fig(c.l2)}: along the second eigenvector q is negative. The off-diagonal b = ${fig(state.b)} is larger than √(ac) = ${fig(Math.sqrt(state.a * state.c))}, so det A < 0. ${leavesOut}` };
    if (c.l2 > 1e-12) return { title: 'Positive definite: a bowl', body: `Both eigenvalues are positive, ${fig(c.l1)} and ${fig(c.l2)}, so q > 0 in every direction and the level curves are ellipses with axes along the eigenvectors. The ellipse is ${fig(Math.sqrt(c.l1 / c.l2))} times as long one way as the other. ${leavesOut}` };
    return { title: c.kind, body: `The eigenvalues are ${fig(c.l1)} and ${fig(c.l2)}. Their signs, not the entries’, decide the shape: one of each gives hyperbolas, a zero gives a trough of parallel lines. ${leavesOut}` };
  },
  app: false,
});
