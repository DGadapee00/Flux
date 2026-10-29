import { batHit, solveLinear } from '@flux/subjects/mechanics/rigid-momentum.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, chartIn, circle, dot, hidden, label, line, note, sceneIn, seg, split, vec } from './diagram.js';
import { defineLab } from './define2d.js';
import { PLAY, advance } from './motion.js';
import { bindSlider, leavesOut, slider } from './widgets.js';

const MPH = 0.44704;

/**
 * Application: a baseball bat meets a pitch (Hibbeler §19.4). Over the millisecond of contact the
 * hands hold the bat's knob like a pin. Angular momentum about the hands is kept, and restitution
 * fixes how fast the ball leaves. The ball's size and the bat's are set by the Official Baseball
 * Rules (MLB, rules 3.01 and 3.02: a 5 to 5¼ oz ball, a bat at most 42 in long and 2.61 in thick).
 * The collision is set by the NCAA's BBCOR standard, which caps the ball–bat coefficient of
 * restitution at 0.50. Shows that the end of the bat, though it moves fastest, does not send the ball
 * fastest, and that the hands feel no sting at the centre of percussion.
 *
 * Recompute: batHit in closed form. Check: the four impulse equations, with the hands' impulse an
 * unknown, solved as a linear system. The bat is a uniform rod pivoted at its knob.
 */
const SCENARIOS = [
  { id: 'wood', name: '33 in, 31 oz bat, 90 mph pitch', M: 0.88, L: 0.84, m: 0.145, u: 40.2, w0: 55, e: 0.5, dFrac: 2 / 3, t: 0.004 },
  { id: 'heavy', name: '33 in, 34 oz bat, same swing', M: 0.96, L: 0.84, m: 0.145, u: 40.2, w0: 55, e: 0.5, dFrac: 2 / 3, t: 0.004 },
  { id: 'end', name: 'The same pitch off the end of the bat', M: 0.88, L: 0.84, m: 0.145, u: 40.2, w0: 55, e: 0.5, dFrac: 1, t: 0.004 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  const { name, id: scId, ...rest } = sc;
  void name;
  Object.assign(state, { scenarioId: scId, anim: { playing: false }, show: { play: false }, ...rest });
}

const T0 = -0.02;
const T1 = 0.03;

const specOf = (s, dFrac = s.dFrac) => {
  const I = (s.M * s.L * s.L) / 3;
  return { I, M: s.M, xbar: s.L / 2, m: s.m, u: s.u, w0: s.w0, e: s.e, d: dFrac * s.L };
};

/** The second method: ball, bat linear, bat about the hands, restitution, as one linear system. */
function byImpulses(p) {
  const [v, w1, , J] = solveLinear(
    [
      [p.m, 0, -1, 0],
      [0, p.M * p.xbar, 1, -1],
      [0, p.I, p.d, 0],
      [1, -p.d, 0, 0],
    ],
    [-p.m * p.u, p.M * p.xbar * p.w0, p.I * p.w0, p.e * (p.w0 * p.d + p.u)],
  );
  return { v, w1, J };
}

const OUT = String.raw`The bat is a uniform rod held at its knob. A real bat carries more of its mass toward the barrel and is gripped a few inches up the handle, which moves the centre of percussion toward the barrel. The bat also flexes: struck away from its vibration nodes it rings, and that ringing, not only the rigid-body impulse modelled here, is what stings the hands. The ball compresses, so e falls as the impact speed rises, and spin, friction at the contact and the swing's tilt are left out.`;

export default defineLab({
  id: 'bat',
  exam: 'u8',
  title: 'Bat',
  gapLimit: 1e-9,
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  hint: 'The end of the bat moves fastest, yet the ball leaves fastest a little inside it. At 2L/3 the hands feel nothing.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('wood', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'dFrac', lo: 0.3, hi: 1 }),
  controls() {
    return `
      ${slider('bt-d', 'contact point, fraction of the bat from the hands', 0.667, 0.3, 1, 0.01)}
      ${slider('bt-w', 'swing rate ω (rad/s)', 55, 20, 80, 1)}
      ${slider('bt-u', 'pitch speed (m/s)', 40.2, 20, 47, 0.1)}
      ${slider('bt-M', 'bat mass M (kg)', 0.88, 0.7, 1.1, 0.01)}
      ${slider('bt-e', 'restitution e (BBCOR cap 0.50)', 0.5, 0.3, 0.6, 0.01)}
      ${slider('bt-t', 'time from contact (s)', 0.004, T0, T1, 0.0005)}
      <p class="tiny">Seen from above. White arrows are velocities; teal is the hands' impulse on the bat, to the ball's scale. Yellow is the hands.</p>`;
  },
  bind(api) {
    bindSlider('bt-d', (s, v) => { s.dFrac = v; }, api);
    bindSlider('bt-w', (s, v) => { s.w0 = v; }, api);
    bindSlider('bt-u', (s, v) => { s.u = v; }, api);
    bindSlider('bt-M', (s, v) => { s.M = v; }, api);
    bindSlider('bt-e', (s, v) => { s.e = v; }, api);
    bindSlider('bt-t', (s, v) => { s.t = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('bt-d', Number(state.dFrac.toFixed(3)));
    set('bt-w', state.w0);
    set('bt-u', state.u);
    set('bt-M', state.M);
    set('bt-e', state.e);
    set('bt-t', Number(state.t.toFixed(4)));
  },
  tick(dt, state) {
    return advance(state, dt, { lo: T0, hi: T1, rate: 0.02 });
  },
  compute(state) {
    const p = specOf(state);
    const c = batHit(p);
    const k = byImpulses(p);
    const gap = Math.max(Math.abs(k.v - c.v) / Math.max(1, Math.abs(c.v)), Math.abs(k.w1 - c.w1) / Math.max(1, Math.abs(c.w1)), Math.abs(k.J - c.J) / Math.max(1, p.m * p.u));
    const series = Array.from({ length: 71 }, (_, i) => {
      const f = 0.3 + (0.7 * i) / 70;
      const q = batHit(specOf(state, f));
      return { f, v: q.v, J: q.J };
    });
    const best = series.reduce((b, q) => (q.v > b.v ? q : b), series[0]);
    return {
      ...c,
      I: p.I,
      d: p.d,
      exitMph: c.v / MPH,
      batMph: c.batSpeed / MPH,
      pitchMph: state.u / MPH,
      cpFrac: c.percussion / state.L,
      bestFrac: best.f,
      bestV: best.v,
      series,
      gap,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [left, right] = veiled ? [B.free, null] : split(B.free, 0.5);
    const L = state.L;
    const S = sceneIn(B, left, { x0: -0.15 * L, x1: 1.15 * L, y0: -0.55 * L, y1: 0.75 * L });
    const t = Math.min(Math.max(state.t, T0), T1);
    const after = t > 0;
    const ang = after ? c.w1 * t : state.w0 * t;
    const ux = Math.cos(ang);
    const uy = Math.sin(ang);
    // The bat: thin at the handle, thick at the barrel.
    const steps = 12;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * L;
      const b = ((i + 1) / steps) * L;
      seg(S, [a * ux, a * uy], [b * ux, b * uy], { color: C.text, width: 3 + (7 * i) / steps });
    }
    dot(S, 0, 0, { color: C.yellow, r: 5 });
    label(S, 'hands', [0, 0], { dy: 14, color: C.yellow });
    const cp = c.percussion;
    dot(S, cp * ux, cp * uy, { color: C.teal, r: 3 });
    // The ball, coming in along the line through the contact point.
    const r = 0.0366 * 1.4;
    const bx = c.d;
    const by = after ? r + c.v * t : r + state.u * -t;
    circle(S, [bx, Math.min(by, 0.72 * L)], r, { stroke: C.red, fill: alpha(C.red, 0.5), width: 1.5 });
    const k = (0.3 * L * S.k) / Math.max(state.u, c.v, 1e-9);
    if (!after) vec(S, [bx, by], [0, -state.u], k, { color: C.text, label: 'pitch' });
    else vec(S, [bx, by], [0, c.v], k, { color: C.text, label: veiled ? 'v' : `${fig(c.exitMph)} mph` });
    if (after && !veiled && Math.abs(c.J) > 1e-3) vec(S, [0, -0.02 * L], [0, c.J], (0.3 * L * S.k) / Math.max(state.m * state.u, 1e-9), { color: C.teal, label: 'hands' });
    if (veiled) return;

    // Exit speed along the bat, with the centre of percussion marked.
    const vs = c.series.map((q) => q.v / MPH);
    const lo = Math.min(...vs);
    const hi = Math.max(...vs);
    const P = chartIn(B, right, { lo: 0.3, hi: 1 }, { lo: lo - 0.15 * (hi - lo || 1), hi: hi + 0.2 * (hi - lo || 1) });
    axes(P, { xLabel: 'contact point, fraction of the bat from the hands', yLabel: 'exit speed (mph)' });
    line(P, [[c.cpFrac, P.Y.lo], [c.cpFrac, P.Y.hi]], { color: C.teal, width: 1.5, dash: [4, 4] });
    note(P, 'no sting', c.cpFrac, P.Y.hi, { color: C.teal, dy: 12 });
    line(P, c.series.map((q, i) => [q.f, vs[i]]), { color: C.text, width: 2.5 });
    dot(P, state.dFrac, c.exitMph, { color: C.yellow, r: 5 });
  },
  law: () => [String.raw`I\omega_0 - m u d = I\omega_1 + m v d`, String.raw`v - \omega_1 d = e(\omega_0 d + u)`],
  liveRows(state, c) {
    return [
      kv('bat $I$ about the hands, $ML^2/3$', `${fig(c.I)} kg·m²`),
      kv('bat speed at contact, pitch', `${fig(c.batMph)} mph, ${fig(c.pitchMph)} mph`),
      kv('exit speed $v$', `${fig(c.v)} m/s = ${fig(c.exitMph)} mph`),
      kv('bat $\\omega$ after', `${fig(c.w1)} rad/s`),
      kv('hands’ impulse $J$', `${fig(c.J)} N·s`),
      kv('centre of percussion, best contact', `${fig(c.percussion)} m, ${fig(c.bestFrac * state.L)} m`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['exit speed', `${fig(c.exitMph)} mph`],
      ['bat at contact', `${fig(c.batMph)} mph`],
      ['sting J', `${fig(c.J)} N·s`],
      ['bat ω after', `${fig(c.w1)} rad/s`],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => {
    const atCp = Math.abs(c.J) < 0.02;
    return {
      title: atCp ? 'At the centre of percussion: no sting' : state.dFrac > c.cpFrac ? 'Off the end: fast bat, slower ball' : 'Inside the sweet spot: a jammed swing',
      body: [
        String.raw`About the hands the ball's impulse and the bat's turning trade angular momentum: $I\omega_0 - m u d = I\omega_1 + m v d$. With $e = ${fig(state.e)}$, the ball leaves at $${fig(c.v)}$ m/s, ${fig(c.exitMph)} mph.`,
        atCp
          ? String.raw`Here, $d = I/(M\bar x) = 2L/3$, the bat's own motion absorbs the ball's impulse and the hands give nothing.`
          : String.raw`The hands give an impulse of $${fig(c.J)}$ N·s. The best exit speed on this bat is at $${fig(c.bestFrac * state.L)}$ m from the hands: farther out the bat moves faster, but it gives way more, because less of its inertia stands behind the contact.`,
        'The ball is 5 to 5¼ oz (MLB rule 3.01) and the bat at most 42 in long (rule 3.02). College bats are certified to a BBCOR of 0.50 at most.',
      ],
    };
  }),
  predictions: [
    {
      id: 'bt-end',
      scenario: 'wood',
      ask: 'Meet the same pitch at the very end of the bat instead of two-thirds of the way out.',
      apply(s) { s.dFrac = 1; },
      watch: [
        { id: 'v', label: 'the ball’s exit speed', get: (c) => c.v },
        { id: 'J', label: 'the impulse the hands feel', get: (c) => c.J },
      ],
      mode: 'dir',
      expect: { v: 'smaller', J: 'bigger' },
      why: 'The end moves at 103 mph against 69 mph at two-thirds, yet the ball leaves at 104 mph instead of 105. Out at the end little of the bat’s inertia backs the contact, so it gives way. And the hands, which felt nothing at the centre of percussion, now take an impulse.',
    },
    {
      id: 'bt-heavy',
      scenario: 'wood',
      ask: 'Swing a 34 oz bat instead of a 31 oz one, at the same rate.',
      apply(s) { s.M = 0.96; },
      watch: [{ id: 'v', label: 'the ball’s exit speed', get: (c) => c.v }],
      mode: 'dir',
      expect: { v: 'bigger' },
      why: 'At the same swing rate the heavier bat carries more angular momentum into the contact, and gives way less: the exit speed rises from 105.4 to 108.4 mph. A real hitter swings a heavier bat more slowly, which is the trade-off.',
    },
    {
      id: 'bt-pitch',
      scenario: 'wood',
      ask: 'Face a 100 mph fastball instead of a 90 mph one, with the same swing.',
      apply(s) { s.u = 44.7; },
      watch: [{ id: 'v', label: 'the ball’s exit speed', get: (c) => c.v }],
      mode: 'dir',
      expect: { v: 'bigger' },
      why: 'Restitution acts on the closing speed, bat plus pitch. A faster pitch closes faster and rebounds faster: 108 mph instead of 105. That is why a fastball, squared up, goes farther.',
    },
  ],
});
