import { G } from '@flux/subjects/mechanics/constants.js';
import { collarPath } from '@flux/subjects/mechanics/energy.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, chartIn, circle, dot, hidden, label, line, sceneIn, seg, split, vec } from './diagram.js';
import { defineLab } from './define2d.js';
import { PLAY, advance } from './motion.js';
import { bindSlider, showField, slider } from './widgets.js';

const SCENARIOS = [
  {
    id: 'smooth',
    name: 'Spring and gravity',
    mass: 2,
    k: 80,
    theta: 30,
    mu: 0,
    x1: 0.5,
    x2: 0,
    xFar: 0.75,
    v1: 0,
  },
  {
    id: 'rough',
    name: 'The same slide with friction',
    mass: 2,
    k: 80,
    theta: 30,
    mu: 0.2,
    x1: 0.5,
    x2: 0,
    xFar: 0.75,
    v1: 0,
  },
  {
    id: 'return',
    name: 'Out and back to the same stretch',
    mass: 2,
    k: 50,
    theta: 25,
    mu: 0.2,
    x1: 0.2,
    x2: 0.2,
    xFar: 0.6,
    v1: 4,
  },
];


function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  state.mass = sc.mass;
  state.k = sc.k;
  state.theta = sc.theta;
  state.mu = sc.mu;
  state.x1 = sc.x1;
  state.x2 = sc.x2;
  state.xFar = sc.xFar;
  state.v1 = sc.v1;
  state.p = 0;
  state.anim = { playing: false };
  state.show = { play: false };
}

/**
 * Work and energy on a collar (Hibbeler §14.2–14.3): a collar slides on an inclined rod, pulled by a
 * spring anchored at the rod's top. Shows that the spring's work depends only on the two end
 * stretches, while friction's grows with every metre travelled, so an out-and-back detour costs
 * friction work but no spring work. Play runs the collar along its route.
 *
 * Recompute: T₁ + ΣU = T₂ with each work in closed form. Check: a = g sin θ − (k/m)x − μ g cos θ
 * integrated along the rod.
 */

function basis(theta) {
  const th = (theta * Math.PI) / 180;
  return { ux: Math.cos(th), uy: -Math.sin(th), nx: Math.sin(th), ny: Math.cos(th) };
}

function at(x, b) {
  return { x: x * b.ux, y: x * b.uy };
}

function pointsFor(state) {
  if (state.scenarioId === 'return') return [state.x1, state.xFar, state.x2];
  return [state.x1, state.x2];
}

/** Where the collar is at a fraction p of its route's length, and the length so far. */
function along(points, p) {
  const legs = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    legs.push(Math.abs(points[i + 1] - points[i]));
    total += legs[i];
  }
  let left = Math.min(Math.max(p, 0), 1) * total;
  for (let i = 0; i < legs.length; i++) {
    if (left <= legs[i] || i === legs.length - 1) {
      const f = legs[i] > 0 ? Math.min(left / legs[i], 1) : 1;
      return { x: points[i] + (points[i + 1] - points[i]) * f, run: Math.min(p, 1) * total, dir: Math.sign(points[i + 1] - points[i]) || 1, total };
    }
    left -= legs[i];
  }
  return { x: points[points.length - 1], run: total, dir: 1, total };
}

/** Midpoint integration of a = g sinθ − (k/m) x − μ g cosθ along the rod. */
function integratedSpeed(state, points) {
  const steps = 800;
  const th = (state.theta * Math.PI) / 180;
  const sin = Math.sin(th);
  const cos = Math.cos(th);
  let v2 = state.v1 * state.v1;
  for (let leg = 0; leg < points.length - 1; leg++) {
    const x1 = points[leg];
    const x2 = points[leg + 1];
    const dir = Math.sign(x2 - x1) || 1;
    const dx = (x2 - x1) / steps;
    for (let i = 0; i < steps; i++) {
      const x = x1 + (i + 0.5) * dx;
      const a = G * sin - (state.k / state.mass) * x - state.mu * G * cos * dir;
      v2 += 2 * a * dx;
      if (v2 < -1e-8) return 0;
    }
  }
  return Math.sqrt(Math.max(0, v2));
}

function springLine(x0, x1, b, coils = 7) {
  const pts = [];
  const n = coils * 2;
  for (let i = 0; i <= n; i++) {
    const u = n === 0 ? 0 : i / n;
    const x = x0 + (x1 - x0) * u;
    const side = i === 0 || i === n ? 0 : (i % 2 === 0 ? -0.035 : 0.035);
    const p = at(x, b);
    pts.push([p.x + side * b.nx, p.y + side * b.ny]);
  }
  return pts;
}

export default defineLab({
  id: 'collar',
  exam: 'u3',
  title: 'Collar',
  app: false,
  gapLimit: 1e-3,
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  sweep: () => ({ key: 'x2', lo: 0, hi: 0.8 }),
  hint: 'Change the end stretch. The spring work uses only the two end stretches.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('smooth', s);
    return s;
  },
  applyScenario: apply,
  controls() {
    return `
      ${slider('co-mass', 'mass (kg)', 2, 0.5, 6, 0.1)}
      ${slider('co-k', 'k (N/m)', 80, 10, 140, 1)}
      ${slider('co-theta', 'θ (deg)', 30, 0, 50, 1)}
      ${slider('co-mu', 'μₖ', 0, 0, 0.6, 0.01)}
      ${slider('co-x1', 'start (m)', 0.5, 0, 0.8, 0.01)}
      ${slider('co-x2', 'end (m)', 0, 0, 0.8, 0.01)}
      ${slider('co-xfar', 'detour (m)', 0.6, 0, 1, 0.01)}
      ${slider('co-v1', 'v₁ (m/s)', 0, 0, 6, 0.1)}
      <p class="tiny">Grey is weight, gold is the spring, teal is the rod's push, pink is friction. x is down the rod from the unstretched point. Play runs the collar along its route; the chart books every work against the distance travelled.</p>`;
  },
  bind(api) {
    bindSlider('co-mass', (s, v) => { s.mass = v; }, api);
    bindSlider('co-k', (s, v) => { s.k = v; }, api);
    bindSlider('co-theta', (s, v) => { s.theta = v; }, api);
    bindSlider('co-mu', (s, v) => { s.mu = v; }, api);
    bindSlider('co-x1', (s, v) => { s.x1 = v; }, api);
    bindSlider('co-x2', (s, v) => { s.x2 = v; }, api);
    bindSlider('co-xfar', (s, v) => { s.xFar = v; }, api);
    bindSlider('co-v1', (s, v) => { s.v1 = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('co-mass', state.mass);
    set('co-k', state.k);
    set('co-theta', state.theta);
    set('co-mu', state.mu);
    set('co-x1', state.x1);
    set('co-x2', state.x2);
    set('co-xfar', state.xFar);
    set('co-v1', state.v1);
    showField('co-xfar', state.scenarioId === 'return');
  },
  tick(dt, state) {
    return advance(state, dt, { lo: 0, hi: 1.15, rate: 0.35, key: 'p' });
  },
  compute(state) {
    const computed = {};
    const points = pointsFor(state);
    const row = collarPath({
      mass: state.mass,
      k: state.k,
      thetaDeg: state.theta,
      points,
      v1: state.v1,
      mu: state.mu,
      g: G,
    });
    const speed = integratedSpeed(state, points);
    Object.assign(computed, {
      speed: row.speed,
      spring: row.spring,
      gravity: row.gravity,
      friction: row.friction,
      direct: row.direct,
      normal: row.normal,
      reaches: row.reaches ? 1 : 0,
      gap: Math.abs(row.speed - speed) / Math.max(1, Math.abs(row.speed)),
    });
    // The energy books along the route, by distance travelled.
    const th = (state.theta * Math.PI) / 180;
    const book = (x, run) => {
      const Us = 0.5 * state.k * (state.x1 * state.x1 - x * x);
      const Ug = state.mass * G * Math.sin(th) * (x - state.x1);
      const Uf = -state.mu * state.mass * G * Math.cos(th) * run;
      return { Us, Ug, Uf, T: 0.5 * state.mass * state.v1 * state.v1 + Us + Ug + Uf };
    };
    const n = 80;
    computed.books = Array.from({ length: n + 1 }, (_, i) => {
      const q = along(points, i / n);
      return { run: q.run, ...book(q.x, q.run) };
    });
    const now = along(points, Math.min(state.p || 0, 1));
    computed.now = { x: now.x, run: now.run, dir: now.dir, ...book(now.x, now.run) };
    computed.total = now.total;
    return computed;
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [left, right] = veiled ? [B.free, null] : split(B.free, 0.5);
    const b = basis(state.theta);
    const end = at(1.05, b);
    const S = sceneIn(B, left, { x0: -0.25, x1: Math.max(end.x, 0.4) + 0.25, y0: Math.min(end.y, 0) - 0.35, y1: 0.35 });
    // The rod, the wall that anchors the spring at x = 0, and the route's end marks.
    seg(S, [at(-0.02, b).x, at(-0.02, b).y], [end.x, end.y], { color: alpha(C.teal, 0.8), width: 4 });
    const w = at(0, b);
    seg(S, [w.x - 0.12 * b.nx, w.y - 0.12 * b.ny], [w.x + 0.12 * b.nx, w.y + 0.12 * b.ny], { color: C.dim, width: 4 });
    const x = c.now.x;
    const P = at(x, b);
    line(S, springLine(0, x, b), { color: C.gold, width: 2 });
    for (const q of pointsFor(state)) {
      const m = at(q, b);
      dot(S, m.x, m.y, { color: alpha(C.text, 0.4), r: 3 });
    }
    circle(S, [P.x, P.y], 0.045, { stroke: C.text, width: 2.5, fill: alpha(C.text, 0.3) });
    // The free-body diagram at the collar, one scale.
    const N = c.normal;
    const f = state.mu * N;
    const big = Math.max(state.mass * G, Math.abs(state.k * x), N, 1);
    const k = (0.32 * S.k) / big;
    vec(S, [P.x, P.y], [0, -state.mass * G], k, { color: C.dim, label: 'W' });
    if (Math.abs(x) > 1e-6) vec(S, [P.x, P.y], [-state.k * x * b.ux, -state.k * x * b.uy], k, { color: C.gold, label: 'kx' });
    vec(S, [P.x, P.y], [N * b.nx, N * b.ny], k, { color: C.teal, label: 'N' });
    if (f > 1e-6) vec(S, [P.x, P.y], [-f * c.now.dir * b.ux, -f * c.now.dir * b.uy], k, { color: C.pink, label: 'f' });
    if (!veiled) label(S, `x = ${fig(x)} m, v = ${fig(Math.sqrt(Math.max(0, 2 * c.now.T / state.mass)))} m/s`, [-0.2, 0.3], { color: C.muted, align: 'left' });
    if (veiled) return;

    // T₁ + ΣU = T along the route: each work, and the kinetic energy that results.
    const vals = c.books.flatMap((q) => [q.T, q.Us, q.Ug, q.Uf]);
    const lo = Math.min(0, ...vals) * 1.15;
    const hi = Math.max(0.1, ...vals) * 1.15;
    const Pc = chartIn(B, right, { lo: 0, hi: Math.max(c.total, 1e-6) }, { lo, hi });
    axes(Pc, { xLabel: 'distance travelled along the rod (m)', yLabel: 'energy (J)' });
    line(Pc, [[0, 0], [c.total, 0]], { color: alpha(C.text, 0.35), width: 1 });
    const series = [['T', 'T', C.text, 2.6], ['Us', 'spring', C.gold, 1.8], ['Ug', 'gravity', C.dim, 1.8], ['Uf', 'friction', C.pink, 1.8]];
    for (const [key, name, color, width] of series) {
      if (key === 'Uf' && state.mu < 1e-9) continue;
      const pts = c.books.map((q) => [q.run, q[key]]);
      line(Pc, pts, { color, width });
      label(Pc, name, pts[pts.length - 1], { color, align: 'right', dx: -4, dy: -8 });
    }
    dot(Pc, c.now.run, c.now.T, { color: C.yellow, r: 5 });
  },
  law() {
    return [
      String.raw`T_1+\sum U_{1-2}=T_2`,
      String.raw`U_s=\dfrac{1}{2}k(s_1^2-s_2^2)`,
    ];
  },
  liveRows(state, c) {
    return [
      kv('$v_2$', `${fig(c.speed)} m/s`),
      kv('$U_s$', `${fig(c.spring)} J`),
      kv('$U_g$', `${fig(c.gravity)} J`),
      kv('$U_f$', `${fig(c.friction)} J`),
    ].join('');
  },
  readout(state, c) {
    if (state.scenarioId === 'return') {
      return cells([
        ['speed', `${fig(c.speed)} m/s`],
        ['spring', `${fig(c.spring)} J`],
        ['ends', `${fig(c.direct)} J`],
        ['friction', `${fig(c.friction)} J`],
      ]);
    }
    return cells([
      ['speed', `${fig(c.speed)} m/s`],
      ['spring', `${fig(c.spring)} J`],
      ['gravity', `${fig(c.gravity)} J`],
      ['friction', `${fig(c.friction)} J`],
    ]);
  },
  coach(state, c) {
    if (!c.reaches) {
      return {
        title: 'It does not reach the end',
        body: 'The works do not leave any kinetic energy. Shorten the climb, ease the friction, or add speed.',
      };
    }
    if (state.scenarioId === 'return') {
      return {
        title: 'The spring work uses the end stretches',
        body: String.raw`Along the detour, $U_s = ${fig(c.spring)}\ \mathrm{J}$. From the end stretches alone, $U_s = ${fig(c.direct)}\ \mathrm{J}$. Friction took ${fig(c.friction)} J.`,
      };
    }
    if (state.mu > 1e-9) {
      return {
        title: 'Friction takes energy off the slide',
        body: String.raw`The spring still does ${fig(c.spring)} J. Friction does ${fig(c.friction)} J, and the speed at the end is ${fig(c.speed)} m/s.`,
      };
    }
    return {
      title: 'Only the end stretches enter the spring work',
      body: String.raw`$U_s = \frac{1}{2}k(s_1^2-s_2^2) = ${fig(c.spring)}\ \mathrm{J}$. The speed at the end is ${fig(c.speed)} m/s.`,
    };
  },
});
