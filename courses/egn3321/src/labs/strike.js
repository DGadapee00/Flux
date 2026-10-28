import { strikeBar, strikeBarByImpulses } from '@flux/subjects/mechanics/rigid-momentum.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, chartIn, circle, dot, hidden, label, line, note, sceneIn, seg, split, vec } from './diagram.js';
import { defineLab } from './define2d.js';
import { PLAY, advance } from './motion.js';
import { bindSlider, slider } from './widgets.js';

/**
 * Shows that through a blow on a pinned bar the angular momentum about the pin is kept while the
 * linear momentum is not, and that struck at two-thirds of its length the pin feels no blow at all
 * (Hibbeler §19.3, §19.4). A free bar struck at its centre moves off faster than one struck at its end:
 * at the end, part of the impulse goes into spin and the end gives way.
 *
 * Recompute: the pinned bar by angular momentum about the pin and restitution; the free bar by an
 * effective mass at the contact. Check: the impulse equations, with the pin's impulse unknown,
 * solved as one linear system (strikeBarByImpulses).
 */
const SCENARIOS = [
  { id: 'pinned', name: 'Hanging bar, struck at its end', pinned: true, M: 3, L: 1.2, m: 0.5, u: 6, dFrac: 1, e: 0.4, t: 0.12 },
  { id: 'percussion', name: 'Hanging bar, struck at two-thirds', pinned: true, M: 3, L: 1.2, m: 0.5, u: 6, dFrac: 2 / 3, e: 0.4, t: 0.12 },
  { id: 'free', name: 'Free bar on ice, struck at its end', pinned: false, M: 2, L: 1, m: 0.3, u: 5, dFrac: 0, e: 0.6, t: 0.12 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  const { name, id: scId, ...rest } = sc;
  void name;
  Object.assign(state, { scenarioId: scId, anim: { playing: false }, show: { play: false }, ...rest });
}

const T0 = -0.15;
const T1 = 0.45;
const specOf = (s, dFrac = s.dFrac) => ({ M: s.M, L: s.L, m: s.m, u: s.u, d: dFrac * s.L, e: s.e, pinned: !!s.pinned });

export default defineLab({
  id: 'strike',
  exam: 'u8',
  title: 'Strike',
  app: false,
  gapLimit: 1e-9,
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  hint: 'Through the blow, angular momentum about the pin is kept. Struck at 2L/3, the pin feels nothing.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('pinned', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'dFrac', lo: 0, hi: 1 }),
  controls() {
    return `
      ${slider('st-d', 'strike point, fraction of L from the top', 1, 0, 1, 0.01)}
      ${slider('st-e', 'restitution e', 0.4, 0, 1, 0.05)}
      ${slider('st-m', 'ball m (kg)', 0.5, 0.05, 2, 0.05)}
      ${slider('st-u', 'ball speed u (m/s)', 6, 1, 15, 0.5)}
      ${slider('st-M', 'bar M (kg)', 3, 0.5, 8, 0.25)}
      ${slider('st-t', 'time from the blow (s)', 0.12, T0, T1, 0.005)}
      <p class="tiny">White arrows are velocities after the blow. Teal is the pin's impulse on the bar, to the same scale as the ball's. Yellow is the pin, or the free bar's centre.</p>`;
  },
  bind(api) {
    bindSlider('st-d', (s, v) => { s.dFrac = v; }, api);
    bindSlider('st-e', (s, v) => { s.e = v; }, api);
    bindSlider('st-m', (s, v) => { s.m = v; }, api);
    bindSlider('st-u', (s, v) => { s.u = v; }, api);
    bindSlider('st-M', (s, v) => { s.M = v; }, api);
    bindSlider('st-t', (s, v) => { s.t = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('st-d', Number(state.dFrac.toFixed(2)));
    set('st-e', state.e);
    set('st-m', state.m);
    set('st-u', state.u);
    set('st-M', state.M);
    set('st-t', Number(state.t.toFixed(3)));
  },
  tick(dt, state) {
    return advance(state, dt, { lo: T0, hi: T1, rate: 0.25 });
  },
  compute(state) {
    const c = strikeBar(specOf(state));
    const k = strikeBarByImpulses(specOf(state));
    const scale = Math.max(1e-9, Math.abs(c.w), Math.abs(c.vG), state.u);
    const gap = Math.max(Math.abs(k.w - c.w), Math.abs(k.v - c.v), Math.abs((k.vG ?? (k.w * state.L) / 2) - c.vG), Math.abs(k.J - c.J)) / scale;
    const series = Array.from({ length: 101 }, (_, i) => {
      const f = i / 100;
      const p = strikeBar(specOf(state, f));
      return { f, J: p.J, w: p.w, vG: p.vG };
    });
    const pBefore = state.m * state.u;
    const pAfter = state.m * c.v + state.M * c.vG;
    return {
      ...c,
      d: state.dFrac * state.L,
      pBefore,
      pAfter,
      Hpin: state.pinned ? state.m * state.u * state.dFrac * state.L : null,
      bounces: c.v < -1e-9,
      series,
      gap,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [left, right] = veiled ? [B.free, null] : split(B.free, 0.5);
    const L = state.L;
    const S = sceneIn(B, left, { x0: -0.9 * L, x1: 0.9 * L, y0: -1.15 * L, y1: 0.12 * L });
    const t = Math.min(Math.max(state.t, T0), T1);
    const after = t > 0;
    // The bar: pinned at its top, or free with its centre moving.
    const ang = after ? c.w * t : 0;
    let p0;
    let p1;
    if (state.pinned) {
      p0 = [0, 0];
      p1 = [L * Math.sin(ang), -L * Math.cos(ang)];
    } else {
      const g = [after ? c.vG * t : 0, -L / 2];
      // The free bar turns about G; ω is taken so a point below G moves along +x.
      p0 = [g[0] - (L / 2) * Math.sin(ang), g[1] + (L / 2) * Math.cos(ang)];
      p1 = [g[0] + (L / 2) * Math.sin(ang), g[1] - (L / 2) * Math.cos(ang)];
    }
    seg(S, p0, p1, { color: C.text, width: 7 });
    seg(S, p0, p1, { color: C.bg, width: 3 });
    if (state.pinned) {
      dot(S, 0, 0, { color: C.yellow, r: 5 });
      seg(S, [-0.12 * L, 0.04 * L], [0.12 * L, 0.04 * L], { color: C.dim, width: 3 });
    } else {
      dot(S, (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, { color: C.yellow, r: 4 });
    }
    // The strike point, the percussion point, and the ball.
    const yStrike = -c.d;
    if (state.pinned) label(S, '2L/3', [0, -(2 / 3) * L], { dx: -26, color: C.dim });
    if (state.pinned) seg(S, [-0.05 * L, -(2 / 3) * L], [0.05 * L, -(2 / 3) * L], { color: C.dim, width: 1 });
    const rBall = 0.035 * L + 0.02 * L * Math.sqrt(state.m);
    const bx = after ? c.v * t - rBall : state.u * t - rBall;
    circle(S, [Math.max(bx, -0.85 * L), yStrike], rBall, { stroke: C.red, fill: alpha(C.red, 0.5), width: 1.5 });
    const kv = (0.25 * L) / Math.max(state.u, 1e-9);
    if (!after) vec(S, [bx, yStrike], [state.u, 0], kv * S.k, { color: C.text, label: 'u' });
    else {
      vec(S, [bx, yStrike], [c.v, 0], kv * S.k, { color: C.text, label: 'v' });
      vec(S, [p1[0], p1[1]], [state.pinned ? c.w * L : c.vG + (c.w * L) / 2, 0], kv * S.k, { color: C.text });
      if (state.pinned && !veiled && Math.abs(c.J) > 1e-6) {
        const kJ = (0.25 * L * S.k) / Math.max(state.m * state.u, 1e-9);
        vec(S, [0, -0.02 * L], [c.J, 0], kJ, { color: C.teal, label: 'pin' });
      }
    }
    if (veiled) return;

    // The pin's impulse across the strike point (pinned), or the bar's spin (free).
    const ys = c.series.map((p) => (state.pinned ? p.J : p.w));
    const lo = Math.min(0, ...ys);
    const hi = Math.max(0, ...ys);
    const span = hi - lo || 1;
    const P = chartIn(B, right, { lo: 0, hi: 1 }, { lo: lo - 0.1 * span, hi: hi + 0.15 * span });
    axes(P, { xLabel: 'strike point d/L', yLabel: state.pinned ? 'pin impulse (N·s)' : 'ω (rad/s)' });
    line(P, [[0, 0], [1, 0]], { color: alpha(C.text, 0.3), width: 1 });
    line(P, c.series.map((p, i) => [p.f, ys[i]]), { color: state.pinned ? C.teal : C.text, width: 2.5 });
    if (state.pinned) note(P, 'no blow at the pin', 2 / 3, 0, { color: C.dim, dy: 14 });
    dot(P, state.dFrac, state.pinned ? c.J : c.w, { color: C.yellow, r: 5 });
  },
  law: () => [String.raw`\text{pinned: } m u d = m v d + I_O\omega,\quad \omega d - v = e u`, String.raw`J_O = 0 \text{ at } d = I_O/(M\bar r) = \tfrac23 L`],
  liveRows(state, c) {
    const rows = [
      kv('ball after, $v$', `${fig(c.v)} m/s`),
      kv('bar $\\omega$', `${fig(c.w)} rad/s`),
      kv('linear momentum before, after', `${fig(c.pBefore)}, ${fig(c.pAfter)} kg·m/s`),
      kv('kinetic energy lost', `${fig(c.loss)} J`),
    ];
    if (state.pinned) {
      rows.splice(2, 0, kv('$H$ about the pin, before and after', `${fig(c.Hpin)} kg·m²/s`));
      rows.push(kv('pin impulse $J$', `${fig(c.J)} N·s`));
    } else {
      rows.splice(2, 0, kv('bar centre $v_G$', `${fig(c.vG)} m/s`));
    }
    return rows.join('');
  },
  readout(state, c) {
    return cells([
      ['ω', `${fig(c.w)} rad/s`],
      ['ball after', `${fig(c.v)} m/s`],
      state.pinned ? ['pin impulse', `${fig(c.J)} N·s`] : ['v_G', `${fig(c.vG)} m/s`],
      ['energy lost', `${fig(c.loss)} J`],
    ]);
  },
  coach(state, c) {
    if (!state.pinned) {
      return {
        title: 'A free bar: momentum and angular momentum both kept',
        body: [
          String.raw`Nothing outside acts during the blow, so $m u = m v + M v_G$ and the angular momentum about $G$ is kept. The bar moves off at $v_G = ${fig(c.vG)}$ m/s and spins at $${fig(c.w)}$ rad/s.`,
          String.raw`Struck away from its centre, the bar gives way at the contact by turning, so it takes a smaller impulse than when struck at the centre.`,
        ],
      };
    }
    const atCp = Math.abs(c.J) < 1e-3 * state.m * state.u;
    return {
      title: atCp ? 'Struck at the centre of percussion: no blow at the pin' : 'The pin pushes back, but has no moment about itself',
      body: [
        String.raw`The pin's impulse acts at the pin, so it has no moment there: $H_O = m u d = ${fig(c.Hpin)}$ kg·m²/s before and after. Linear momentum is not kept: ${fig(c.pBefore)} kg·m/s before, ${fig(c.pAfter)} after.`,
        atCp
          ? String.raw`At $d = 2L/3$ the bar's own motion takes exactly the ball's impulse, so the pin gives nothing. A batter's hands feel no sting at this point.`
          : String.raw`The pin's impulse is $${fig(c.J)}$ N·s. It vanishes at $d = 2L/3 = ${fig((2 / 3) * state.L)}$ m.`,
      ],
    };
  },
  predictions: [
    {
      id: 'st-percussion',
      scenario: 'pinned',
      ask: 'Strike the hanging bar two-thirds of the way down instead of at its end.',
      apply(s) { s.dFrac = 2 / 3; },
      watch: [
        { id: 'J', label: 'the blow the pin feels', get: (c) => c.J },
        { id: 'w', label: 'the bar’s angular velocity', get: (c) => c.w },
      ],
      mode: 'dir',
      expect: { J: 'smaller', w: 'smaller' },
      why: 'At the end, $\\omega$ = 2.33 rad/s and the pin pushes forward with 1.4 N·s. At 0.8 m, $\\omega = m u d(1+e)/(I_O + m d^2)$ = 1.91 rad/s, and the pin feels nothing: the bar’s centre speeds up by exactly what the ball’s impulse gives it.',
    },
    {
      id: 'st-bounce',
      scenario: 'pinned',
      ask: 'Make the impact perfectly elastic: raise e from 0.4 to 1.',
      apply(s) { s.e = 1; },
      watch: [{ id: 'back', label: 'the ball bounces back', get: (c) => c.bounces, mode: 'bool' }],
      mode: 'bool',
      expect: { back: true },
      why: 'With e = 0.4 the ball goes on forward at 0.4 m/s. With e = 1 the bar spins up to 3.33 rad/s, its end moves at 4 m/s, and the ball must separate at 6 m/s: it comes back at 2 m/s.',
    },
    {
      id: 'st-free',
      scenario: 'free',
      ask: 'Strike the free bar at its centre instead of at its end.',
      apply(s) { s.dFrac = 0.5; },
      watch: [
        { id: 'vG', label: 'how fast the bar’s centre moves off', get: (c) => c.vG },
        { id: 'w', label: 'the bar’s spin', get: (c) => Math.abs(c.w) },
      ],
      mode: 'dir',
      expect: { vG: 'bigger', w: 'smaller' },
      why: 'Struck at its end the bar turns as it is pushed, so its end gives way and it takes an impulse of 1.50 N·s: $v_G$ = 0.75 m/s. Struck at its centre it cannot turn and takes 2.09 N·s: $v_G$ = 1.04 m/s, with no spin.',
    },
  ],
});
