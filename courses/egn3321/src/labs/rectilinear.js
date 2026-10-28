import {
  distanceByCrossings,
  integrateAbsSpeed,
  integratePieces,
  rk4Pieces,
} from '@flux/subjects/mechanics/path.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, chartIn, dot, hidden, label, line, poly, sceneIn, seg, vec } from './diagram.js';
import { defineLab } from './define2d.js';
import { PLAY, playing } from './motion.js';
import { bindSlider, showField, slider } from './widgets.js';

const SCENARIOS = [
  {
    id: 'brake',
    name: 'Braking through a stop',
    s0: 0,
    v0: 4,
    pieces: [{ t0: 0, t1: 5, coeff: [-2] }],
    t: 5,
  },
  {
    id: 'two',
    name: 'Two constant accelerations',
    s0: 0,
    v0: 1,
    pieces: [
      { t0: 0, t1: 2, coeff: [2] },
      { t0: 2, t1: 4, coeff: [-4] },
    ],
    t: 3,
  },
  {
    id: 'ramp',
    name: 'Acceleration linear in time',
    s0: 0,
    v0: 2,
    pieces: [{ t0: 0, t1: 4, coeff: [1, 0.5] }],
    t: 2,
  },
];

function clonePieces(pieces) {
  return pieces.map((p) => ({ t0: p.t0, t1: p.t1, coeff: [...p.coeff] }));
}

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  state.s0 = sc.s0;
  state.v0 = sc.v0;
  state.pieces = clonePieces(sc.pieces);
  state.t = sc.t;
  state.tEnd = sc.pieces[sc.pieces.length - 1].t1;
  state.anim = { playing: false };
  state.show = { play: false };
}

/**
 * Motion on a line (Hibbeler §12.2–12.3). Shows that velocity is the area under a–t and position the
 * area under v–t, with area below the axis counting negative, and that distance and displacement part
 * ways when the particle turns. Play runs the particle along its track above the three charts.
 *
 * Recompute: the pieces integrated in closed form. Check: RK4, and the distance by |v| integrated.
 */

export default defineLab({
  id: 'rectilinear',
  exam: 'u1',
  title: 'Rectilinear',
  app: false,
  gapLimit: 1e-4,
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  sweep: () => ({ key: 't', lo: 0, hi: 10 }),
  hint: 'Velocity is the area under a–t; position, the area under v–t. Play the particle.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('brake', s);
    return s;
  },
  applyScenario: apply,
  controls() {
    return `
      ${slider('rl-v0', 'v₀ (m/s)', 4, -12, 12, 0.5)}
      ${slider('rl-a1', 'a₁ (m/s²)', -2, -8, 8, 0.5)}
      ${slider('rl-jerk', 'jerk (m/s³)', 0, -3, 3, 0.1)}
      ${slider('rl-switch', 'switch time (s)', 2, 0.5, 8, 0.1)}
      ${slider('rl-a2', 'a₂ (m/s²)', -4, -8, 8, 0.5)}
      ${slider('rl-end', 'end time (s)', 5, 1, 10, 0.1)}
      ${slider('rl-t', 'probe time (s)', 5, 0, 10, 0.1)}
      <p class="tiny">Top, the particle on its track: white its velocity, pink its acceleration. Below, a, v and s against time, each in its own unit. The shaded area under a–t is the change in v so far; under v–t, the change in s. Play runs the probe.</p>`;
  },
  bind(api) {
    bindSlider('rl-v0', (s, v) => { s.v0 = v; }, api);
    bindSlider('rl-a1', (s, v) => { s.pieces[0].coeff[0] = v; }, api);
    bindSlider('rl-jerk', (s, v) => {
      s.pieces[0].coeff[1] = v;
    }, api);
    bindSlider('rl-switch', (s, v) => {
      if (s.pieces.length < 2) return;
      s.pieces[0].t1 = v;
      s.pieces[1].t0 = v;
      if (s.pieces[1].t1 < v + 0.2) s.pieces[1].t1 = v + 0.2;
      s.tEnd = s.pieces[1].t1;
    }, api);
    bindSlider('rl-a2', (s, v) => {
      if (s.pieces[1]) s.pieces[1].coeff[0] = v;
    }, api);
    bindSlider('rl-end', (s, v) => {
      const last = s.pieces[s.pieces.length - 1];
      const prev = s.pieces.length > 1 ? s.pieces[0].t1 : 0;
      last.t1 = Math.max(v, prev + 0.2);
      s.tEnd = last.t1;
      if (s.t > s.tEnd) s.t = s.tEnd;
    }, api);
    bindSlider('rl-t', (s, v) => { s.t = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    const two = state.pieces.length > 1;
    const jerk = state.pieces[0].coeff.length > 1;
    set('rl-v0', state.v0);
    set('rl-a1', state.pieces[0].coeff[0]);
    set('rl-jerk', state.pieces[0].coeff[1] || 0);
    set('rl-switch', two ? state.pieces[0].t1 : 0);
    set('rl-a2', two ? state.pieces[1].coeff[0] : 0);
    set('rl-end', state.tEnd);
    set('rl-t', state.t);
    showField('rl-jerk', jerk);
    showField('rl-switch', two);
    showField('rl-a2', two);
  },
  compute(state) {
    const tEnd = Math.max(state.tEnd, state.pieces[state.pieces.length - 1].t1, 1e-3);
    const t = Math.min(Math.max(state.t, 0), tEnd);
    const motion = integratePieces(state.pieces, state.s0, state.v0);
    const now = motion(t);
    const rk = rk4Pieces(state.pieces, state.s0, state.v0, t, 48);
    const distance = distanceByCrossings(motion, 0, tEnd);
    const trap = integrateAbsSpeed((u) => motion(u).v, 0, tEnd, 800);
    const n = 80;
    const ts = [];
    const ss = [];
    const vs = [];
    const as = [];
    for (let i = 0; i <= n; i++) {
      const u = (i / n) * tEnd;
      const row = motion(u);
      ts.push(u);
      ss.push(row.s);
      vs.push(row.v);
      as.push(row.a);
    }
    return {
      s: now.s,
      v: now.v,
      a: now.a,
      distance,
      displacement: motion(tEnd).s - state.s0,
      ts,
      ss,
      vs,
      as,
      t,
      tEnd,
      gap: Math.max(
        Math.abs(rk.s - now.s) / Math.max(1, Math.abs(now.s)),
        Math.abs(rk.v - now.v) / Math.max(1, Math.abs(now.v)),
        Math.abs(trap - distance) / Math.max(1, Math.abs(distance)),
      ),
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const H = B.free.y1 - B.free.y0;
    const trackH = Math.min(90, Math.max(64, 0.18 * H));
    const trackRect = { ...B.free, y1: B.free.y0 + trackH };
    // The track: the particle at s, with its velocity and acceleration.
    const lo = Math.min(0, ...c.ss) - 0.5;
    const hi = Math.max(0, ...c.ss) + 0.5;
    const span = hi - lo;
    const S = sceneIn(B, trackRect, { x0: lo, x1: hi, y0: -0.09 * span, y1: 0.09 * span });
    seg(S, [lo, 0], [hi, 0], { color: C.dim, width: 2 });
    seg(S, [0, -0.03 * span], [0, 0.03 * span], { color: C.text, width: 1.5 });
    label(S, '0', [0, -0.03 * span], { color: C.muted, dy: 10 });
    dot(S, c.s, 0, { color: C.yellow, r: 7 });
    const vMax = Math.max(1e-6, ...c.vs.map(Math.abs));
    const aMax = Math.max(1e-6, ...c.as.map(Math.abs));
    if (Math.abs(c.v) > 1e-6) vec(S, [c.s, 0.035 * span], [c.v, 0], (0.12 * span * S.k) / vMax, { color: C.text, label: 'v' });
    if (Math.abs(c.a) > 1e-6) vec(S, [c.s, -0.035 * span], [c.a, 0], (0.12 * span * S.k) / aMax, { color: C.pink, label: 'a' });
    if (veiled) return;

    // Three charts, one per quantity, sharing the time axis.
    const rest = { ...B.free, y0: trackRect.y1 };
    const all = [
      { ys: c.as, now: c.a, name: 'a (m/s²)', color: C.pink, shade: true },
      { ys: c.vs, now: c.v, name: 'v (m/s)', color: C.text, shade: true },
      { ys: c.ss, now: c.s, name: 's (m)', color: C.teal, shade: false },
    ];
    // On a short screen only v–t fits legibly; its shaded area is still the displacement.
    const rows = (rest.y1 - rest.y0) / 3 < 80 ? [all[1]] : all;
    const h3 = (rest.y1 - rest.y0) / rows.length;
    rows.forEach((row, i) => {
      const r = { ...rest, y0: rest.y0 + i * h3, y1: rest.y0 + (i + 1) * h3 };
      const m = Math.max(1e-6, ...row.ys.map(Math.abs)) * 1.15;
      const P = chartIn(B, r, { lo: 0, hi: c.tEnd }, { lo: -m, hi: m });
      axes(P, { xLabel: i === rows.length - 1 ? 'time (s)' : '', yLabel: row.name });
      line(P, [[0, 0], [c.tEnd, 0]], { color: alpha(C.text, 0.35), width: 1 });
      const pts = c.ts.map((t, j) => [t, row.ys[j]]);
      if (row.shade) {
        // The signed area up to the probe: Δv under a–t, Δs under v–t.
        const upto = pts.filter((q) => q[0] <= c.t + 1e-9);
        if (upto.length > 1) poly(P, [[upto[0][0], 0], ...upto, [upto[upto.length - 1][0], 0]], { fill: alpha(row.color, 0.18), stroke: null });
      }
      line(P, pts, { color: row.color, width: 2.2 });
      line(P, [[c.t, -m], [c.t, m]], { color: alpha(C.yellow, 0.5), width: 1, dash: [4, 4] });
      dot(P, c.t, row.now, { color: C.yellow, r: 4 });
    });
  },
  tick(dt, state) {
    if (!playing(state)) return false;
    state.t += dt;
    if (state.t > state.tEnd) state.t = 0;
    return true;
  },
  law: () => [String.raw`v=\dfrac{ds}{dt}`, String.raw`a=\dfrac{dv}{dt}`],
  liveRows(state, c) {
    return [
      kv('$s$', `${fig(c.s)} m`),
      kv('$v$', `${fig(c.v)} m/s`),
      kv('$a$', `${fig(c.a)} m/s²`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['position', `${fig(c.s)} m`],
      ['velocity', `${fig(c.v)} m/s`],
      ['acceleration', `${fig(c.a)} m/s²`],
      ['distance', `${fig(c.distance)} m`],
    ]);
  },
  coach(state, c) {
    const turned = c.distance - Math.abs(c.displacement) > 0.05;
    return {
      title: turned ? 'Distance and displacement split' : 'The areas are the changes',
      body: turned
        ? String.raw`The probe stops and comes back. The distance counts every metre, $${fig(c.distance)}\ \mathrm{m}$; the displacement nets it out, $${fig(c.displacement)}\ \mathrm{m}$.`
        : 'Velocity changes by the area under a–t, position by the area under v–t. Area below the time axis counts negative.',
    };
  },
});
