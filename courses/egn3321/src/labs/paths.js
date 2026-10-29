import { G } from '@flux/subjects/mechanics/constants.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, chartIn, dot, hidden, label, line, sceneIn, seg, split, vec } from './diagram.js';
import { defineLab } from './define2d.js';
import { PLAY, advance } from './motion.js';
import { archMotion, cornerMotion, lineMotion, pathReport } from './pathwork.js';
import { bindSlider, slider } from './widgets.js';

const SCENARIOS = [
  {
    id: 'smooth',
    name: 'Gravity and a spring',
    mass: 1.2,
    k: 20,
    mu: 0,
    rise: 0.35,
    ax: 0.2,
    ay: 1,
    bx: 1.4,
    by: 0.4,
  },
  {
    id: 'rough',
    name: 'The same paths with friction',
    mass: 1.2,
    k: 20,
    mu: 0.25,
    rise: 0.35,
    ax: 0.2,
    ay: 1,
    bx: 1.4,
    by: 0.4,
  },
  {
    id: 'level',
    name: 'Ends at one height',
    mass: 1.2,
    k: 30,
    mu: 0,
    rise: 0.4,
    ax: 0.2,
    ay: 0.7,
    bx: 1.5,
    by: 0.7,
  },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  state.mass = sc.mass;
  state.k = sc.k;
  state.mu = sc.mu;
  state.rise = sc.rise;
  state.ax = sc.ax;
  state.ay = sc.ay;
  state.bx = sc.bx;
  state.by = sc.by;
  state.u = 0;
  state.anim = { playing: false };
  state.show = { play: false };
}

/**
 * Path independence (Hibbeler §14.5): one body carried from A to B three ways, straight, round a
 * corner, and over an arch, with gravity and a spring anchored at the origin. Shows that the
 * conservative works depend only on the ends, so all three paths agree, while friction's work grows
 * with the path's length and splits them. Play carries three copies along the three paths at once;
 * the chart books the work done so far on each.
 *
 * Recompute: U = −ΔV, plus friction over each path's length. Check: the work integrated along each
 * path (pathwork.js).
 */

function samples(motion, n = 40) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const p = motion(i / n);
    pts.push([p.x, p.y]);
  }
  return pts;
}

/** The work done so far along a path, by the weight, the spring and friction: −ΔV − μ m g s. */
function running(state, motion, n = 60) {
  const V = (p) => state.mass * G * p.y + 0.5 * state.k * (p.x * p.x + p.y * p.y);
  const A = motion(0);
  let s = 0;
  let prev = A;
  const out = [[0, 0]];
  for (let i = 1; i <= n; i++) {
    const p = motion(i / n);
    s += Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = p;
    out.push([i / n, V(A) - V(p) - state.mu * state.mass * G * s]);
  }
  return out;
}

export default defineLab({
  id: 'paths',
  exam: 'u3',
  title: 'Paths',
  app: false,
  gapLimit: 1e-3,
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  sweep: () => ({ key: 'rise', lo: 0, hi: 0.8 }),
  hint: 'Turn on friction. Only that work changes from path to path.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('smooth', s);
    return s;
  },
  applyScenario: apply,
  controls() {
    return `
      ${slider('pa-mass', 'mass (kg)', 1.2, 0.4, 4, 0.1)}
      ${slider('pa-k', 'k (N/m)', 20, 0, 80, 1)}
      ${slider('pa-mu', 'μₖ', 0, 0, 0.6, 0.01)}
      ${slider('pa-rise', 'arch rise (m)', 0.35, 0, 0.8, 0.01)}
      ${slider('pa-ay', 'start height (m)', 1, 0.2, 1.6, 0.05)}
      ${slider('pa-by', 'end height (m)', 0.4, 0.2, 1.6, 0.05)}
      <p class="tiny">White is straight, gold turns a corner, teal arches. The spring, anchored at the origin, pulls each body. Play carries all three from A to B at once; the chart books the work done so far on each.</p>`;
  },
  bind(api) {
    bindSlider('pa-mass', (s, v) => { s.mass = v; }, api);
    bindSlider('pa-k', (s, v) => { s.k = v; }, api);
    bindSlider('pa-mu', (s, v) => { s.mu = v; }, api);
    bindSlider('pa-rise', (s, v) => { s.rise = v; }, api);
    bindSlider('pa-ay', (s, v) => { s.ay = v; }, api);
    bindSlider('pa-by', (s, v) => { s.by = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('pa-mass', state.mass);
    set('pa-k', state.k);
    set('pa-mu', state.mu);
    set('pa-rise', state.rise);
    set('pa-ay', state.ay);
    set('pa-by', state.by);
  },
  tick(dt, state) {
    return advance(state, dt, { lo: 0, hi: 1.2, rate: 0.3, key: 'u' });
  },
  compute(state) {
    const row = pathReport({
      mass: state.mass,
      k: state.k,
      mu: state.mu,
      rise: state.rise,
      ax: state.ax,
      ay: state.ay,
      bx: state.bx,
      by: state.by,
      g: G,
    });
    const A = [state.ax, state.ay];
    const B = [state.bx, state.by];
    const motions = [lineMotion(A, B), cornerMotion(A, B), archMotion(A, B, state.rise)];
    return { ...row, books: motions.map((m) => running(state, m)), tracks: motions.map((m) => samples(m)) };
  },
  draw(canvas, state, c) {
    const B0 = begin(canvas);
    const veiled = hidden();
    const [left, right] = veiled ? [B0.free, null] : split(B0.free, 0.5);
    const A = [state.ax, state.ay];
    const B = [state.bx, state.by];
    const S = sceneIn(B0, left, { x0: -0.2, x1: Math.max(A[0], B[0]) + 0.3, y0: -0.15, y1: Math.max(A[1], B[1]) + state.rise + 0.25 });
    seg(S, [-0.2, 0], [Math.max(A[0], B[0]) + 0.3, 0], { color: alpha(C.text, 0.25), width: 1 });
    const colors = [C.text, C.gold, C.teal];
    const motions = [lineMotion(A, B), cornerMotion(A, B), archMotion(A, B, state.rise)];
    c.tracks.forEach((pts, i) => line(S, pts, { color: alpha(colors[i], 0.7), width: 2 }));
    dot(S, 0, 0, { color: C.dim, r: 5 });
    dot(S, A[0], A[1], { color: C.text, r: 5 });
    dot(S, B[0], B[1], { color: C.red, r: 5 });
    label(S, 'A', A, { color: C.text, dx: -10, dy: -10 });
    label(S, 'B', B, { color: C.red, dx: 10, dy: -10 });
    const u = Math.min(Number(state.u) || 0, 1);
    const big = Math.max(state.mass * G, state.k * Math.hypot(A[0], A[1]), 1);
    const k = (0.25 * S.k) / big;
    motions.forEach((m, i) => {
      const p = m(u);
      seg(S, [0, 0], [p.x, p.y], { color: alpha(C.gold, 0.35), width: 1, dash: [3, 3] });
      dot(S, p.x, p.y, { color: colors[i], r: 6 });
      if (i === 0) {
        // The forces on one body: its weight, and the spring's pull toward the anchor.
        vec(S, [p.x, p.y], [0, -state.mass * G], k, { color: C.dim, label: 'mg' });
        vec(S, [p.x, p.y], [-state.k * p.x, -state.k * p.y], k, { color: C.gold, label: 'ks' });
      }
    });
    if (veiled) return;

    // Work done so far on each path, against the fraction of the way travelled.
    const vals = c.books.flat().map((q) => q[1]);
    const lo = Math.min(0, ...vals) * 1.15 - 0.1;
    const hi = Math.max(0, ...vals) * 1.15 + 0.1;
    const P = chartIn(B0, right, { lo: 0, hi: 1 }, { lo, hi });
    axes(P, { xLabel: 'fraction of the way from A to B', yLabel: 'work done so far (J)' });
    line(P, [[0, 0], [1, 0]], { color: alpha(C.text, 0.35), width: 1 });
    line(P, [[0, c.potential], [1, c.potential]], { color: alpha(C.text, 0.4), width: 1, dash: [4, 4] });
    label(P, '−ΔV', [0.02, c.potential], { color: C.muted, align: 'left', dy: -8 });
    c.books.forEach((pts, i) => {
      line(P, pts, { color: colors[i], width: 2.2 });
      const here = pts[Math.round(u * (pts.length - 1))];
      dot(P, here[0], here[1], { color: colors[i], r: 4 });
    });
  },
  law() {
    return [String.raw`U=-\Delta V`, String.raw`U_f=-\mu mg\,s`];
  },
  liveRows(state, c) {
    return [
      kv('line', `${fig(c.workLine)} J`),
      kv('corner', `${fig(c.workCorner)} J`),
      kv('arch', `${fig(c.workArch)} J`),
      kv('$-\\Delta V$', `${fig(c.potential)} J`),
    ].join('');
  },
  readout(state, c) {
    void state;
    return cells([
      ['line', `${fig(c.workLine)} J`],
      ['corner', `${fig(c.workCorner)} J`],
      ['arch', `${fig(c.workArch)} J`],
      ['−ΔV', `${fig(c.potential)} J`],
    ]);
  },
  coach(state, c) {
    const same = Math.abs(c.workLine - c.workArch) < 0.05 && Math.abs(c.workLine - c.workCorner) < 0.05;
    if (state.mu > 1e-9) {
      return {
        title: same ? 'These paths happen to match' : 'Friction follows the length',
        body: String.raw`$-\Delta V = ${fig(c.potential)}\ \mathrm{J}$ on every path. Friction makes the arch ${fig(c.workArch)} J and the straight path ${fig(c.workLine)} J.`,
      };
    }
    if (Math.abs(state.ay - state.by) < 1e-9) {
      return {
        title: 'The weight does no work',
        body: String.raw`The ends share a height, so gravity drops out. The spring still does ${fig(c.potential)} J on every path.`,
      };
    }
    return {
      title: 'The path does not enter',
      body: String.raw`Straight, corner, and arch each do ${fig(c.workLine)} J. That is $-\Delta V$.`,
    };
  },
});
