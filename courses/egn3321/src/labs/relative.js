import { relativeNumeric, relativeOf } from '@flux/subjects/mechanics/path.js';
import { v } from '@flux/subjects/mechanics/vectors.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, begin, dot, hidden, label, line, sceneIn, seg, vec } from './diagram.js';
import { defineLab } from './define2d.js';
import { PLAY, advance } from './motion.js';
import { bindSlider, slider } from './widgets.js';

const SCENARIOS = [
  {
    id: 'cross',
    name: 'Crossing paths',
    ax: -2, ay: 0, bx: 2, by: 1,
    vax: 3, vay: 1, vbx: 1, vby: 4,
    aax: 0, aay: 0, abx: 0, aby: 0,
  },
  {
    id: 'chase',
    name: 'B pulling ahead',
    ax: 0, ay: 0, bx: 3, by: 0.5,
    vax: 2, vay: 0, vbx: 4, vby: 0.5,
    aax: 0.5, aay: 0, abx: -0.5, aby: 0,
  },
  {
    id: 'fall',
    name: 'Both in gravity',
    ax: -1, ay: 2, bx: 2, by: 3,
    vax: 2, vay: 3, vbx: -1, vby: 1,
    aax: 0, aay: -9.81, abx: 0, aby: -9.81,
  },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  for (const key of ['ax', 'ay', 'bx', 'by', 'vax', 'vay', 'vbx', 'vby', 'aax', 'aay', 'abx', 'aby']) {
    state[key] = sc[key];
  }
  state.t = 0;
  state.anim = { playing: false };
  state.show = { play: false };
}

const T_END = 1.2;

/** Where a body is, and how fast, `t` seconds on. */
const at = (P, t) => ({
  x: P.r.x + P.v.x * t + 0.5 * P.a.x * t * t,
  y: P.r.y + P.v.y * t + 0.5 * P.a.y * t * t,
  vx: P.v.x + P.a.x * t,
  vy: P.v.y + P.a.y * t,
});

/**
 * Relative motion of two particles (Hibbeler §12.10). Shows that the velocity of B seen from A is a
 * difference, v_B/A = v_B − v_A, which can point where neither velocity does; and that two bodies
 * falling together see each other move in a straight line, because gravity cancels from a_B/A.
 * Two views of the same motion: the ground's, and A's, where A stands still.
 *
 * Recompute: the vector differences. Check: the relative position differentiated numerically.
 */

function body(state, prefix) {
  return {
    r: v(state[`${prefix}x`], state[`${prefix}y`], 0),
    v: v(state[`v${prefix}x`], state[`v${prefix}y`], 0),
    a: v(state[`a${prefix}x`], state[`a${prefix}y`], 0),
  };
}

export default defineLab({
  id: 'relative',
  exam: 'u1',
  title: 'Relative',
  app: false,
  gapLimit: 1e-4,
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  sweep: () => ({ key: 'vbx', lo: -8, hi: 8 }),
  hint: 'The relative velocity is a difference. It can point where neither velocity does.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('cross', s);
    return s;
  },
  applyScenario: apply,
  controls() {
    const row = (id, label, val) => slider(id, label, val, -8, 8, 0.5);
    return `
      ${row('rel-vax', 'v_Ax (m/s)', 3)}
      ${row('rel-vay', 'v_Ay (m/s)', 1)}
      ${row('rel-vbx', 'v_Bx (m/s)', 1)}
      ${row('rel-vby', 'v_By (m/s)', 4)}
      ${row('rel-ax', 'A x (m)', -2)}
      ${row('rel-ay', 'A y (m)', 0)}
      ${row('rel-bx', 'B x (m)', 2)}
      ${row('rel-by', 'B y (m)', 1)}
      <p class="tiny">Red is A, blue is B. Left, the ground's view; right, A's view, where A stands still and B moves at v_B/A, in gold. Below right, the triangle v_B = v_A + v_B/A. Play runs 1.2 s; the faint lines are the paths.</p>`;
  },
  bind(api) {
    const link = (id, key) => bindSlider(id, (s, val) => { s[key] = val; }, api);
    link('rel-vax', 'vax');
    link('rel-vay', 'vay');
    link('rel-vbx', 'vbx');
    link('rel-vby', 'vby');
    link('rel-ax', 'ax');
    link('rel-ay', 'ay');
    link('rel-bx', 'bx');
    link('rel-by', 'by');
  },
  syncControls(state) {
    for (const [id, key] of [
      ['rel-vax', 'vax'], ['rel-vay', 'vay'], ['rel-vbx', 'vbx'], ['rel-vby', 'vby'],
      ['rel-ax', 'ax'], ['rel-ay', 'ay'], ['rel-bx', 'bx'], ['rel-by', 'by'],
    ]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(state[key]);
    }
  },
  tick(dt, state) {
    return advance(state, dt, { lo: 0, hi: T_END, rate: 0.5 });
  },
  compute(state) {
    const computed = {};
    const A = body(state, 'a');
    const B = body(state, 'b');
    const rel = relativeOf(A, B);
    const t = 0.4;
    const path = (P) => (tt) => ({
      x: P.r.x + P.v.x * tt + 0.5 * P.a.x * tt * tt,
      y: P.r.y + P.v.y * tt + 0.5 * P.a.y * tt * tt,
      z: 0,
    });
    const num = relativeNumeric(path(A), path(B), t);
    const laterA = {
      r: path(A)(t),
      v: v(A.v.x + A.a.x * t, A.v.y + A.a.y * t, 0),
      a: A.a,
    };
    const laterB = {
      r: path(B)(t),
      v: v(B.v.x + B.a.x * t, B.v.y + B.a.y * t, 0),
      a: B.a,
    };
    const later = relativeOf(laterA, laterB);
    Object.assign(computed, {
      vx: rel.v.x,
      vy: rel.v.y,
      ax: rel.a.x,
      ay: rel.a.y,
      speed: Math.hypot(rel.v.x, rel.v.y),
      accel: Math.hypot(rel.a.x, rel.a.y),
      Ax: A.r.x,
      Ay: A.r.y,
      Bx: B.r.x,
      By: B.r.y,
      vA: A.v,
      vB: B.v,
      gap: Math.max(
        Math.abs(num.v.x - later.v.x),
        Math.abs(num.v.y - later.v.y),
        Math.abs(num.a.x - later.a.x),
        Math.abs(num.a.y - later.a.y),
      ),
    });
    computed.A = A;
    computed.B = B;
    return computed;
  },
  draw(canvas, state, c) {
    const B0 = begin(canvas);
    const veiled = hidden();
    const W = B0.free.x1 - B0.free.x0;
    const H = B0.free.y1 - B0.free.y0;
    const wide = W > 1.3 * H;
    const half = wide ? (B0.free.x0 + B0.free.x1) / 2 : (B0.free.y0 + B0.free.y1) / 2;
    const ground = wide ? { ...B0.free, x1: half } : { ...B0.free, y1: half };
    const own = wide ? { ...B0.free, x0: half } : { ...B0.free, y0: half };
    const t = Math.min(Math.max(Number(state.t) || 0, 0), T_END);
    const samples = Array.from({ length: 41 }, (_, i) => (T_END * i) / 40);
    const pa = samples.map((u) => at(c.A, u));
    const pb = samples.map((u) => at(c.B, u));
    const a = at(c.A, t);
    const b = at(c.B, t);
    const vmax = Math.max(1, Math.hypot(a.vx, a.vy), Math.hypot(b.vx, b.vy), Math.hypot(b.vx - a.vx, b.vy - a.vy));
    const box = (pts, pad) => {
      const xs = pts.map((p) => p.x);
      const ys = pts.map((p) => p.y);
      return { x0: Math.min(...xs) - pad, x1: Math.max(...xs) + pad, y0: Math.min(...ys) - pad, y1: Math.max(...ys) + pad };
    };
    // The ground's view: both paths, both bodies, both velocities.
    const gBox = box([...pa, ...pb], 1.6);
    const S1 = sceneIn(B0, ground, gBox);
    const span1 = Math.max(gBox.x1 - gBox.x0, gBox.y1 - gBox.y0);
    line(S1, pa.map((p) => [p.x, p.y]), { color: alpha(C.red, 0.35), width: 1.5 });
    line(S1, pb.map((p) => [p.x, p.y]), { color: alpha(C.blue, 0.35), width: 1.5 });
    const k1 = (0.2 * span1 * S1.k) / vmax;
    vec(S1, [a.x, a.y], [a.vx, a.vy], k1, { color: C.text, label: 'v_A' });
    vec(S1, [b.x, b.y], [b.vx, b.vy], k1, { color: C.text, label: 'v_B' });
    dot(S1, a.x, a.y, { color: C.red, r: 6 });
    dot(S1, b.x, b.y, { color: C.blue, r: 6 });
    label(S1, 'the ground sees', [gBox.x0, gBox.y1], { color: C.muted, align: 'left', dy: 12 });
    // A's view: A fixed at the origin, B on its relative path.
    const rel = pb.map((p, i) => ({ x: p.x - pa[i].x, y: p.y - pa[i].y }));
    const rb = { x: b.x - a.x, y: b.y - a.y };
    const relBox = box([...rel, { x: 0, y: 0 }], 1.6);
    const S2 = sceneIn(B0, own, relBox);
    const span2 = Math.max(relBox.x1 - relBox.x0, relBox.y1 - relBox.y0);
    line(S2, rel.map((p) => [p.x, p.y]), { color: alpha(C.gold, 0.4), width: 1.5 });
    seg(S2, [0, 0], [rb.x, rb.y], { color: alpha(C.text, 0.3), width: 1, dash: [3, 4] });
    const k2 = (0.2 * span2 * S2.k) / vmax;
    vec(S2, [rb.x, rb.y], [b.vx - a.vx, b.vy - a.vy], k2, { color: C.gold, label: 'v_B/A' });
    dot(S2, 0, 0, { color: C.red, r: 6 });
    dot(S2, rb.x, rb.y, { color: C.blue, r: 6 });
    label(S2, 'A sees', [relBox.x0, relBox.y1], { color: C.muted, align: 'left', dy: 12 });
    if (veiled) return;
    // The vector triangle, tip to tail, in the corner of A's view: v_A then v_B/A makes v_B.
    const o = [relBox.x1 - 0.42 * (relBox.x1 - relBox.x0), relBox.y0 + 0.2 * (relBox.y1 - relBox.y0)];
    const kt = (0.16 * span2 * S2.k) / vmax;
    vec(S2, o, [a.vx, a.vy], kt, { color: C.red, width: 2 });
    const tip = [o[0] + (a.vx * kt) / S2.k, o[1] + (a.vy * kt) / S2.k];
    vec(S2, tip, [b.vx - a.vx, b.vy - a.vy], kt, { color: C.gold, width: 2 });
    vec(S2, o, [b.vx, b.vy], kt, { color: C.blue, width: 2, dash: [5, 4] });
    label(S2, 'v_A + v_B/A = v_B', o, { color: C.muted, align: 'left', dy: 14 });
  },
  law: () => [String.raw`\vec v_{B/A}=\vec v_B-\vec v_A`, String.raw`\vec a_{B/A}=\vec a_B-\vec a_A`],
  liveRows(state, c) {
    return [
      kv('$v_{B/A,x}$', `${fig(c.vx)} m/s`),
      kv('$v_{B/A,y}$', `${fig(c.vy)} m/s`),
      kv('$|v_{B/A}|$', `${fig(c.speed)} m/s`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['v_x rel', `${fig(c.vx)} m/s`],
      ['v_y rel', `${fig(c.vy)} m/s`],
      ['speed rel', `${fig(c.speed)} m/s`],
      ['|a| rel', `${fig(c.accel)} m/s²`],
    ]);
  },
  coach(state, c) {
    return {
      title: 'Subtract the vectors',
      body: String.raw`Seen from A, B moves at $${fig(c.vx)}\,\hat{\imath} + ${fig(c.vy)}\,\hat{\jmath}$ m/s. That direction is neither v_A nor v_B. It is the motion A actually watches: the gap between them opening, closing, or swinging sideways. Ride with A, and every velocity in the scene drops by v_A. B keeps only the motion the two do not share.`,
    };
  },
});
