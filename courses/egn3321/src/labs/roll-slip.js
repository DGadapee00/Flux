import { G } from '@flux/subjects/mechanics/constants.js';
import { centralInertia, rollOrSlip } from '@flux/subjects/mechanics/inertia.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha as fade, axes, begin, chartIn, circle, dot, hidden, label, line, poly, sceneIn, seg, split, vec } from './diagram.js';
import { defineLab } from './define2d.js';
import { PLAY, advance } from './motion.js';
import { bindSlider, slider } from './widgets.js';

const BODY = { mass: 2, radius: 0.25, theta: 30 };

const SCENARIOS = [
  { id: 'disk', name: 'Disk', shape: 'disk', mu: 0.3, ...BODY },
  { id: 'hoop', name: 'Hoop', shape: 'hoop', mu: 0.15, ...BODY },
  { id: 'sphere', name: 'Sphere', shape: 'sphere', mu: 0.3, ...BODY },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  state.shape = sc.shape;
  state.mass = sc.mass ?? state.mass ?? 2;
  state.radius = sc.radius ?? state.radius ?? 0.25;
  state.theta = sc.theta ?? state.theta ?? 30;
  state.mu = sc.mu ?? state.mu ?? 0.3;
  state.t = 0;
  state.anim = { playing: false };
  state.show = { play: false };
}

const T_END = 1.2;

/** A curved arrow for a couple about `at`: counterclockwise when `sign` > 0. Dashed, as a kinetic term. */
function couple(S, at, px, sign, color, text) {
  const { ctx } = S;
  const cx = S.X(at[0]);
  const cy = S.Y(at[1]);
  const a0 = -0.2 * Math.PI;
  const a1 = 1.1 * Math.PI;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.arc(cx, cy, px, -a1, -a0);
  ctx.stroke();
  ctx.setLineDash([]);
  const end = sign > 0 ? -a1 : -a0;
  const hx = cx + px * Math.cos(end);
  const hy = cy + px * Math.sin(end);
  const dir = sign > 0 ? -1 : 1;
  const tx = -Math.sin(end) * dir;
  const ty = Math.cos(end) * dir;
  ctx.beginPath();
  ctx.moveTo(hx + tx * 8, hy + ty * 8);
  ctx.lineTo(hx - ty * 4.5, hy + tx * 4.5);
  ctx.lineTo(hx + ty * 4.5, hy - tx * 4.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  if (text) label(S, text, at, { color, dy: -px - 9 });
}

/**
 * A round body on an incline (Hibbeler §17.5): it rolls without slipping when the friction rolling
 * needs is within μN, and slips otherwise. Shows that rolling needs friction, more for a hoop than a
 * disk, and that a slipping body spins up too slowly to keep pace: v pulls ahead of ωR. The free-body
 * diagram equals the kinetic diagram, m a_G and I_G α.
 *
 * Recompute: ΣF along the plane, and moments about G, with or without the no-slip condition.
 * Check: rollOrSlip's force and torque forms agree, and energy for a slip.
 */
export default defineLab({
  id: 'roll-slip',
  exam: 'u6',
  title: 'Roll or slip',
  app: false,
  gapLimit: 1e-6,
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  sweep: () => ({ key: 'mu', lo: 0, hi: 0.8 }),
  hint: 'Rolling acceleration is g sin θ over 1 + k²/R². A hoop needs more friction than a disk.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('disk', s);
    return s;
  },
  applyScenario: apply,
  controls() {
    return `
      ${slider('rs-mass', 'mass (kg)', 2, 0.5, 8, 0.5)}
      ${slider('rs-radius', 'radius (m)', 0.25, 0.1, 0.6, 0.05)}
      ${slider('rs-theta', 'incline (deg)', 30, 10, 60, 1)}
      ${slider('rs-mu', 'friction μ', 0.3, 0, 0.8, 0.01)}
      <p class="tiny">Left, the free-body diagram: pink is friction, up the plane; teal the normal; grey the weight. Right, the kinetic diagram: purple m a_G and I_G α. A hoop is a ring, a disk has a hub, and a sphere has an equator. Play runs 1.2 s.</p>`;
  },
  bind(api) {
    const link = (id, key) => bindSlider(id, (s, val) => { s[key] = val; }, api);
    link('rs-mass', 'mass');
    link('rs-radius', 'radius');
    link('rs-theta', 'theta');
    link('rs-mu', 'mu');
  },
  syncControls(state) {
    for (const [id, key] of [['rs-mass', 'mass'], ['rs-radius', 'radius'], ['rs-theta', 'theta'], ['rs-mu', 'mu']]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(state[key]);
    }
  },
  tick(dt, state) {
    return advance(state, dt, { lo: 0, hi: T_END, rate: 0.5 });
  },
  compute(state) {
    const mass = Number(state.mass) || 0;
    const radius = Number(state.radius) || 0;
    const I = centralInertia(state.shape, mass, radius);
    const row = rollOrSlip({
      mass,
      radius,
      I,
      thetaDeg: Number(state.theta) || 0,
      mu: Number(state.mu) || 0,
      g: G,
    });
    const th = (Number(state.theta) || 0) * Math.PI / 180;
    const t = Math.min(Math.max(Number(state.t) || 0, 0), T_END);
    return {
      I,
      t,
      s: 0.5 * row.a * t * t,
      spin: 0.5 * row.alpha * t * t,
      vNow: row.a * t,
      wRNow: row.alpha * radius * t,
      a: row.a,
      alpha: row.alpha,
      f: row.f,
      N: row.N,
      muMin: row.muMin,
      mode: row.mode,
      v: row.vKin,
      gap: row.gap,
      cx: -radius * Math.sin(th),
      cy: radius * Math.cos(th),
      ux: Math.cos(th),
      uy: Math.sin(th),
      nx: -Math.sin(th),
      ny: Math.cos(th),
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [scene, right] = veiled ? [B.free, null] : split(B.free, 0.55);
    const R = Math.max(Number(state.radius) || 0.1, 0.08);
    const mass = Number(state.mass) || 0;
    const W = mass * G;
    // Two diagrams of the same instant: the body a distance s down the plane from its start.
    const mid = (scene.x0 + scene.x1) / 2;
    const halves = [{ ...scene, x1: mid }, { ...scene, x0: mid }];
    const u = [c.ux, c.uy];
    const n = [c.nx, c.ny];
    // The plane rises to the right; the body rolls down it, to the left.
    const reach = 3 * R;
    const travel = Math.min(c.s, 1.6 * R);
    const contact = [-travel * u[0], -travel * u[1]];
    const centre = [contact[0] + R * n[0], contact[1] + R * n[1]];
    const box = { x0: centre[0] - 2.7 * R, x1: centre[0] + 2.7 * R, y0: centre[1] - 2.6 * R, y1: centre[1] + 1.9 * R };
    const draws = (S) => {
      poly(S, [[-(reach + 4 * R) * u[0], -(reach + 4 * R) * u[1]], [reach * u[0], reach * u[1]], [reach * u[0], -(reach + 4 * R) * u[1]]], { fill: fade(C.text, 0.1), stroke: fade(C.text, 0.5), width: 1.5 });
      const fill = state.shape === 'disk' ? fade(C.text, 0.15) : state.shape === 'sphere' ? fade(C.text, 0.1) : null;
      circle(S, centre, R, { stroke: C.text, width: 2.5, fill });
      if (state.shape === 'hoop') circle(S, centre, R * 0.9, { stroke: C.text, width: 1.5 });
      // A spoke, turned by the body's own rotation: rolling down the plane, to the left, is counterclockwise.
      const ang = Math.PI / 2 + c.spin;
      seg(S, centre, [centre[0] + R * Math.cos(ang), centre[1] + R * Math.sin(ang)], { color: C.gold, width: 2 });
      dot(S, centre[0], centre[1], { color: C.text, r: 3 });
    };
    const S1 = sceneIn(B, halves[0], box);
    draws(S1);
    const k = (1.3 * R * S1.k) / Math.max(W, 1e-9);
    vec(S1, centre, [0, -W], k, { color: C.dim, label: 'mg' });
    vec(S1, contact, [c.N * n[0], c.N * n[1]], k, { color: C.teal, label: 'N' });
    if (Math.abs(c.f) > 1e-9) vec(S1, contact, [c.f * u[0], c.f * u[1]], k, { color: C.pink, label: 'f' });
    label(S1, 'free body', [box.x0, box.y1], { color: C.muted, align: 'left', dy: 10 });
    const S2 = sceneIn(B, halves[1], box);
    draws(S2);
    const kK = (1.3 * R * S2.k) / Math.max(W, 1e-9);
    if (c.a > 1e-9) vec(S2, centre, [-mass * c.a * u[0], -mass * c.a * u[1]], kK, { color: C.purple, dash: [5, 4], width: 2, label: 'm a' });
    if (Math.abs(c.alpha) > 1e-9) couple(S2, centre, Math.max(10, 0.55 * R * S2.k), 1, C.purple, 'Iα');
    label(S2, c.mode === 'roll' ? 'kinetic: rolls' : 'kinetic: slips', [box.x0, box.y1], { color: c.mode === 'roll' ? C.teal : C.red, align: 'left', dy: 10 });
    B.ctx.save();
    B.ctx.fillStyle = C.text;
    B.ctx.font = '600 20px system-ui, sans-serif';
    B.ctx.textAlign = 'center';
    B.ctx.textBaseline = 'middle';
    B.ctx.fillText('=', mid, (scene.y0 + scene.y1) / 2);
    B.ctx.restore();
    if (veiled) return;

    // The centre's speed and the rim's speed ωR: equal while it rolls, apart when it slips.
    const top = Math.max(c.a * T_END, 1e-6) * 1.15;
    const P = chartIn(B, right, { lo: 0, hi: T_END }, { lo: 0, hi: top });
    axes(P, { xLabel: 'time (s)', yLabel: 'speed (m/s)' });
    line(P, [[0, 0], [T_END, c.a * T_END]], { color: C.text, width: 2.5 });
    line(P, [[0, 0], [T_END, c.alpha * R * T_END]], { color: C.gold, width: 2, dash: c.mode === 'roll' ? [6, 4] : null });
    label(P, 'v of G', [T_END * 0.97, c.a * T_END * 0.97], { color: C.text, align: 'right', dy: -10 });
    label(P, 'ωR', [T_END * 0.97, c.alpha * R * T_END * 0.97], { color: C.gold, align: 'right', dy: 12 });
    dot(P, c.t, c.vNow, { color: C.yellow, r: 5 });
  },
  law: () => [String.raw`a=g\sin\theta/(1+k_G^2/R^2)`],
  liveRows(state, c) {
    const motion = c.mode === 'roll' ? 'rolls' : 'slips';
    return [
      kv('a', `${fig(c.a)} m/s²`),
      kv('f', `${fig(c.f)} N`),
      kv('motion', motion),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['a', fig(c.a)],
      ['f N', fig(c.f)],
      ['motion', c.mode === 'roll' ? 'rolls' : 'slips'],
    ]);
  },
  coach(state, c) {
    const motion = c.mode === 'roll' ? 'rolls' : 'slips';
    if (c.mode === 'roll') {
      return {
        title: 'Friction is enough',
        body: `It ${motion}. a is ${fig(c.a)} m/s². Friction is ${fig(c.f)} N, and the incline needs μ of at least ${fig(c.muMin)}. After 1 m the speed is ${fig(c.v)} m/s.`,
      };
    }
    return {
      title: 'Friction is at its limit',
      body: `It ${motion}. a is ${fig(c.a)} m/s². Friction is ${fig(c.f)} N, which is μN. Rolling would need μ of ${fig(c.muMin)}.`,
    };
  },
});