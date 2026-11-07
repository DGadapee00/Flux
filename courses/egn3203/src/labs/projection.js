import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, begin, dot, label, poly, sceneIn, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { projection } from '@flux/subjects/math/projection.js';

/**
 * Projection: a point b above the plane of two arrows, dropped onto the plane.
 *
 * Shows least squares. The closest point p = x̂₁a₁ + x̂₂a₂ has its error b − p perpendicular to both
 * arrows: the normal equations AᵀA x̂ = Aᵀb. Projecting onto each arrow on its own and adding the two
 * shadows lands on p only when the arrows are perpendicular; at 45° it misses by about the size of
 * b. The normal equations are checked against Gram–Schmidt (packages/subjects/src/math/projection.js).
 */
const SCENARIOS = [
  { id: 'right', name: 'Perpendicular arrows', theta: 90, L: 1, bu: 1.2, bv: 0.8, bw: 1 },
  { id: 'slant', name: 'Arrows at 45°', theta: 45, L: 1, bu: 1.2, bv: 0.8, bw: 1 },
  { id: 'narrow', name: 'Arrows only 20° apart', theta: 20, L: 1, bu: 1.2, bv: 0.8, bw: 1 },
  { id: 'inplane', name: 'b already in the plane', theta: 45, L: 1, bu: 1.2, bv: 0.8, bw: 0 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, theta: sc.theta, L: sc.L, bu: sc.bu, bv: sc.bv, bw: sc.bw });
}

const KEYS = [['pj-t', 'theta'], ['pj-l', 'L'], ['pj-u', 'bu'], ['pj-v', 'bv'], ['pj-w', 'bw']];
// The camera: the plane z = 0 seen from above and to one side.
const unit = (v) => {
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
};
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dotv = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const FWD = unit([-1.2, 2.4, -1.6]);
const RIGHT = unit(cross(FWD, [0, 0, 1]));
const UP = cross(RIGHT, FWD);
const view = (v) => [dotv(v, RIGHT), dotv(v, UP)];
const vec = (v) => `(${v.map((x) => fig(x)).join(', ')})`;

export default defineLab({
  id: 'projection',
  exam: 'u1',
  title: 'Projection',
  hint: 'Tilt the arrows off 90° and compare the true drop p with the grey sum of the two separate shadows. Only the true error is square to both arrows.',
  gapLimit: 1e-10,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('slant', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'theta', lo: 15, hi: 165 }),
  controls() {
    return `
      ${slider('pj-t', 'Angle between a₁ and a₂ (°)', 45, 15, 165, 1)}
      ${slider('pj-l', 'Length of a₂', 1, 0.5, 2, 0.05)}
      ${slider('pj-u', 'b, first coordinate', 1.2, -2, 2, 0.05)}
      ${slider('pj-v', 'b, second coordinate', 0.8, -2, 2, 0.05)}
      ${slider('pj-w', 'b, height above the plane', 1, 0, 2, 0.05)}
      <p class="tiny">a₁ = (1, 0, 0); a₂ lies in the same flat plane. Yellow: p, the true projection, reached as x̂₁a₁ then x̂₂a₂. Grey: the two separate shadows added.</p>`;
  },
  bind(api) {
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    for (const [id, key] of KEYS) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(state[key]);
    }
  },
  compute(state) {
    const r = projection(state);
    return { ...r, perp: Math.max(Math.abs(r.eDots[0]), Math.abs(r.eDots[1])) < 1e-9, naiveRight: r.naiveErr < 1e-9 };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const leg1 = c.a1.map((x) => x * c.xhat[0]);
    // The plane, as a parallelogram on the two arrows, just large enough to hold every point drawn.
    // Everything drawn is s·a₁ + t·a₂ for (s, t) among these, so the plane spans their range.
    const dt = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
    const shadows = [dt(c.b, c.a1) / dt(c.a1, c.a1), dt(c.b, c.a2) / dt(c.a2, c.a2)];
    const st = [[0, 0], [1, 0], [0, 1], c.xhat, [c.xhat[0], 0], shadows];
    const s0 = Math.min(...st.map((q) => q[0])) - 0.35;
    const s1 = Math.max(...st.map((q) => q[0])) + 0.35;
    const t0 = Math.min(...st.map((q) => q[1])) - 0.35;
    const t1 = Math.max(...st.map((q) => q[1])) + 0.35;
    const cornersW = [[s0, t0], [s1, t0], [s1, t1], [s0, t1]].map(([u, v]) => c.a1.map((x, i) => u * x + v * c.a2[i]));
    const pts = [[0, 0, 0], c.a1, c.a2, c.b, c.p, c.naive, leg1, ...cornersW].map(view);
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const pad = 0.4;
    const S = sceneIn(B, B.free, { x0: Math.min(...xs) - pad, x1: Math.max(...xs) + pad, y0: Math.min(...ys) - pad, y1: Math.max(...ys) + pad }, 16);
    poly(S, cornersW.map(view), { fill: alpha(C.blue, 0.08), stroke: alpha(C.blue, 0.25), width: 1 });
    const pix = (a, b) => Math.hypot(...view(b).map((v, i) => (v - view(a)[i]) * S.k));
    const draw = (from, to, col, w = 2.5) => {
      const [p, q] = [view(from), view(to)];
      const len = pix(from, to);
      if (len > 6) arrow(S, q, Math.atan2(q[1] - p[1], q[0] - p[0]), len, { color: col, width: w, tail: true });
    };
    draw([0, 0, 0], c.a1, C.red);
    draw([0, 0, 0], c.a2, C.green);
    label(S, 'a₁', view(c.a1), { color: C.red, dx: 8, dy: 10 });
    label(S, 'a₂', view(c.a2), { color: C.green, dx: 8, dy: -8 });
    // The true projection, reached along a₁ then a₂, and the error up to b.
    seg(S, view([0, 0, 0]), view(leg1), { color: alpha(C.red, 0.5), width: 1.5, dash: [4, 3] });
    seg(S, view(leg1), view(c.p), { color: alpha(C.green, 0.5), width: 1.5, dash: [4, 3] });
    seg(S, view(c.p), view(c.b), { color: C.pink, width: 2.5 });
    seg(S, view(c.naive), view(c.b), { color: alpha(C.muted, 0.7), width: 1.5, dash: [3, 3] });
    dot(S, ...view(c.naive), { color: C.muted, r: 5 });
    dot(S, ...view(c.p), { color: C.yellow, r: 6, ring: C.text });
    dot(S, ...view(c.b), { color: C.text, r: 5 });
    label(S, 'b', view(c.b), { color: C.text, dx: 8, dy: -8 });
    label(S, 'p', view(c.p), { color: C.yellow, dx: -10, dy: 12 });
    if (!c.naiveRight) label(S, 'sum of shadows', view(c.naive), { color: C.muted, dx: -8, dy: 14, align: 'right' });
  },
  law: () => [String.raw`A^{\mathsf T}A\,\hat{\mathbf x} = A^{\mathsf T}\mathbf b, \qquad \mathbf p = A\hat{\mathbf x}`, String.raw`A^{\mathsf T}(\mathbf b - \mathbf p) = \mathbf 0`],
  liveRows(state, c) {
    return [
      kv('x̂ by the normal equations', vec(c.xhat)),
      kv('x̂ by Gram–Schmidt', vec(c.xGS)),
      kv('p', vec(c.p)),
      kv('Error |b − p|', fig(c.err)),
      kv('Error · a₁, error · a₂', `${c.eDots.map((v) => v.toExponential(0)).join(', ')}`),
      kv('Sum of shadows, and its miss', `${vec(c.naive)}, ${fig(c.naiveErr)}`),
      kv('Its error · a₁, · a₂', c.naiveDots.map((v) => fig(v)).join(', ')),
      kv('Condition number of AᵀA', fig(c.cond)),
      kv('Two methods differ by', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['x̂₁', fig(c.xhat[0])],
      ['x̂₂', fig(c.xhat[1])],
      ['|b − p|', fig(c.err)],
      ['sum misses', fig(c.naiveErr)],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Exact arithmetic. With nearly parallel columns AᵀA is badly conditioned, here ${fig(c.cond)}, and solving the normal equations in floating point loses about twice as many digits as a QR solve does.`;
    if (c.naiveRight) {
      return { title: 'Perpendicular: the shadows add', body: `With a₁ ⊥ a₂ the shadow of b on one arrow has no part along the other, so the two shadows add to the projection: p = ${vec(c.p)}. ${leavesOut}` };
    }
    return {
      title: 'Slanted: the shadows overlap',
      body: `The arrows are ${fig(state.theta)}° apart, so each shadow already contains part of the other arrow, and their sum overshoots p by ${fig(c.naiveErr)}. The true p makes the error square to both arrows (error · a = 0 within round-off), which is what AᵀA x̂ = Aᵀb says: x̂ = ${vec(c.xhat)}. ${leavesOut}`,
    };
  },
  app: false,
});
