import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, begin, dot, label, poly, sceneIn, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { apply as applyMat, attitude } from '@flux/subjects/mechanics/attitude.js';

/**
 * Attitude: a satellite turned by yaw, pitch and roll in sequence, with the yaw axis and the roll
 * axis drawn through it.
 *
 * Shows gimbal lock. Ask the three angles for a slow turn about the body's own axis: near 90° of
 * pitch the angle rates it needs grow as 1/cos θ, and at 90° the yaw and roll axes line up and no
 * angle rates make the turn at all. The quaternion that carries the same attitude makes it exactly.
 * The matrix from the angles is checked against the matrix from the quaternion, and the rate matrix
 * against a central difference of the rotation (packages/subjects/src/mechanics/attitude.js).
 */
const SCENARIOS = [
  { id: 'tilted', name: 'A tilted craft: yaw 30°, pitch 20°, roll 10°', psi: 30, theta: 20, phi: 10, axis: 'z' },
  { id: 'near', name: 'Pitched up 80°', psi: 0, theta: 80, phi: 0, axis: 'z' },
  { id: 'lock', name: 'Pitched up 90°: gimbal lock', psi: 0, theta: 90, phi: 0, axis: 'z' },
  { id: 'lock-roll', name: 'Locked, with 30° of roll', psi: 0, theta: 90, phi: 30, axis: 'z' },
];
const AXES = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, psi: sc.psi, theta: sc.theta, phi: sc.phi, axis: sc.axis });
}

// The camera: looking at the origin from (2.2, 1.5, 1.1), z up.
const EYE = [2.2, 1.5, 1.1];
const unit = (v) => {
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
};
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dotv = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const FWD = unit(EYE.map((v) => -v));
const RIGHT = unit(cross(FWD, [0, 0, 1]));
const UP = cross(RIGHT, FWD);
const view = (v) => [dotv(v, RIGHT), dotv(v, UP)];
const depth = (v) => dotv(v, FWD);

// The model in body axes: a box, two solar panels along ±y and an antenna along +x.
const box = (sx, sy, sz) => {
  const P = (i, j, k) => [i * sx, j * sy, k * sz];
  return [
    [P(1, -1, -1), P(1, 1, -1), P(1, 1, 1), P(1, -1, 1)],
    [P(-1, -1, -1), P(-1, -1, 1), P(-1, 1, 1), P(-1, 1, -1)],
    [P(-1, 1, -1), P(-1, 1, 1), P(1, 1, 1), P(1, 1, -1)],
    [P(-1, -1, -1), P(1, -1, -1), P(1, -1, 1), P(-1, -1, 1)],
    [P(-1, -1, 1), P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1)],
    [P(-1, -1, -1), P(-1, 1, -1), P(1, 1, -1), P(1, -1, -1)],
  ];
};
const BODY = box(0.45, 0.32, 0.32);
const PANELS = [
  [[-0.25, 0.36, 0], [0.25, 0.36, 0], [0.25, 1.35, 0], [-0.25, 1.35, 0]],
  [[-0.25, -0.36, 0], [-0.25, -1.35, 0], [0.25, -1.35, 0], [0.25, -0.36, 0]],
];

export default defineLab({
  id: 'attitude',
  exam: 'u3',
  title: 'Attitude',
  hint: 'Pitch toward 90° and watch the dashed yaw and roll axes close up. Read the yaw rate a 1°/s turn needs: it grows without bound, then the turn cannot be made at all.',
  gapLimit: 1e-8,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('tilted', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'theta', lo: -90, hi: 90 }),
  controls() {
    return `
      ${slider('at-psi', 'Yaw ψ, about z (°)', 30, -180, 180, 1)}
      ${slider('at-theta', 'Pitch θ, about the new y (°)', 20, -90, 90, 0.5)}
      ${slider('at-phi', 'Roll φ, about the body x (°)', 10, -180, 180, 1)}
      <label class="field"><span>Turn wanted: 1°/s about the body’s</span><select id="at-axis"><option value="x">x axis (red)</option><option value="y">y axis (green)</option><option value="z">z axis (blue)</option></select></label>
      <p class="tiny">Angles in 3-2-1 order: yaw, then pitch, then roll. Faint axes: the reference frame. Dashed: the yaw axis (gold) and the roll axis (pink).</p>`;
  },
  bind(api) {
    bindSlider('at-psi', (s, v) => { s.psi = v; }, api);
    bindSlider('at-theta', (s, v) => { s.theta = v; }, api);
    bindSlider('at-phi', (s, v) => { s.phi = v; }, api);
    document.getElementById('at-axis')?.addEventListener('change', (e) => {
      api.slice().axis = e.target.value;
      api.bump();
    });
  },
  syncControls(state) {
    for (const [id, val] of [['at-psi', state.psi], ['at-theta', state.theta], ['at-phi', state.phi]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    }
    const a = document.getElementById('at-axis');
    if (a) a.value = state.axis;
  },
  compute(state) {
    const a = attitude({ psi: state.psi, theta: state.theta, phi: state.phi, axis: AXES[state.axis] || AXES.z });
    const apart = (Math.acos(Math.min(1, a.alignment)) * 180) / Math.PI;
    const big = a.rates ? Math.max(Math.abs(a.rates.phi), Math.abs(a.rates.theta), Math.abs(a.rates.psi)) : null;
    return { ...a, apart, biggestRate: big, psiRate: a.rates ? a.rates.psi : null, qw: a.q[0] };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const S = sceneIn(B, B.free, { x0: -1.9, x1: 1.9, y0: -1.75, y1: 2.15 }, 14);
    const at = (v) => view(v);
    // Reference axes, faint.
    for (const [v, name] of [[[1.5, 0, 0], 'X'], [[0, 1.5, 0], 'Y'], [[0, 0, 1.5], 'Z']]) {
      seg(S, [0, 0], at(v), { color: alpha(C.text, 0.25), width: 1 });
      label(S, name, at(v), { color: alpha(C.text, 0.45), dx: 8 });
    }
    // The body, painted far faces first.
    const faces = [
      ...BODY.map((f) => ({ f, fill: alpha(C.gold, 0.85) })),
      ...PANELS.map((f) => ({ f, fill: alpha(C.blue, 0.75) })),
    ].map(({ f, fill }) => {
      const w = f.map((p) => applyMat(c.R, p));
      return { w, fill, d: w.reduce((s, p) => s + depth(p), 0) / w.length };
    });
    faces.sort((a, b) => b.d - a.d);
    for (const { w, fill } of faces) poly(S, w.map(at), { fill, stroke: alpha(C.bg, 0.9), width: 1 });
    // The yaw axis (reference z) and the roll axis (body x), dashed through the craft.
    const yawEnd = [0, 0, 1.6];
    const rollEnd = c.rollAxis.map((v) => 1.6 * v);
    seg(S, at(yawEnd.map((v) => -v)), at(yawEnd), { color: C.gold, width: 2, dash: [7, 5] });
    seg(S, at(rollEnd.map((v) => -v)), at(rollEnd), { color: C.pink, width: 2, dash: [3, 4] });
    label(S, 'yaw axis', at(yawEnd), { color: C.gold, dy: -10 });
    label(S, 'roll axis', at(rollEnd), { color: C.pink, dx: 8, dy: 12, align: 'left' });
    // Body axes.
    const cols = [C.red, C.green, C.blue];
    ['x', 'y', 'z'].forEach((n, i) => {
      const e = [c.R[0][i], c.R[1][i], c.R[2][i]].map((v) => 1.05 * v);
      seg(S, [0, 0], at(e), { color: cols[i], width: state.axis === n ? 3.5 : 2 });
      dot(S, ...at(e), { color: cols[i], r: 3 });
      label(S, n, at(e), { color: cols[i], dx: 7, dy: -7 });
    });
    const msg = c.locked ? 'Gimbal lock: the yaw and roll axes line up' : `Yaw and roll axes ${fig(c.apart)}° apart`;
    label(S, msg, [0, 2.15], { color: c.locked ? C.red : C.muted, base: 'top' });
  },
  law: () => [String.raw`R = R_z(\psi)\,R_y(\theta)\,R_x(\phi), \qquad R^{\mathsf T}R = I`, String.raw`\boldsymbol\omega = \begin{bmatrix}1 & 0 & -\sin\theta\\ 0 & \cos\phi & \cos\theta\sin\phi\\ 0 & -\sin\phi & \cos\theta\cos\phi\end{bmatrix}\begin{bmatrix}\dot\phi\\ \dot\theta\\ \dot\psi\end{bmatrix}`, String.raw`\mathbf q = q_z(\psi)\,q_y(\theta)\,q_x(\phi)`],
  liveRows(state, c) {
    const r = c.rates;
    return [
      kv('det of the rate matrix, cos θ', fig(c.det)),
      kv(`Rates for 1°/s about body ${state.axis}: φ̇, θ̇, ψ̇`, r ? `${fig(r.phi)}, ${fig(r.theta)}, ${fig(r.psi)} °/s` : 'none exist'),
      kv('Share of that turn no angle rates can make', `${fig(100 * c.residual)}%`),
      kv('Quaternion q = (w, x, y, z)', c.q.map((v) => fig(v)).join(', ')),
      kv('Quaternion makes the turn to within', c.quatError.toExponential(0)),
      kv('Angle matrix against quaternion matrix', c.matGap.toExponential(0)),
      kv('Rate matrix against a difference of R', c.rateGap.toExponential(0)),
      kv('RᵀR against I', c.orthGap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['pitch', `${fig(state.theta)}°`],
      ['axes apart', `${fig(c.apart)}°`],
      ['yaw rate', c.rates ? `${fig(c.rates.psi)} °/s` : 'none'],
      ['quaternion w', fig(c.q[0])],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Only where the craft points, not how it gets there: no inertia, no torques, no sensors. Flight software carries a quaternion and shows angles only to people.`;
    if (c.locked) {
      return {
        title: 'Gimbal lock',
        body: `At ${fig(state.theta)}° of pitch the yaw axis and the roll axis are the same line, so yaw and roll do the same thing and one direction of turn has no angle to make it. Of a turn about the body ${state.axis} axis, ${fig(100 * c.residual)}% cannot be made by any angle rates. The quaternion, (${c.q.map((v) => fig(v)).join(', ')}), turns that way exactly. ${leavesOut}`,
      };
    }
    if (Math.abs(c.det) < 0.3) {
      return {
        title: 'Close to lock',
        body: `cos θ = ${fig(c.det)}, so the rate matrix is close to singular. A gentle 1°/s turn about the body ${state.axis} axis needs ${fig(c.biggestRate)}°/s from the fastest angle. A real attitude loop would command those rates, and noise in them, through this division. ${leavesOut}`,
      };
    }
    return {
      title: 'Three angles, one attitude',
      body: `Yaw ${fig(state.psi)}°, pitch ${fig(state.theta)}° and roll ${fig(state.phi)}° in that order. The yaw and roll axes are ${fig(c.apart)}° apart, so the angles can follow any small turn: 1°/s about the body ${state.axis} axis takes at most ${fig(c.biggestRate)}°/s from any angle. ${leavesOut}`,
    };
  },
  app: false,
});
