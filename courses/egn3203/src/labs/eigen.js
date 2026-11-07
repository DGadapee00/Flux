import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, begin, label, line, sceneIn, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { apply2, eigen2, eigenScan } from '@flux/subjects/math/linalg.js';

/**
 * Eigen: a 2×2 matrix applied to a ring of unit arrows. Most arrows turn; along an eigenvector the
 * arrow only stretches, by its eigenvalue.
 *
 * Shows that not every matrix has directions it only stretches: a quarter turn turns every arrow,
 * and its eigenvalues are ±i. A shear has one direction, a symmetric matrix two at right angles.
 * The characteristic polynomial's roots are checked by scanning the circle for directions where
 * u × Au = 0 (packages/subjects/src/math/linalg.js).
 */
const SCENARIOS = [
  { id: 'symmetric', name: 'A symmetric matrix: two directions at right angles', A: [2, 1, 1, 2] },
  { id: 'stretch', name: 'Stretch along the axes', A: [2, 0, 0, 0.5] },
  { id: 'general', name: 'A general matrix: directions not at right angles', A: [1, 2, 0.5, -1] },
  { id: 'shear', name: 'A shear: only one direction', A: [1, 1, 0, 1] },
  { id: 'rotation', name: 'A quarter turn: no real direction', A: [0, -1, 1, 0] },
];

function apply(id, state) {
  const sc = SCENARIOS.find((x) => x.id === id) || SCENARIOS[0];
  const [a, b, c, d] = sc.A;
  Object.assign(state, { scenarioId: sc.id, a, b, c, d });
}

const RING = 24;

export default defineLab({
  id: 'eigen',
  exam: 'u1',
  title: 'Eigen',
  hint: 'Find the arrows that only stretch. Then try the quarter turn: every arrow turns, so there is no real eigenvector.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('symmetric', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'b', lo: -2, hi: 2 }),
  controls() {
    return `
      ${slider('eg-a', 'a₁₁', 2, -2, 2, 0.05)}
      ${slider('eg-b', 'a₁₂', 1, -2, 2, 0.05)}
      ${slider('eg-c', 'a₂₁', 1, -2, 2, 0.05)}
      ${slider('eg-d', 'a₂₂', 2, -2, 2, 0.05)}
      <p class="tiny">Grey: unit arrows u round the circle. Teal: their images Au. Gold lines: the directions where Au points along u.</p>`;
  },
  bind(api) {
    for (const k of ['a', 'b', 'c', 'd']) bindSlider(`eg-${k}`, (s, v) => { s[k] = v; }, api);
  },
  syncControls(state) {
    for (const k of ['a', 'b', 'c', 'd']) {
      const el = document.getElementById(`eg-${k}`);
      if (el && document.activeElement !== el) el.value = String(state[k]);
    }
  },
  compute(state) {
    const A = [[state.a, state.b], [state.c, state.d]];
    const e = eigen2(A);
    const scale = Math.max(...A.flat().map(Math.abs), 1e-300);
    // A multiple of I stretches every direction alike: every u is an eigenvector.
    const scalar = Math.abs(state.b) < 1e-12 * scale && Math.abs(state.c) < 1e-12 * scale && Math.abs(state.a - state.d) < 1e-12 * scale;
    const found = scalar ? [] : eigenScan(A);
    let gap = 0;
    if (!scalar) {
      if (e.kind === 'complex') gap = found.length;
      else {
        if (found.length !== e.values.length) gap = 1;
        for (const f of found) gap = Math.max(gap, Math.min(...e.values.map((v) => Math.abs(v - f.lambda))) / scale);
      }
    }
    return { A, ...e, found, scalar, count: scalar ? -1 : found.length, gap };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const R = Math.max(2.2, 1.1 * Math.max(...c.A.flat().map(Math.abs)) * Math.SQRT2);
    const P = sceneIn(B, B.free, { x0: -R, x1: R, y0: -R, y1: R }, 14);
    seg(P, [-R, 0], [R, 0], { color: alpha(C.text, 0.25), width: 1 });
    seg(P, [0, -R], [0, R], { color: alpha(C.text, 0.25), width: 1 });
    for (const f of c.found) {
      const u = [Math.cos(f.angle), Math.sin(f.angle)];
      line(P, [[-R * u[0], -R * u[1]], [R * u[0], R * u[1]]], { color: alpha(C.gold, 0.8), width: 2, dash: [6, 4] });
      label(P, `λ = ${fig(f.lambda)}`, [0.85 * R * u[0], 0.85 * R * u[1]], { color: C.gold, dy: -12 });
    }
    for (let k = 0; k < RING; k++) {
      const t = (2 * Math.PI * k) / RING;
      const u = [Math.cos(t), Math.sin(t)];
      const v = apply2(c.A, u);
      arrow(P, [0, 0], t, P.k, { color: alpha(C.text, 0.35), width: 1.2, head: 6 });
      const L = Math.hypot(v[0], v[1]) * P.k;
      if (L > 4) arrow(P, [0, 0], Math.atan2(v[1], v[0]), L, { color: alpha(C.teal, 0.8), width: 1.6, head: 7 });
    }
    const verdict = c.scalar ? 'every direction only stretches' : c.kind === 'complex' ? `no real direction: λ = ${fig(c.re)} ± ${fig(c.im)}i` : c.found.length === 1 ? 'one direction only' : 'two directions';
    label(P, verdict, [0, 0.92 * R], { color: C.yellow });
  },
  law: () => [String.raw`A\mathbf v = \lambda\mathbf v, \qquad \lambda^2 - (\operatorname{tr}A)\,\lambda + \det A = 0`],
  liveRows(state, c) {
    return [
      kv('tr A, det A', `${fig(c.tr)}, ${fig(c.det)}`),
      kv('Discriminant tr² − 4 det', fig(c.disc)),
      kv('Eigenvalues', c.kind === 'complex' ? `${fig(c.re)} ± ${fig(c.im)}i` : c.values.map((v) => fig(v)).join(', ')),
      kv('Directions found on the circle', c.scalar ? 'all of them' : c.found.length ? c.found.map((f) => `${fig((f.angle * 180) / Math.PI)}° (λ = ${fig(f.lambda)})`).join(', ') : 'none'),
      kv('Scan against the polynomial', c.gap.toExponential(1)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['λ₁', c.kind === 'complex' ? `${fig(c.re)} + ${fig(c.im)}i` : c.values.length ? fig(c.values[0]) : '—'],
      ['λ₂', c.kind === 'complex' ? `${fig(c.re)} − ${fig(c.im)}i` : c.values.length > 1 ? fig(c.values[1]) : c.values.length ? 'repeated' : '—'],
      ['directions', c.scalar ? 'all' : String(c.found.length)],
      ['discriminant', fig(c.disc)],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Size. An n × n matrix has n eigenvalues, found in practice by iteration, not by the polynomial, whose roots are too sensitive to rounding. In differential equations they set how each mode grows or decays.`;
    let title = 'Along an eigenvector, the matrix only stretches';
    let body = `Most arrows turn. Along the gold lines Au points along u, stretched by λ = ${c.values.map((v) => fig(v)).join(' and ')}. A negative λ flips the arrow to point backward along the same line.`;
    if (c.scalar) {
      title = 'A multiple of I: every direction is an eigenvector';
      body = `A = ${fig(state.a)}·I stretches every arrow by the same factor and turns none.`;
    } else if (c.kind === 'complex') {
      title = 'No real direction only stretches';
      body = `The discriminant tr² − 4 det = ${fig(c.disc)} is negative, so the eigenvalues are the complex pair ${fig(c.re)} ± ${fig(c.im)}i. Every arrow turns. In a differential equation that turning is oscillation.`;
    } else if (c.kind === 'repeated') {
      title = 'A repeated eigenvalue, one direction';
      body = `λ = ${fig(c.values[0])} twice, but only one direction keeps its line: the matrix is not a multiple of I, so it shears the rest.`;
    } else if (Math.abs(state.b - state.c) < 1e-12) {
      title = 'A symmetric matrix: real eigenvalues at right angles';
      body = `A symmetric matrix always has real eigenvalues, ${c.values.map((v) => fig(v)).join(' and ')}, along directions at right angles to each other. Stress and inertia matrices are like this.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
