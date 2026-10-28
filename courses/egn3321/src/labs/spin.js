import { spinChange, spinChangeByForces } from '@flux/subjects/mechanics/rigid-momentum.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, chartIn, circle, dot, hidden, label, line, note, sceneIn, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { PLAY, playing } from './motion.js';
import { bindSlider, slider } from './widgets.js';

/**
 * Shows that angular momentum is kept while kinetic energy is not. Two masses on a freely turning
 * body are pulled in. Nothing torques the system about its axis, so H = Iω stays the same, and ω
 * rises as I falls (Hibbeler §19.3). The kinetic energy H²/2I rises with it: the pull on the masses
 * does that work. Halve the radius of masses on a light rod and ω grows four times, not twice.
 *
 * Recompute: I₁ω₁ = I₂ω₂. Check: the forces alone, integrated in time. Each mass needs a sideways
 * push m(rω̇ + 2ṙω) from its arm, and pushes the body back (spinChangeByForces).
 */
const SCENARIOS = [
  { id: 'skater', name: 'On a turntable, pulling in two 2 kg weights', I0: 2, m: 2, r1: 0.8, r: 0.8, w1: 3, rEnd: 0.2 },
  { id: 'chair', name: 'Office chair, weights already pulled in', I0: 3, m: 3, r1: 0.7, r: 0.15, w1: 2, rEnd: 0.15 },
  { id: 'masses', name: 'Two 1 kg masses on a light rod', I0: 0.001, m: 1, r1: 0.8, r: 0.8, w1: 2, rEnd: 0.4 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  const { name, id: scId, ...rest } = sc;
  void name;
  Object.assign(state, { scenarioId: scId, anim: { playing: false }, show: { play: false }, ang: 0, q: 0, ...rest });
}

const smooth = (q) => 0.5 - 0.5 * Math.cos(Math.PI * q);

export default defineLab({
  id: 'spin',
  exam: 'u8',
  title: 'Spin',
  app: false,
  gapLimit: 1e-6,
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  hint: 'Pull the masses in: H = Iω stays, ω rises, and so does the kinetic energy.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('skater', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'r', lo: 0.05, hi: 1 }),
  controls() {
    return `
      ${slider('sp-I0', 'body’s own I₀ (kg·m²)', 2, 0.001, 6, 0.05)}
      ${slider('sp-m', 'each mass m (kg)', 2, 0.5, 5, 0.25)}
      ${slider('sp-r1', 'start radius r₁ (m)', 0.8, 0.1, 1, 0.05)}
      ${slider('sp-w1', 'start rate ω₁ (rad/s)', 3, 0.5, 8, 0.1)}
      ${slider('sp-r', 'radius now r (m)', 0.8, 0.05, 1, 0.01)}
      <p class="tiny">Play pulls the masses in and lets them out again. Yellow is the axis. The chart shows H (teal), I (dashed) and ω with the kinetic energy (gold) as multiples of their starting values.</p>`;
  },
  bind(api) {
    bindSlider('sp-I0', (s, v) => { s.I0 = v; }, api);
    bindSlider('sp-m', (s, v) => { s.m = v; }, api);
    bindSlider('sp-r1', (s, v) => { s.r1 = v; }, api);
    bindSlider('sp-w1', (s, v) => { s.w1 = v; }, api);
    bindSlider('sp-r', (s, v) => { s.r = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('sp-I0', state.I0);
    set('sp-m', state.m);
    set('sp-r1', state.r1);
    set('sp-w1', state.w1);
    set('sp-r', Number(state.r.toFixed(2)));
  },
  tick(dt, state) {
    // The drawing turns at the lab's own ω; while playing, the masses go in and out over 6 s.
    const w = spinChange({ I0: state.I0, m: state.m, r1: state.r1, r2: state.r, w1: state.w1 }).w2;
    state.ang = ((state.ang ?? 0) + 0.25 * w * dt) % (2 * Math.PI);
    if (playing(state)) {
      state.q = ((state.q ?? 0) + dt / 6) % 1;
      const k = smooth(state.q < 0.5 ? 2 * state.q : 2 - 2 * state.q);
      const target = state.rEnd ?? 0.2;
      state.r = state.r1 + (target - state.r1) * k;
    }
    return true;
  },
  compute(state) {
    const c = spinChange({ I0: state.I0, m: state.m, r1: state.r1, r2: state.r, w1: state.w1 });
    const f = spinChangeByForces({ I0: state.I0, m: state.m, r1: state.r1, r2: state.r, w1: state.w1, steps: 600 });
    const lo = Math.min(state.r1, state.r, 0.05);
    const hi = Math.max(state.r1, state.r, 1);
    const series = Array.from({ length: 81 }, (_, i) => {
      const r = lo + ((hi - lo) * i) / 80;
      const p = spinChange({ I0: state.I0, m: state.m, r1: state.r1, r2: r, w1: state.w1 });
      return { r, w: p.w2 / state.w1, T: p.T2 / p.T1, I: p.I2 / p.I1 };
    });
    return {
      ...c,
      w1: state.w1,
      wForces: f.w2,
      ratioW: c.w2 / state.w1,
      ratioT: c.T2 / c.T1,
      series,
      lo,
      hi,
      gap: Math.abs(f.w2 - c.w2) / Math.max(1e-9, c.w2),
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [left, right] = veiled ? [B.free, null] : split(B.free, 0.5);
    const S = sceneIn(B, left, { x0: -1.15, x1: 1.15, y0: -1.15, y1: 1.15 });
    // The body seen from above, turning; its own inertia drawn as a disk of matching size.
    const body = Math.min(0.5, 0.12 + 0.12 * Math.sqrt(state.I0));
    circle(S, [0, 0], body, { stroke: alpha(C.text, 0.6), fill: alpha(C.text, 0.08), width: 1.5 });
    const a = state.ang ?? 0;
    const ux = Math.cos(a);
    const uy = Math.sin(a);
    seg(S, [-body * uy, body * ux], [body * uy, -body * ux], { color: alpha(C.text, 0.4), width: 1 });
    for (const sgn of [1, -1]) {
      const p = [sgn * state.r * ux, sgn * state.r * uy];
      seg(S, [0, 0], p, { color: C.text, width: 2 });
      circle(S, p, 0.04 + 0.025 * Math.sqrt(state.m), { stroke: C.red, fill: alpha(C.red, 0.5), width: 1.5 });
      circle(S, [sgn * state.r1 * ux, sgn * state.r1 * uy], 0.03, { stroke: alpha(C.text, 0.25), width: 1, dash: [2, 3] });
    }
    dot(S, 0, 0, { color: C.yellow, r: 4 });
    // A turning arrow round the rim, longer as ω grows.
    const sweep = Math.min(2.6, 0.35 * c.w2);
    const R = 1.05;
    const pts = Array.from({ length: 30 }, (_, i) => {
      const t = a + 0.3 + (sweep * i) / 29;
      return [R * Math.cos(t), R * Math.sin(t)];
    });
    line(S, pts, { color: C.text, width: 2 });
    label(S, veiled ? 'ω' : `ω = ${fig(c.w2)} rad/s`, [0, -1.12], { color: C.text });
    if (veiled) return;

    // H, ω and T as multiples of their starting values, across the radius.
    const yMax = Math.max(2, ...c.series.map((p) => Math.max(p.w, p.T))) * 1.08;
    const P = chartIn(B, right, { lo: c.lo, hi: c.hi }, { lo: 0, hi: yMax });
    axes(P, { xLabel: 'radius of the masses r (m)', yLabel: '× start' });
    line(P, [[c.lo, 1], [c.hi, 1]], { color: C.teal, width: 2 });
    note(P, 'H', c.hi, 1, { color: C.teal, dx: -14, dy: -6 });
    // ω and T rise in the same ratio, I₁/I₂, so they share one curve; I itself falls beneath it.
    line(P, c.series.map((p) => [p.r, p.I]), { color: alpha(C.text, 0.4), width: 1.5, dash: [3, 3] });
    line(P, c.series.map((p) => [p.r, p.w]), { color: C.gold, width: 2.5 });
    note(P, 'ω and T', c.series[24].r, c.series[24].w, { color: C.gold });
    note(P, 'I', c.series[4].r, c.series[4].I, { color: C.dim, dy: 14 });
    dot(P, state.r, c.ratioW, { color: C.gold, r: 5 });
  },
  law: () => [String.raw`H=(I_0+2mr^2)\,\omega=\text{const}`, String.raw`T=\dfrac{H^2}{2I}`],
  liveRows(state, c) {
    return [
      kv('$I_1$ at $r_1$, $I_2$ now', `${fig(c.I1)}, ${fig(c.I2)} kg·m²`),
      kv('$H = I\\omega$', `${fig(c.H)} kg·m²/s`),
      kv('$\\omega_2 = I_1\\omega_1/I_2$', `${fig(c.w2)} rad/s`),
      kv('$\\omega_2$ from the forces, step by step', `${fig(c.wForces)} rad/s`),
      kv('$T_1$, $T_2$', `${fig(c.T1)} J, ${fig(c.T2)} J`),
      kv('work done by the pull', `${fig(c.work)} J`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['ω', `${fig(c.w2)} rad/s`],
      ['H', `${fig(c.H)} kg·m²/s`],
      ['T', `${fig(c.T2)} J`],
      ['pull’s work', `${fig(c.work)} J`],
    ]);
  },
  coach(state, c) {
    if (Math.abs(state.r - state.r1) < 1e-6) {
      return {
        title: 'Nothing has moved yet',
        body: [
          String.raw`At $r_1 = ${fig(state.r1)}$ m the system has $I_1 = ${fig(c.I1)}$ kg·m² and $H = ${fig(c.H)}$ kg·m²/s. Slide the radius, or press Play, and watch which of $H$, $\omega$ and $T$ stays put.`,
        ],
      };
    }
    const inward = state.r < state.r1;
    return {
      title: inward ? 'H is kept; the kinetic energy is not' : 'Letting out: slower, and less energy',
      body: [
        String.raw`Nothing torques the system about its axis, so $H = ${fig(c.H)}$ kg·m²/s throughout. With $I$ ${inward ? 'down' : 'up'} to $${fig(c.I2)}$ kg·m², $\omega = ${fig(c.w2)}$ rad/s, ${fig(c.ratioW)} times the start.`,
        String.raw`$T = H^2/2I$ ${inward ? 'rises' : 'falls'} in the same ratio: ${fig(c.T1)} J to ${fig(c.T2)} J. ${inward ? 'The pull that drags the masses in does that work.' : 'The masses do work on whatever holds them back.'}`,
      ],
    };
  },
  predictions: [
    {
      id: 'sp-in',
      scenario: 'skater',
      ask: 'Pull the two weights in from 0.8 m to 0.4 m.',
      apply(s) { s.r = 0.4; },
      watch: [
        { id: 'H', label: 'the angular momentum', get: (c) => c.H },
        { id: 'w', label: 'the spin rate', get: (c) => c.w2 },
        { id: 'T', label: 'the kinetic energy', get: (c) => c.T2 },
      ],
      mode: 'dir',
      expect: { H: 'same', w: 'bigger', T: 'bigger' },
      why: 'No torque acts about the axis, so $H$ stays at 13.7 kg·m²/s. $I$ falls from 4.56 to 2.64 kg·m², so $\\omega$ rises from 3 to 5.18 rad/s, and $T = H^2/2I$ rises from 20.5 to 35.4 J. The arms pulling the weights in supply the 14.9 J.',
    },
    {
      id: 'sp-body',
      scenario: 'chair',
      ask: 'Do the same pull on a chair twice as hard to turn: double the body’s own I₀.',
      apply(s) { s.I0 *= 2; },
      watch: [{ id: 'w', label: 'the spin rate after the pull', get: (c) => c.w2 }],
      mode: 'dir',
      expect: { w: 'smaller' },
      why: 'The weights now change a smaller share of the total inertia: $I$ falls from 8.94 to 6.14 kg·m² instead of from 5.94 to 3.14. The speed-up is $I_1/I_2$ = 1.46 instead of 1.89, so the chair ends at 2.91 rad/s instead of 3.79.',
    },
    {
      id: 'sp-half',
      scenario: 'masses',
      ask: 'Pull both masses in to half their radius, from 0.8 m to 0.4 m.',
      apply(s) { s.r = 0.4; },
      watch: [
        { id: 'w', label: 'the spin rate', get: (c) => c.w2 },
        { id: 'T', label: 'the kinetic energy', get: (c) => c.T2 },
      ],
      mode: 'factor',
      expect: { w: 4, T: 4 },
      why: 'With a light rod, $I \\approx 2mr^2$, so halving $r$ quarters $I$. $H$ is kept, so $\\omega$ grows four times, 2 to 8 rad/s, and $T = H^2/2I$ grows four times too.',
    },
  ],
});
