import { impulse, impulseRamp } from '@flux/subjects/mechanics/momentum.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, chartIn, dot, hidden, label, line, poly, sceneIn, seg, vec } from './diagram.js';
import { defineLab } from './define2d.js';
import { PLAY, advance } from './motion.js';
import { bindSlider, showField, slider } from './widgets.js';

const SCENARIOS = [
  {
    id: 'pair',
    name: 'Equal areas',
    mass: 2,
    v0: 0,
    f1: 100,
    s1: 0,
    t1: 0.4,
    f2: 40,
    t2: 1,
  },
  {
    id: 'short',
    name: 'A short pulse',
    mass: 2,
    v0: 0,
    f1: 400,
    s1: 0,
    t1: 0.1,
    f2: 20,
    t2: 1,
  },
  {
    id: 'ramp',
    name: 'A rising force',
    mass: 4,
    v0: 0,
    f1: 10,
    s1: 30,
    t1: 2,
    f2: 0,
    t2: 0,
  },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  state.mass = sc.mass;
  state.v0 = sc.v0;
  state.f1 = sc.f1;
  state.s1 = sc.s1;
  state.t1 = sc.t1;
  state.f2 = sc.f2;
  state.t2 = sc.t2;
  state.t = 0;
  state.anim = { playing: false };
  state.show = { play: false };
}

/**
 * Linear impulse and momentum (Hibbeler §15.1): a force on a block, as two pieces in time. Shows that
 * the change in speed is the area under F–t, whatever the shape: a short hard push and a long gentle
 * one with the same area give the same Δv. Play runs the push on the block, with the area filling in
 * and the speed rising by it.
 *
 * Recompute: each piece's area in closed form. Check: m dv/dt = F integrated by the midpoint rule.
 */

const forceAt = (state, t) => (t < 0 ? 0 : t <= state.t1 ? state.f1 + state.s1 * t : t <= state.t1 + state.t2 ? state.f2 : 0);
/** The speed and position at t, by the areas so far. */
function stateAt(state, t) {
  const m = Math.max(state.mass, 1e-9);
  const a1 = Math.min(Math.max(t, 0), state.t1);
  const a2 = Math.min(Math.max(t - state.t1, 0), state.t2);
  const J = state.f1 * a1 + 0.5 * state.s1 * a1 * a1 + state.f2 * a2;
  return { v: state.v0 + J / m, J };
}

/** Midpoint integration of m dv/dt = F, split at the break so each piece is linear. */
function integratedSpeed(state) {
  if (!(state.mass > 0)) return state.v0;
  const steps = 2000;
  let v = state.v0;
  const legs = [
    [0, state.t1, (t) => state.f1 + state.s1 * t],
    [state.t1, state.t1 + state.t2, () => state.f2],
  ];
  for (const [t0, t1, force] of legs) {
    if (!(t1 > t0)) continue;
    const dt = (t1 - t0) / steps;
    for (let i = 0; i < steps; i++) {
      const t = t0 + (i + 0.5) * dt;
      v += (force(t) / state.mass) * dt;
    }
  }
  return v;
}

function areas(state) {
  const j1 = impulseRamp(state.f1, state.s1, 0, state.t1);
  const j2 = impulse(state.f2, state.t2);
  const J = j1 + j2;
  const dv = J / state.mass;
  return { j1, j2, J, dv, v: state.v0 + dv };
}

function graph(state) {
  const tmax = Math.max(state.t1 + state.t2, 0.2);
  const samples = [0, state.f1, state.f1 + state.s1 * state.t1, state.f2];
  const hi = Math.max(1, ...samples);
  const lo = Math.min(0, ...samples);
  const span = Math.max(hi - lo, 1);
  const mapX = (t) => -2.15 + (t / tmax) * 4.3;
  const mapY = (F) => -1.05 + ((F - lo) / span) * 2.45;
  const pts = [];
  const n = 24;
  for (let i = 0; i <= n; i++) {
    const t = state.t1 * (i / n);
    pts.push({ x: mapX(t), y: mapY(state.f1 + state.s1 * t) });
  }
  if (state.t2 > 0) {
    pts.push({ x: mapX(state.t1), y: mapY(state.f2) });
    pts.push({ x: mapX(state.t1 + state.t2), y: mapY(state.f2) });
  }
  const y0 = mapY(0);
  return {
    pts,
    axis: [{ x: mapX(0), y: y0 }, { x: mapX(tmax), y: y0 }],
    upright: [{ x: mapX(0), y: mapY(lo) }, { x: mapX(0), y: mapY(hi) }],
    brk: [{ x: mapX(state.t1), y: y0 }, { x: mapX(state.t1), y: mapY(hi) }],
  };
}

export default defineLab({
  id: 'impulse',
  exam: 'u4',
  title: 'Impulse',
  app: false,
  gapLimit: 1e-3,
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  sweep: () => ({ key: 'f1', lo: 0, hi: 500 }),
  hint: 'Two shapes with the same area give the same change in speed.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('pair', s);
    return s;
  },
  applyScenario: apply,
  controls() {
    return `
      ${slider('im-mass', 'mass (kg)', 2, 0.5, 8, 0.1)}
      ${slider('im-v0', 'v₀ (m/s)', 0, -4, 8, 0.1)}
      ${slider('im-f1', 'F₁ (N)', 100, 0, 500, 1)}
      ${slider('im-t1', 't₁ (s)', 0.4, 0.05, 3, 0.05)}
      ${slider('im-s1', 'slope (N/s)', 0, -20, 80, 1)}
      ${slider('im-f2', 'F₂ (N)', 40, 0, 200, 1)}
      ${slider('im-t2', 't₂ (s)', 1, 0, 3, 0.05)}
      <p class="tiny">Gold is the first piece of the force, teal the second; their shaded areas are the impulses. White is the block's speed. Play runs the push.</p>`;
  },
  bind(api) {
    bindSlider('im-mass', (s, v) => { s.mass = v; }, api);
    bindSlider('im-v0', (s, v) => { s.v0 = v; }, api);
    bindSlider('im-f1', (s, v) => { s.f1 = v; }, api);
    bindSlider('im-t1', (s, v) => { s.t1 = v; }, api);
    bindSlider('im-s1', (s, v) => { s.s1 = v; }, api);
    bindSlider('im-f2', (s, v) => { s.f2 = v; }, api);
    bindSlider('im-t2', (s, v) => { s.t2 = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('im-mass', state.mass);
    set('im-v0', state.v0);
    set('im-f1', state.f1);
    set('im-t1', state.t1);
    set('im-s1', state.s1);
    set('im-f2', state.f2);
    set('im-t2', state.t2);
    const ramp = state.scenarioId === 'ramp';
    showField('im-s1', ramp);
    showField('im-f2', !ramp);
    showField('im-t2', !ramp);
  },
  tick(dt, state) {
    return advance(state, dt, { lo: 0, hi: Math.max(state.t1 + state.t2, 0.2) * 1.2, rate: 0.5 });
  },
  compute(state) {
    if (!(state.mass > 0)) return { j1: 0, j2: 0, J: 0, dv: 0, v: state.v0 || 0, gap: 0 };
    const row = areas(state);
    const speed = integratedSpeed(state);
    return { ...row, gap: Math.abs(row.v - speed) / Math.max(1, Math.abs(row.v)) };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const T = Math.max(state.t1 + state.t2, 0.2) * 1.2;
    const t = Math.min(Math.max(Number(state.t) || 0, 0), T);
    const now = stateAt(state, t);
    const H = B.free.y1 - B.free.y0;
    const trackRect = { ...B.free, y1: B.free.y0 + Math.min(120, 0.24 * H) };
    // The block, pushed by the force, carrying its speed.
    const S = sceneIn(B, trackRect, { x0: -0.2, x1: 4.2, y0: -0.12, y1: 0.75 });
    seg(S, [-0.2, 0], [4.2, 0], { color: C.dim, width: 2 });
    const xb = 0.3 + (3.4 * t) / T;
    poly(S, [[xb - 0.2, 0], [xb + 0.2, 0], [xb + 0.2, 0.32], [xb - 0.2, 0.32]], { fill: alpha(C.blue, 0.35), stroke: C.blue, width: 1.5 });
    const Fnow = forceAt(state, t);
    const Fmax = Math.max(1, state.f1, state.f1 + state.s1 * state.t1, state.f2);
    if (Fnow > 1e-9) vec(S, [xb - 0.2 - (0.5 * Fnow) / Fmax, 0.16], [Fnow, 0], (0.5 * S.k) / Fmax, { color: t <= state.t1 ? C.gold : C.teal, label: 'F' });
    const vMax = Math.max(1, Math.abs(c.v), Math.abs(state.v0));
    if (Math.abs(now.v) > 1e-9) vec(S, [xb, 0.45], [now.v, 0], (0.9 * S.k) / vMax, { color: C.text, label: veiled ? 'v' : `${fig(now.v)} m/s` });
    if (veiled) return;

    const rest = { ...B.free, y0: trackRect.y1 };
    const mid = (rest.y0 + rest.y1) / 2;
    // F–t: each piece's area shaded up to the cursor.
    const Ftop = Fmax * 1.15;
    const P1 = chartIn(B, { ...rest, y1: mid }, { lo: 0, hi: T }, { lo: Math.min(0, state.f1 + state.s1 * state.t1) * 1.1, hi: Ftop });
    axes(P1, { xLabel: '', yLabel: 'force F (N)' });
    const piece1 = Array.from({ length: 31 }, (_, i) => {
      const u = (state.t1 * i) / 30;
      return [u, state.f1 + state.s1 * u];
    });
    const filled1 = piece1.filter((q) => q[0] <= t + 1e-9);
    if (filled1.length > 1) poly(P1, [[0, 0], ...filled1, [filled1[filled1.length - 1][0], 0]], { fill: alpha(C.gold, 0.3), stroke: null });
    if (state.t2 > 0 && t > state.t1) poly(P1, [[state.t1, 0], [state.t1, state.f2], [Math.min(t, state.t1 + state.t2), state.f2], [Math.min(t, state.t1 + state.t2), 0]], { fill: alpha(C.teal, 0.3), stroke: null });
    line(P1, piece1, { color: C.gold, width: 2.5 });
    if (state.t2 > 0) line(P1, [[state.t1, state.f2], [state.t1 + state.t2, state.f2]], { color: C.teal, width: 2.5 });
    line(P1, [[t, 0], [t, Ftop]], { color: alpha(C.yellow, 0.5), width: 1, dash: [4, 4] });
    label(P1, `J₁ = ${fig(c.j1)} N·s`, [state.t1 / 2, Ftop * 0.92], { color: C.gold });
    if (state.t2 > 0) label(P1, `J₂ = ${fig(c.j2)} N·s`, [state.t1 + state.t2 / 2, Ftop * 0.92], { color: C.teal });
    // v–t: the speed rises by exactly the area so far.
    const vs = Array.from({ length: 61 }, (_, i) => {
      const u = (T * i) / 60;
      return [u, stateAt(state, u).v];
    });
    const vlo = Math.min(0, ...vs.map((q) => q[1])) * 1.1;
    const vhi = Math.max(0.5, ...vs.map((q) => q[1])) * 1.1;
    const P2 = chartIn(B, { ...rest, y0: mid }, { lo: 0, hi: T }, { lo: vlo, hi: vhi });
    axes(P2, { xLabel: 'time (s)', yLabel: 'speed v (m/s)' });
    line(P2, vs, { color: C.text, width: 2.5 });
    dot(P2, t, now.v, { color: C.yellow, r: 5 });
  },
  law() {
    return [
      String.raw`\int F\,dt=m\Delta v`,
      String.raw`J=J_1+J_2`,
    ];
  },
  liveRows(state, c) {
    return [
      kv('$J_1$', `${fig(c.j1)} N·s`),
      kv('$J_2$', `${fig(c.j2)} N·s`),
      kv('$\\Delta v$', `${fig(c.dv)} m/s`),
      kv('$v$', `${fig(c.v)} m/s`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['J₁', `${fig(c.j1)} N·s`],
      ['J₂', `${fig(c.j2)} N·s`],
      ['Δv', `${fig(c.dv)} m/s`],
      ['speed', `${fig(c.v)} m/s`],
    ]);
  },
  coach(state, c) {
    const same = Math.abs(c.j1 - c.j2) <= 0.02 * Math.max(1, Math.abs(c.j1));
    if (same) {
      return {
        title: 'The two shapes share one change in speed',
        body: String.raw`Each area is ${fig(c.j1)} N·s. Together they change the speed by ${fig(c.dv)} m/s.`,
      };
    }
    return {
      title: 'The area sets the change in speed',
      body: String.raw`The first area is ${fig(c.j1)} N·s. The second is ${fig(c.j2)} N·s. The speed changes by ${fig(c.dv)} m/s.`,
    };
  },
});
