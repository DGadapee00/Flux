import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, note, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider, leavesOut } from './widgets.js';

const G_EARTH = 9.81;

/**
 * Application: a lander touching down on crushable pads (Hibbeler §14.1–14.3). An aluminium
 * honeycomb pad crushes at a nearly constant force F. From touchdown at v₀ to rest, the pad's work
 * F·s takes the kinetic energy and the weight's work over the same stroke: F s = ½mv₀² + mg s. If the
 * stroke needed is longer than the pad, the lander reaches the hard stop still moving.
 */
const SCENARIOS = [
  { id: 'hopper', name: 'Hop-test vehicle on Earth', m: 250, v0: 3, F: 6952.5, L: 0.3, g: G_EARTH },
  { id: 'lunar', name: 'Lunar lander, gentle touchdown', m: 1200, v0: 2, F: 13944, L: 0.3, g: 1.62 },
  { id: 'hard', name: 'Hop-test vehicle, hard landing', m: 250, v0: 4.5, F: 6952.5, L: 0.3, g: G_EARTH },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, m: sc.m, v0: sc.v0, F: sc.F, L: sc.L, g: sc.g });
}

/** The touchdown in closed form: the stroke the pad needs, and what happens if it is not there. */
export function touchdown({ m, v0, F, L, g }) {
  const W = m * g;
  const a = (F - W) / m;
  const stops = a > 0;
  const need = stops ? (0.5 * m * v0 * v0) / (F - W) : null;
  const bottoms = !stops || need > L;
  const used = bottoms ? L : need;
  const vHit = bottoms ? Math.sqrt(Math.max(0, v0 * v0 - 2 * a * L)) : 0;
  const tStop = Math.abs(a) < 1e-12 ? used / v0 : (v0 - vHit) / a;
  return { W, a, stops, need, bottoms, used, vHit, tStop, decelG: a / G_EARTH, ke: 0.5 * m * v0 * v0 };
}

/**
 * Second method: step the crush in time. The pad and the weight give a constant net force, so v
 * falls linearly; the stroke is the area under v, by trapezoids, stopped where v reaches zero or the
 * stroke reaches the pad's length.
 */
function stepCrush({ m, v0, F, L, g }) {
  const a = (F - m * g) / m;
  const tEnd = a > 0 ? v0 / a : (2 * L) / v0;
  const dt = tEnd / 20000;
  let v = v0;
  let s = 0;
  for (let i = 0; i < 400000; i++) {
    const v1 = v - a * dt;
    if (v1 <= 0) return { used: s + 0.5 * v * (v / a), vHit: 0 };
    const s1 = s + 0.5 * (v + v1) * dt;
    if (s1 >= L) {
      const f = (L - s) / (s1 - s);
      return { used: L, vHit: v + (v1 - v) * f };
    }
    s = s1;
    v = v1;
  }
  return { used: s, vHit: v };
}

/** What the real device has that the model ignores (D30). */
const OUT = String.raw`The pad here crushes at one steady force. A real honeycomb pad has a peak force before it starts to crush, then a plateau, then a steep rise when it is fully crushed. The lander is one rigid mass, with no leg flex or rebound, and all its legs touch at the same instant. A lander that touches one leg first, or comes in with sideways speed, is the tip-over problem of Unit 7.`;

export default defineLab({
  id: 'landing',
  exam: 'u3',
  title: 'Touchdown',
  hint: 'Change the touchdown speed or the crush force. The pad must do F·s = ½mv₀² + mg·s.',
  gapLimit: 1e-4,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('hopper', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'v0', lo: 0.5, hi: 8 }),
  controls() {
    return `
      ${slider('ld-v0', 'touchdown speed v₀ (m/s)', 3, 0.5, 8, 0.1)}
      ${slider('ld-F', 'crush force F (kN)', 6.95, 1, 30, 0.05)}
      ${slider('ld-L', 'pad length L (m)', 0.3, 0.1, 1, 0.01)}
      <p class="tiny" id="ld-note"></p>`;
  },
  bind(api) {
    bindSlider('ld-v0', (s, v) => { s.v0 = v; }, api);
    bindSlider('ld-F', (s, v) => { s.F = v * 1000; }, api);
    bindSlider('ld-L', (s, v) => { s.L = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('ld-v0', state.v0);
    set('ld-F', Number((state.F / 1000).toFixed(2)));
    set('ld-L', state.L);
    const n = document.getElementById('ld-note');
    if (n) n.textContent = `Mass ${fig(state.m)} kg, local g = ${fig(state.g)} m/s². The pad crushes at a constant force. No rebound.`;
  },
  compute(state) {
    const t = touchdown(state);
    const num = stepCrush(state);
    return {
      m: state.m,
      v0: state.v0,
      F: state.F,
      L: state.L,
      g: state.g,
      ...t,
      usedNum: num.used,
      vHitNum: num.vHit,
      gap: Math.abs(num.used - t.used) / t.used + Math.abs(num.vHit - t.vHit) / state.v0,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const xm = B.free.x0 + Math.max(130, 0.32 * W);
    const left = { ...B.free, x1: xm };
    const right = { ...B.free, x0: xm };

    // The lander on its pad, to scale in height: the pad crushed by the stroke used.
    const H = Math.max(1.2, c.L * 3);
    const S = plotIn(B, left, { lo: -1, hi: 1 }, { lo: -0.18 * H, hi: H }, { left: 8, right: 8, top: 26, bottom: 40 });
    seg(S, [-0.95, 0], [0.95, 0], { color: C.dim, width: 2 });
    const top = c.L - c.used;
    poly(S, [[-0.35, 0], [0.35, 0], [0.35, top], [-0.35, top]], { fill: alpha(C.gold, 0.45), stroke: C.gold, width: 1.5 });
    if (c.used < c.L) poly(S, [[-0.35, top], [0.35, top], [0.35, c.L], [-0.35, c.L]], { fill: null, stroke: alpha(C.gold, 0.5), width: 1, dash: [4, 4] });
    // The lander stands on the crushed pad: feet on its top face, legs splayed, body above.
    const body = top + 0.1 * H;
    seg(S, [-0.25, top], [-0.45, body], { color: C.text, width: 2 });
    seg(S, [0.25, top], [0.45, body], { color: C.text, width: 2 });
    poly(S, [[-0.55, body], [0.55, body], [0.4, body + 0.2 * H], [-0.4, body + 0.2 * H]], { fill: alpha(C.text, 0.85), stroke: null });
    label(S, `pad ${fig(c.L)} m`, [-0.95, -0.06 * H], { align: 'left', color: C.gold });
    label(S, c.bottoms ? `hits the stop at ${fig(c.vHit)} m/s` : `stops after ${fig(c.used)} m`, [-0.95, -0.13 * H], { align: 'left', color: c.bottoms ? C.red : C.teal });

    // Energy against stroke: the pad's work F·s, and what it must take, ½mv₀² + mg·s.
    const reach = c.stops ? Math.min(c.need, 3 * c.L) : 3 * c.L;
    const sMax = Math.max(1.2 * c.L, 1.1 * reach);
    const eMax = Math.max(c.F * sMax, c.ke + c.W * sMax) * 1.08;
    const P = plotIn(B, right, { lo: 0, hi: sMax }, { lo: 0, hi: eMax });
    axes(P, { xLabel: 'stroke s (m)', yLabel: 'energy (J)' });
    line(P, [[0, 0], [sMax, c.F * sMax]], { color: C.gold, width: 2 });
    line(P, [[0, c.ke], [sMax, c.ke + c.W * sMax]], { color: C.text, width: 2 });
    line(P, [[c.L, 0], [c.L, eMax]], { color: alpha(C.red, 0.6), width: 1, dash: [4, 4] });
    note(P, 'pad F·s', sMax * 0.92, Math.min(c.F * sMax * 0.92, eMax * 0.8), { color: C.gold, align: 'right', dx: -10, dy: 0 });
    note(P, '½mv₀² + mg·s', sMax * 0.05, c.ke + c.W * sMax * 0.05, { color: C.text, dy: -10 });
    note(P, 'end of pad', c.L, eMax * 0.95, { color: C.red });
    if (c.stops && c.need <= sMax) dot(P, c.need, c.F * c.need, { color: c.bottoms ? C.red : C.yellow, r: 5 });
  },
  law: () => [String.raw`F\,s = \tfrac12 m v_0^2 + m g\,s`, String.raw`s = \frac{m v_0^2}{2(F - mg)},\quad a = \frac{F}{m} - g`],
  liveRows(state, c) {
    return [
      kv('$\\tfrac12 m v_0^2$', `${fig(c.ke)} J`),
      kv('$F - mg$', `${fig(c.F - c.W)} N`),
      kv('stroke needed', c.stops ? `${fig(c.need)} m` : 'never stops'),
      kv('stroke used, time-stepped', `${fig(c.usedNum)} m`),
      kv('speed at the stop', `${fig(c.vHit)} m/s`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['stroke', c.stops ? `${fig(c.need)} m` : '—'],
      ['decel', `${fig(c.decelG)} g`],
      ['stop time', `${fig(c.tStop)} s`],
      ['at the stop', `${fig(c.vHit)} m/s`],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => {
    if (!c.stops) {
      return { title: 'The pad cannot hold the weight', body: String.raw`The crush force $${fig(c.F)}$ N is less than the weight $${fig(c.W)}$ N. The lander keeps speeding up through the pad.` };
    }
    if (c.bottoms) {
      return {
        title: 'The pad bottoms out',
        body: String.raw`It needs $${fig(c.need)}$ m of stroke and has $${fig(c.L)}$ m. The lander reaches the hard stop at $${fig(c.vHit)}$ m/s.`,
      };
    }
    return {
      title: 'Stops inside the pad',
      body: String.raw`The pad takes $${fig(c.ke)}$ J of motion and $${fig(c.W * c.need)}$ J from the weight over $${fig(c.need)}$ m, at $${fig(c.decelG)}$ g.`,
    };
  }),
  predictions: [
    {
      id: 'ld-faster',
      scenario: 'hopper',
      ask: 'Touch down twice as fast, at 6 m/s instead of 3 m/s, on the same pad.',
      apply(s) { s.v0 = 6; },
      watch: [
        { id: 'need', label: 'the stroke the pad needs', get: (c) => c.need },
        { id: 'decel', label: 'the deceleration while crushing', get: (c) => c.a },
      ],
      mode: 'factor',
      expect: { need: 4, decel: 1 },
      why: 'The crush force is fixed, so the deceleration stays $18$ m/s², $1.83$ g. The stroke is $v_0^2/2a$: twice the speed needs four times the stroke, $0.25$ m becomes $1.0$ m. The $0.30$ m pad bottoms out.',
    },
    {
      id: 'ld-earth',
      scenario: 'lunar',
      ask: 'Fly the same lander, pad and touchdown speed on Earth instead of the Moon.',
      apply(s) { s.g = 9.81; },
      watch: [
        { id: 'need', label: 'the stroke the pad needs', get: (c) => c.need },
        { id: 'decel', label: 'the deceleration while crushing', get: (c) => c.a },
      ],
      mode: 'dir',
      expect: { need: 'bigger', decel: 'smaller' },
      why: 'The weight works against the pad over the whole stroke. On the Moon $F - mg = 12{,}000$ N; on Earth only $2{,}172$ N is left to stop the lander. The deceleration falls from $10$ to $1.81$ m/s², and the stroke grows from $0.20$ m to $1.10$ m.',
    },
    {
      id: 'ld-soft',
      scenario: 'hopper',
      ask: 'Halve the crush force, for a softer ride.',
      apply(s) { s.F /= 2; },
      watch: [{ id: 'need', label: 'the stroke the pad needs', get: (c) => c.need }],
      mode: 'dir',
      expect: { need: 'bigger' },
      why: 'Not twice: $4.4$ times. Only $F - mg$ stops the lander. Halving $F$ from $6{,}953$ N takes $F - mg$ from $4{,}500$ N to $1{,}024$ N, so the stroke grows from $0.25$ m to $1.10$ m.',
    },
  ],
});
