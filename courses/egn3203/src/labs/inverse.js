import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, begin, label, line, poly, sceneIn, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { apply2, det2, gaussJordan, inverse2, singular2, stretchRange } from '@flux/subjects/math/linalg.js';

/**
 * Inverse: a 2×2 matrix, its determinant, its inverse and how close it is to singular.
 *
 * The unit square maps to a parallelogram of area |det A|, and the unit circle to an ellipse whose
 * half-axes are the singular values σ₁ ≥ σ₂. Shows that a small determinant does not mean nearly
 * singular: scale every entry by 0.1 and det falls a hundredfold while the ellipse keeps its shape.
 * The condition number κ = σ₁/σ₂, the ellipse's long axis over its short one, is what says how
 * close A is to collapsing the plane. The inverse by the adjugate is checked against Gauss–Jordan
 * elimination, and the singular values against a search of the circle for the longest and shortest
 * |Au| (packages/subjects/src/math/linalg.js).
 */
const SQUARE = [[0, 0], [1, 0], [1, 1], [0, 1]];

const SCENARIOS = [
  { id: 'shear', name: 'A shear', A: [1, 1, 0, 1], s: 1 },
  { id: 'small', name: 'A tenth of the identity: det = 0.01', A: [1, 0, 0, 1], s: 0.1 },
  { id: 'nearly', name: 'Nearly dependent columns: det = 0.01 too', A: [1, 1, 1, 1.01], s: 1 },
  { id: 'stretch', name: 'Stretch and squash', A: [2, 0, 0, 0.5], s: 1 },
  { id: 'flip', name: 'A reflection', A: [0, 1, 1, 0], s: 1 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((x) => x.id === id) || SCENARIOS[0];
  const [a, b, c, d] = sc.A;
  Object.assign(state, { scenarioId: sc.id, a, b, c, d, s: sc.s });
}

const mat = (s) => [[s.s * s.a, s.s * s.b], [s.s * s.c, s.s * s.d]];
const show = (M) => (M ? `[${M.map((r) => r.map((v) => fig(Math.abs(v) < 1e-12 ? 0 : v)).join(', ')).join('; ')}]` : 'none: det A = 0');

export default defineLab({
  id: 'inverse',
  exam: 'u1',
  title: 'Inverse',
  hint: 'Shrink every entry with the scale slider: det falls fast, but the ellipse keeps its shape. Then compare 0.1·I with the nearly dependent matrix: same det, very different κ.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('shear', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 's', lo: 0.05, hi: 1.5 }),
  controls() {
    return `
      ${slider('iv-a', 'a₁₁', 1, -2, 2, 0.01)}
      ${slider('iv-b', 'a₁₂', 1, -2, 2, 0.01)}
      ${slider('iv-c', 'a₂₁', 0, -2, 2, 0.01)}
      ${slider('iv-d', 'a₂₂', 1, -2, 2, 0.01)}
      ${slider('iv-s', 'Scale every entry by s', 1, 0.05, 1.5, 0.01)}
      <p class="tiny">Teal: the unit square's image. Gold: the unit circle's image, an ellipse with half-axes σ₁ and σ₂.</p>`;
  },
  bind(api) {
    for (const k of ['a', 'b', 'c', 'd', 's']) bindSlider(`iv-${k}`, (st, v) => { st[k] = v; }, api);
  },
  syncControls(state) {
    for (const k of ['a', 'b', 'c', 'd', 's']) {
      const el = document.getElementById(`iv-${k}`);
      if (el && document.activeElement !== el) el.value = String(state[k]);
    }
  },
  compute(state) {
    const A = mat(state);
    const det = det2(A);
    const inv = inverse2(A);
    const gj = gaussJordan(A);
    const [s1, s2] = singular2(A);
    const [r1, r2] = stretchRange(A);
    const scale = Math.max(...A.flat().map(Math.abs), 1e-300);
    const rel = (x, y) => Math.abs(x - y) / Math.max(Math.abs(y), 1e-300);
    let gap = Math.max(Math.abs(det - gj.det) / scale ** 2, rel(r1, s1), s1 > 0 ? Math.abs(r2 - s2) / s1 : 0);
    if (inv && gj.inverse) {
      const big = Math.max(...inv.flat().map(Math.abs));
      gap = Math.max(gap, ...inv.flat().map((v, i) => Math.abs(v - gj.inverse.flat()[i]) / big));
    }
    const kappa = s2 > 0 ? s1 / s2 : null;
    return { A, det, inv, invDet: inv ? det2(inv) : null, s1, s2, kappa, square: SQUARE.map((p) => apply2(A, p)), flipped: det < 0, gap };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const R = Math.max(2.4, 1.15 * c.s1);
    const P = sceneIn(B, B.free, { x0: -R, x1: R, y0: -R, y1: R }, 14);
    seg(P, [-R, 0], [R, 0], { color: alpha(C.text, 0.3), width: 1 });
    seg(P, [0, -R], [0, R], { color: alpha(C.text, 0.3), width: 1 });
    const circle = [];
    const ellipse = [];
    for (let i = 0; i <= 120; i++) {
      const t = (2 * Math.PI * i) / 120;
      circle.push([Math.cos(t), Math.sin(t)]);
      ellipse.push(apply2(c.A, [Math.cos(t), Math.sin(t)]));
    }
    line(P, circle, { color: alpha(C.muted, 0.5), width: 1, dash: [3, 3] });
    poly(P, SQUARE, { fill: alpha(C.muted, 0.1), stroke: alpha(C.muted, 0.5), width: 1 });
    poly(P, c.square, { fill: alpha(C.teal, 0.25), stroke: C.teal, width: 2 });
    line(P, ellipse, { color: C.gold, width: 2.5 });
    // The ellipse's long axis: the image of the direction A stretches most.
    let best = 0;
    for (let i = 0; i < 180; i++) {
      const v = apply2(c.A, [Math.cos((Math.PI * i) / 180), Math.sin((Math.PI * i) / 180)]);
      if (Math.hypot(...v) > Math.hypot(...apply2(c.A, [Math.cos((Math.PI * best) / 180), Math.sin((Math.PI * best) / 180)]))) best = i;
    }
    const v = apply2(c.A, [Math.cos((Math.PI * best) / 180), Math.sin((Math.PI * best) / 180)]);
    if (Math.hypot(...v) * P.k > 6) arrow(P, [0, 0], Math.atan2(v[1], v[0]), Math.hypot(...v) * P.k, { color: C.gold, width: 1.5, head: 7 });
    label(P, `κ = σ₁/σ₂ = ${c.kappa == null ? '∞' : fig(c.kappa)}`, [0, -0.88 * R], { color: C.gold });
    label(P, `det A = ${fig(c.det)}`, [0, 0.9 * R], { color: C.teal });
  },
  law: () => [String.raw`A^{-1} = \frac{1}{ad - bc}\begin{bmatrix} d & -b\\ -c & a\end{bmatrix}`, String.raw`\kappa = \frac{\sigma_1}{\sigma_2}`, String.raw`\det(sA) = s^2\det A, \quad \kappa(sA) = \kappa(A)`],
  liveRows(state, c) {
    return [
      kv('A', show(c.A)),
      kv('det A', fig(c.det)),
      kv('A⁻¹ by the adjugate', show(c.inv)),
      kv('det A⁻¹ = 1/det A', c.invDet == null ? '—' : fig(c.invDet)),
      kv('σ₁, σ₂', `${fig(c.s1)}, ${fig(c.s2)}`),
      kv('Condition number κ', c.kappa == null ? '∞: singular' : fig(c.kappa)),
      kv('Second routes: Gauss–Jordan, circle search', c.gap.toExponential(1)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['det A', fig(c.det)],
      ['κ', c.kappa == null ? '∞' : fig(c.kappa)],
      ['σ₁', fig(c.s1)],
      ['σ₂', fig(c.s2)],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Larger matrices. For n × n the determinant scales as sⁿ, so it is even less use as a test. Solvers report κ, and lose about log₁₀ κ digits of accuracy.`;
    let title = 'The inverse undoes the map';
    let body = `A⁻¹ = (1/det A)[[d, −b], [−c, a]]: swap the diagonal, negate the rest, divide by det A = ${fig(c.det)}. Areas scale by det A, so A⁻¹ scales them by 1/det A.`;
    if (state.scenarioId === 'small' || (c.kappa != null && c.kappa < 1.5 && Math.abs(c.det) < 0.05)) {
      title = 'A small determinant, a perfectly safe matrix';
      body = `det A = ${fig(c.det)}, yet the circle maps to a circle: κ = ${fig(c.kappa)}. Scaling every entry by s scales det by s² and leaves κ alone. The matrix is small, not nearly singular, and its inverse is 1/s times the original's.`;
    } else if (c.kappa != null && c.kappa > 50) {
      title = 'A thin ellipse: nearly singular';
      body = `The columns nearly line up, so the circle is squashed almost to a line: κ = ${fig(c.kappa)}. A small change in b can move the solution of Ax = b by κ times as much, relatively. det A = ${fig(c.det)} here is the same as 0.1·I's, which shows nothing is wrong.`;
    } else if (c.flipped) {
      title = 'A negative determinant flips the plane';
      body = `det A = ${fig(c.det)} < 0: the square comes back mirrored. The inverse flips it back, with det A⁻¹ = ${fig(c.invDet)}.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
