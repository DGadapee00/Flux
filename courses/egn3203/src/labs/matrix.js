import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, begin, label, line, poly, sceneIn, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { apply2, det2, mul2, mulByColumns, rotation, shoelace } from '@flux/subjects/math/linalg.js';

/**
 * Matrix map: a 2×2 matrix as a map of the plane. The unit square goes to the parallelogram on the
 * matrix's columns, and a letter F shows whether the map flips the plane over.
 *
 * Shows that a matrix is its columns: where it sends the two unit vectors. The area scales by det A,
 * negative when the plane flips. Composing with a quarter-turn shows that order matters: rotating
 * then shearing is not shearing then rotating. The area is checked by the shoelace formula on the
 * mapped corners, and the product by mapping columns one at a time (packages/subjects/src/math/
 * linalg.js).
 */
const R = rotation(90);
const SQUARE = [[0, 0], [1, 0], [1, 1], [0, 1]];
const F = [[0.2, 0.15], [0.2, 0.85], [0.7, 0.85], [0.7, 0.72], [0.34, 0.72], [0.34, 0.56], [0.6, 0.56], [0.6, 0.43], [0.34, 0.43], [0.34, 0.15]];

const SCENARIOS = [
  { id: 'stretch', name: 'Stretch one way, squash the other', A: [2, 0, 0, 0.5], compose: 'none' },
  { id: 'shear', name: 'A shear', A: [1, 1, 0, 1], compose: 'none' },
  { id: 'reflect', name: 'A reflection: the F flips', A: [-1, 0, 0, 1], compose: 'none' },
  { id: 'squash', name: 'Columns in line: the square collapses', A: [1, 2, 0.5, 1], compose: 'none' },
  { id: 'shear-then-turn', name: 'Shear, then a quarter turn', A: [1, 1, 0, 1], compose: 'after' },
  { id: 'turn-then-shear', name: 'A quarter turn, then shear', A: [1, 1, 0, 1], compose: 'before' },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  const [a, b, c, d] = sc.A;
  Object.assign(state, { scenarioId: sc.id, a, b, c, d, compose: sc.compose });
}

const matA = (s) => [[s.a, s.b], [s.c, s.d]];
const composed = (A, how) => (how === 'after' ? mul2(R, A) : how === 'before' ? mul2(A, R) : A);

export default defineLab({
  id: 'matrix',
  exam: 'u1',
  title: 'Matrix map',
  hint: 'Drag the columns and watch the square follow them. Then add a quarter turn before or after: the two orders land in different places.',
  gapLimit: 1e-12,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('shear', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'b', lo: -2, hi: 2 }),
  controls() {
    return `
      ${slider('mx-a', 'a₁₁ (first column, x)', 1, -2, 2, 0.05)}
      ${slider('mx-c', 'a₂₁ (first column, y)', 0, -2, 2, 0.05)}
      ${slider('mx-b', 'a₁₂ (second column, x)', 1, -2, 2, 0.05)}
      ${slider('mx-d', 'a₂₂ (second column, y)', 1, -2, 2, 0.05)}
      <label class="field"><span>Quarter turn R</span><select id="mx-comp"><option value="none">None</option><option value="after">After A: RA</option><option value="before">Before A: AR</option></select></label>
      <p class="tiny">The grey square and F are the originals. The teal parallelogram and gold F are their images.</p>`;
  },
  bind(api) {
    bindSlider('mx-a', (s, v) => { s.a = v; }, api);
    bindSlider('mx-b', (s, v) => { s.b = v; }, api);
    bindSlider('mx-c', (s, v) => { s.c = v; }, api);
    bindSlider('mx-d', (s, v) => { s.d = v; }, api);
    document.getElementById('mx-comp')?.addEventListener('change', (e) => {
      api.slice().compose = e.target.value;
      api.bump();
    });
  },
  syncControls(state) {
    for (const [id, val] of [['mx-a', state.a], ['mx-b', state.b], ['mx-c', state.c], ['mx-d', state.d]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    }
    const sel = document.getElementById('mx-comp');
    if (sel) sel.value = state.compose;
  },
  compute(state) {
    const A = matA(state);
    const M = composed(A, state.compose);
    const byCols = state.compose === 'after' ? mulByColumns(R, A) : state.compose === 'before' ? mulByColumns(A, R) : A;
    const other = state.compose === 'after' ? mul2(A, R) : mul2(R, A);
    const square = SQUARE.map((p) => apply2(M, p));
    const det = det2(M);
    const area = shoelace(square);
    const gap = Math.abs(area - det) + Math.max(...M.flat().map((v, i) => Math.abs(v - byCols.flat()[i])));
    const commutes = Math.max(...mul2(R, A).flat().map((v, i) => Math.abs(v - mul2(A, R).flat()[i]))) < 1e-9;
    return { M, det, area, square, f: F.map((p) => apply2(M, p)), col1: [M[0][0], M[1][0]], col2: [M[0][1], M[1][1]], other, commutes, flipped: det < 0, singular: Math.abs(det) < 1e-9, gap };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const P = sceneIn(B, B.free, { x0: -3.2, x1: 3.2, y0: -3.2, y1: 3.2 }, 14);
    for (let k = -3; k <= 3; k++) {
      line(P, [apply2(c.M, [k, -3]), apply2(c.M, [k, 3])], { color: alpha(C.blue, 0.18), width: 1 });
      line(P, [apply2(c.M, [-3, k]), apply2(c.M, [3, k])], { color: alpha(C.blue, 0.18), width: 1 });
    }
    seg(P, [-3.2, 0], [3.2, 0], { color: alpha(C.text, 0.3), width: 1 });
    seg(P, [0, -3.2], [0, 3.2], { color: alpha(C.text, 0.3), width: 1 });
    poly(P, SQUARE, { fill: alpha(C.muted, 0.12), stroke: alpha(C.muted, 0.6), width: 1 });
    poly(P, F, { fill: alpha(C.muted, 0.25), stroke: null });
    poly(P, c.square, { fill: alpha(C.teal, 0.22), stroke: C.teal, width: 2 });
    poly(P, c.f, { fill: alpha(C.gold, 0.75), stroke: null });
    const u = P.k;
    const arr = (v, color, name) => {
      const L = Math.hypot(v[0], v[1]) * u;
      if (L > 4) arrow(P, [0, 0], Math.atan2(v[1], v[0]), L, { color, width: 2.5 });
      label(P, name, v, { color, dx: 10, dy: -8 });
    };
    arr(c.col1, C.pink, 'first column');
    arr(c.col2, C.yellow, 'second column');
  },
  law: () => [String.raw`A\mathbf x = x_1\mathbf a_1 + x_2\mathbf a_2,\qquad \text{area} \times \det A`, String.raw`(AB)\mathbf x = A(B\mathbf x),\qquad AB \ne BA`],
  liveRows(state, c) {
    const m = (M) => `[${M.map((r) => r.map((v) => fig(Math.abs(v) < 1e-12 ? 0 : v)).join(', ')).join('; ')}]`;
    return [
      kv('the map', m(c.M)),
      kv('area by det', fig(c.det)),
      kv('area by shoelace', fig(c.area)),
      kv(state.compose === 'none' ? 'RA and AR' : 'the other order', state.compose === 'none' ? (c.commutes ? 'equal' : 'differ') : m(c.other)),
      kv('det against shoelace', `${fig(c.gap)}`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['area scale', fig(c.det)],
      ['flips the plane', c.flipped ? 'yes' : 'no'],
      ['first column', `(${fig(c.col1[0])}, ${fig(c.col1[1])})`],
      ['second column', `(${fig(c.col2[0])}, ${fig(c.col2[1])})`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Two dimensions. A 3×3 matrix maps the unit cube to the box on its three columns, with volume det A, and everything here carries over.`;
    let title = 'A matrix is its columns';
    let body = String.raw`The first column is where (1, 0) lands and the second where (0, 1) lands. Every other point follows: $A(x, y) = x\,\mathbf a_1 + y\,\mathbf a_2$. Areas scale by det A = ${fig(c.det)}.`;
    if (c.singular) {
      title = 'Columns in line: the plane collapses';
      body = String.raw`The two columns point along the same line, so the square flattens onto it and det A = 0. Many points land on the same image, and no matrix can undo the map.`;
    } else if (c.flipped) {
      title = 'A negative determinant flips the plane';
      body = String.raw`det A = ${fig(c.det)} < 0: the gold F is mirrored. Area still scales by |det A| = ${fig(Math.abs(c.det))}.`;
    } else if (state.compose !== 'none') {
      title = 'Order matters';
      body = String.raw`${state.compose === 'after' ? 'Shearing first and then turning' : 'Turning first and then shearing'} sends the square somewhere the other order does not. Both have det = ${fig(c.det)}, because det(AB) = det A det B either way, but the matrices differ.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
