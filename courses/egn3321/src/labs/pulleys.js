import { tackle, tackleSpeed } from '@flux/subjects/mechanics/pulley.js';
import { G } from '@flux/subjects/mechanics/constants.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, begin, circle, dot, hidden, label, poly, sceneIn, seg, vec } from './diagram.js';
import { defineLab } from './define2d.js';
import { PLAY, advance, stopped } from './motion.js';
import { bindSlider, slider } from './widgets.js';

/**
 * Shows that a load held by n rope segments moves 1/n as fast as the rope end, and sees the block on
 * the table as n² times its mass. The rope's fixed length, s_A + n s_B = L, ties the two motions
 * (Hibbeler §12.9); ΣF = ma on each body (§13.4) then gives the acceleration and the one tension.
 * More segments do not make the tension bigger: they make the load slower and the rope's pull on it
 * n times larger.
 *
 * Recompute: the constraint and ΣF = ma on each body (subjects/mechanics/pulley.js). Check: the
 * work–energy balance over the drop so far.
 */
const SCENARIOS = [
  { id: 'single', name: 'One segment: a table-top Atwood', mA: 4, mB: 2, n: 1, mus: 0, muk: 0, t: 0.6 },
  { id: 'movable', name: 'A movable pulley, n = 2, with friction', mA: 4, mB: 6, n: 2, mus: 0.3, muk: 0.2, t: 0.6 },
  { id: 'heavy', name: 'A heavy block that may hold the load', mA: 10, mB: 6, n: 1, mus: 0.3, muk: 0.25, t: 0.3 },
];

const START_A = 1.8;

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  const { name, id: scId, ...rest } = sc;
  void name;
  Object.assign(state, stopped(), { scenarioId: scId, ...rest });
}

const solve = (s) => tackle({ mA: s.mA, mB: s.mB, n: Math.round(s.n), mus: s.mus, muk: Math.min(s.muk, s.mus || s.muk) });

/** The run lasts until the block has crossed most of the table, or 2 s. */
export function runTime(s) {
  const r = solve(s);
  if (!(r.aA > 0)) return 2;
  return Math.min(2, Math.sqrt((2 * (START_A - 0.35)) / r.aA));
}

export default defineLab({
  id: 'pulleys',
  exam: 'u2',
  title: 'Pulleys',
  app: false,
  gapLimit: 1e-9,
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  hint: 'One rope, one tension. The load moves 1/n as fast and feels the block as n² times its mass.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('single', s);
    return s;
  },
  applyScenario: apply,
  sweep: (state) => ({ key: 'mB', lo: 0.5, hi: 20 }),
  controls() {
    return `
      ${slider('pu-mA', 'block on the table m_A (kg)', 4, 0.5, 20, 0.5)}
      ${slider('pu-mB', 'load m_B (kg)', 2, 0.5, 20, 0.5)}
      ${slider('pu-n', 'segments holding the load n', 1, 1, 4, 1)}
      ${slider('pu-mus', 'static friction μ_s', 0, 0, 0.8, 0.05)}
      ${slider('pu-muk', 'kinetic friction μ_k', 0, 0, 0.8, 0.05)}
      ${slider('pu-t', 'time t (s)', 0.6, 0, 2, 0.01)}
      <p class="tiny">Gold is the rope's pull, pink friction, grey weight. White arrows are velocities: the block's is n times the load's.</p>`;
  },
  bind(api) {
    bindSlider('pu-mA', (s, v) => { s.mA = v; }, api);
    bindSlider('pu-mB', (s, v) => { s.mB = v; }, api);
    bindSlider('pu-n', (s, v) => { s.n = v; }, api);
    bindSlider('pu-mus', (s, v) => { s.mus = v; }, api);
    bindSlider('pu-muk', (s, v) => { s.muk = v; }, api);
    bindSlider('pu-t', (s, v) => { s.t = v; }, api);
  },
  syncControls(state) {
    const set = (id, val, max) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (max != null) el.max = String(Number(max.toFixed(2)));
      if (document.activeElement !== el) el.value = String(val);
    };
    set('pu-mA', state.mA);
    set('pu-mB', state.mB);
    set('pu-n', state.n);
    set('pu-mus', state.mus);
    set('pu-muk', state.muk);
    set('pu-t', Number(Math.min(state.t, runTime(state)).toFixed(2)), runTime(state));
  },
  tick(dt, state) {
    return advance(state, dt, { hi: runTime(state), rate: 0.6 });
  },
  compute(state) {
    const n = Math.round(state.n);
    const r = solve(state);
    const T = runTime(state);
    const t = Math.min(Math.max(state.t ?? 0, 0), T);
    const vB = r.aB * t;
    const sB = 0.5 * r.aB * t * t;
    const check = tackleSpeed({ mA: state.mA, mB: state.mB, n, f: r.holds ? 0 : r.f, h: sB });
    const gap = r.holds || sB < 1e-12 ? 0 : Math.abs(check.vB - vB) / Math.max(1e-9, vB);
    return {
      n,
      T: r.T,
      f: r.f,
      aB: r.aB,
      aA: r.aA,
      holds: r.holds,
      regime: r.regime,
      mEff: r.mEff,
      tRun: T,
      t,
      vB,
      vA: n * vB,
      sB,
      sA: n * sB,
      vCheck: check.vB,
      W: state.mB * G,
      gap,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const S = sceneIn(B, B.free, { x0: -2.35, x1: 1.25, y0: -2.9, y1: 0.75 });
    // The table and the pulley at its edge.
    poly(S, [[-2.35, 0], [0, 0], [0, -0.12], [-2.35, -0.12]], { fill: alpha(C.text, 0.12), stroke: alpha(C.text, 0.5), width: 1 });
    const P = [0.12, 0.12];
    circle(S, P, 0.12, { stroke: C.text, width: 1.5 });
    // The block on the table.
    const xA = -START_A + c.sA;
    const wA = 0.22 + 0.025 * state.mA;
    poly(S, [[xA - wA, 0], [xA, 0], [xA, 0.32], [xA - wA, 0.32]], { fill: alpha(C.red, 0.35), stroke: C.red, width: 1.5 });
    label(S, 'A', [xA - wA / 2, 0.16], { color: C.text, bold: true });
    seg(S, [xA, 0.24], [P[0], 0.24], { color: C.gold, width: 1.5 });
    // The rope over the pulley, down to the load's block: n segments from a beam above.
    const yB = -0.9 - c.sB;
    const span = 0.16;
    const x0 = 0.24;
    const xs = Array.from({ length: c.n }, (_, i) => x0 + i * span);
    seg(S, [0.24, 0.12], [0.24, yB + 0.1], { color: C.gold, width: 1.5 });
    if (c.n > 1) {
      seg(S, [x0 + span / 2, 0.5], [x0 + (c.n - 0.5) * span + 0.06, 0.5], { color: C.dim, width: 4 });
      for (let i = 1; i < c.n; i++) seg(S, [xs[i], 0.5], [xs[i], yB + 0.1], { color: C.gold, width: 1.5 });
      poly(S, [[x0 - 0.06, yB + 0.1], [xs[c.n - 1] + 0.06, yB + 0.1], [xs[c.n - 1] + 0.06, yB - 0.02], [x0 - 0.06, yB - 0.02]], { fill: alpha(C.text, 0.25), stroke: C.text, width: 1 });
    }
    const xMid = (x0 + xs[c.n - 1]) / 2;
    const wB = 0.2 + 0.02 * state.mB;
    poly(S, [[xMid - wB / 2, yB - 0.02], [xMid + wB / 2, yB - 0.02], [xMid + wB / 2, yB - 0.02 - wB], [xMid - wB / 2, yB - 0.02 - wB]], { fill: alpha(C.blue, 0.35), stroke: C.blue, width: 1.5 });
    label(S, 'B', [xMid, yB - 0.02 - wB / 2], { color: C.text, bold: true });
    label(S, `n = ${c.n}`, [xs[c.n - 1] + 0.12, yB + 0.35], { align: 'left', color: C.muted });

    // Forces, all to one scale: the rope's pull on each body, friction on A, weight on B.
    const kF = 70 / Math.max(c.W, 1e-6);
    vec(S, [xA, 0.16], [c.T, 0], kF, { color: C.gold, label: veiled ? 'T' : `T ${fig(c.T)} N` });
    if (c.f > 1e-9) vec(S, [xA - wA, 0.06], [-c.f, 0], kF, { color: C.pink, label: 'f' });
    vec(S, [xMid, yB - 0.02 - wB], [0, -c.W], kF, { color: C.dim, label: 'W' });
    vec(S, [xMid - wB / 2 - 0.08, yB - 0.02 - wB / 2], [0, c.n * c.T], kF, { color: C.gold, label: 'nT' });
    // Velocities: the block's is n times the load's.
    const vMax = Math.max(1e-6, c.n * Math.max(c.aB, 0) * c.tRun);
    const kv = 55 / vMax;
    vec(S, [xA - wA / 2, 0.42], [c.vA, 0], kv, { color: C.text, label: 'v_A' });
    vec(S, [xMid + wB / 2 + 0.12, yB - 0.02 - wB / 2], [0, -c.vB], kv, { color: C.text, label: 'v_B' });
    if (c.holds) label(S, 'held by static friction', [-1.3, -0.5], { color: C.teal });
    dot(S, P[0], P[1], { color: C.dim, r: 2 });
  },
  law: () => [String.raw`s_A + n\,s_B = L \;\Rightarrow\; a_A = n\,a_B`, String.raw`a_B=\dfrac{m_Bg-n\mu_k m_Ag}{m_B+n^2m_A}`],
  liveRows(state, c) {
    return [
      kv('$a_B$, $a_A = n a_B$', `${fig(c.aB)}, ${fig(c.aA)} m/s²`),
      kv('$T$, one tension', `${fig(c.T)} N`),
      kv('$nT$ on the load, its weight', `${fig(c.n * c.T)} N, ${fig(c.W)} N`),
      kv('load sees $m_B + n^2 m_A$', `${fig(c.mEff)} kg`),
      kv(`$v_B$ at $t = ${fig(c.t)}$ s`, `${fig(c.vB)} m/s`),
      kv('$v_B$ from work and energy over the drop', `${fig(c.vCheck)} m/s`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['a_B', `${fig(c.aB)} m/s²`],
      ['a_A', `${fig(c.aA)} m/s²`],
      ['tension', `${fig(c.T)} N`],
      ['friction', c.holds ? 'static' : `${fig(c.f)} N`],
    ]);
  },
  coach(state, c) {
    if (c.holds) {
      return {
        title: 'Static friction holds the load',
        body: [
          String.raw`At rest the rope must carry $W/n = ${fig(c.T)}$ N. Static friction on the block can give up to $\mu_s m_A g = ${fig(state.mus * state.mA * G)}$ N, so nothing moves.`,
          'More segments divide the pull the block must resist. That is what a block and tackle is for.',
        ],
      };
    }
    return {
      title: c.n > 1 ? `${c.n} segments: the load is slower, the rope pulls less` : 'One rope, one tension',
      body: [
        String.raw`The rope's length fixes $a_A = ${c.n}a_B$. One rope carries one tension, $T = ${fig(c.T)}$ N, and the load feels $${c.n}T = ${fig(c.n * c.T)}$ N up against its $${fig(c.W)}$ N weight.`,
        String.raw`Through the rope the load drags the block's ${fig(state.mA)} kg as if it were $n^2 m_A = ${fig(c.n * c.n * state.mA)}$ kg: the block moves $n$ times as far, and its force arrives $n$ times as large.`,
      ],
    };
  },
  predictions: [
    {
      id: 'pu-n',
      scenario: 'single',
      ask: 'Hang the same 2 kg load from a movable pulley, so two segments of the rope hold it.',
      apply(s) { s.n = 2; },
      watch: [
        { id: 'aB', label: 'the load’s acceleration', get: (c) => c.aB },
        { id: 'T', label: 'the rope’s tension', get: (c) => c.T },
      ],
      mode: 'dir',
      expect: { aB: 'smaller', T: 'smaller' },
      why: 'With $n = 2$ the load sees $m_B + 4m_A$ = 18 kg instead of 6 kg, so $a_B$ falls from 3.27 to 1.09 m/s². The block now speeds up at 2.18 m/s², so the rope needs only $4(2.18)$ = 8.72 N, down from 13.1 N. A movable pulley does not double the tension: it doubles what one tension does to the load.',
    },
    {
      id: 'pu-mass',
      scenario: 'movable',
      ask: 'Double the block on the table, from 4 kg to 8 kg.',
      apply(s) { s.mA *= 2; },
      watch: [
        { id: 'aB', label: 'the load’s acceleration', get: (c) => c.aB },
        { id: 'T', label: 'the rope’s tension', get: (c) => c.T },
      ],
      mode: 'dir',
      expect: { aB: 'smaller', T: 'bigger' },
      why: 'A heavier block resists more, through both its inertia and its friction: $a_B$ falls from 1.96 to 0.723 m/s². The rope must pull harder to drag it, 27.3 N instead of 23.5 N, so the load sinks more slowly.',
    },
    {
      id: 'pu-hold',
      scenario: 'heavy',
      ask: 'Reeve the 6 kg load with three segments instead of one.',
      apply(s) { s.n = 3; },
      watch: [{ id: 'moves', label: 'the load still drops', get: (c) => !c.holds, mode: 'bool' }],
      mode: 'bool',
      expect: { moves: false },
      why: 'With one segment the rope must carry 58.9 N to hold the load, more than the 29.4 N static friction can give the 10 kg block. With three it needs only 19.6 N, and friction holds.',
    },
  ],
});
