import { G } from '@flux/subjects/mechanics/constants.js';
import { counterweight, hoist, hoistBySystem, runProfile } from '@flux/subjects/mechanics/hoist.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, chartIn, circle, dot, hidden, label, line, note, poly, sceneIn, seg, split, vec } from './diagram.js';
import { defineLab } from './define2d.js';
import { PLAY, advance } from './motion.js';
import { bindSlider, leavesOut, slider } from './widgets.js';

/**
 * Application: a traction elevator (Hibbeler §17.4). A 1,000 kg car rated for 1,000 kg hangs from a
 * drive sheave; the counterweight on the other side is the empty car plus 40 to 50% of the rated
 * load, the range elevator makers use (TK Elevator). The car starts and stops at a steady
 * acceleration, kept under 1.5 m/s² to avoid exciting the ropes, and runs at 1.6 m/s. Shows that the
 * motor's torque depends on how far the load is from the balance point, not on the load itself; that
 * the rope tensions differ from the weights while the car speeds up or slows; and that the
 * counterweight and the sheave cost torque to accelerate even when the car is balanced.
 *
 * Recompute: ΣF = ma on the car and the counterweight, ΣM = Iα on the sheave. Check: the same three
 * equations solved as a linear system for a, T1 and T2 from the torque.
 */
const RATED = 1000;
const V = 1.6;
const RISE = 9;


const SCENARIOS = [
  { id: 'full', name: 'Full load going up', car: 1000, load: 1000, a: 1, q: 0.45, r: 0.32, I: 12, t: 0.8 },
  { id: 'balanced', name: 'Balanced: 450 kg going up', car: 1000, load: 450, a: 1, q: 0.45, r: 0.32, I: 12, t: 0.8 },
  { id: 'empty', name: 'Empty car going up', car: 1000, load: 0, a: 1, q: 0.45, r: 0.32, I: 12, t: 0.8 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  const { name, id: scId, ...rest } = sc;
  void name;
  Object.assign(state, { scenarioId: scId, anim: { playing: false }, show: { play: false }, ...rest });
}

const specOf = (s, load = s.load) => ({ m1: s.car + load, m2: counterweight(s.car, RATED, s.q), r: s.r, I: s.I });
const PHASE = { 1: 'speeding up', 0: 'cruising', '-1': 'slowing' };

const OUT = String.raw`The rope is inextensible, massless and never slips on the sheave. Real hoist ropes stretch, so the car bounces a little at each start and stop, and a tall building's ropes weigh as much as a passenger load, shifting the balance as the car climbs; compensating chains under the car cancel that. Real controllers also round the corners of the run, limiting the jerk, the rate of change of acceleration, for comfort. Friction in the guide rails and losses in the motor and any gearbox are left out, as are the safety gear and buffers.`;

export default defineLab({
  id: 'hoist',
  exam: 'u6',
  title: 'Elevator',
  gapLimit: 1e-9,
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  hint: 'The counterweight balances the car at about half load. The motor pays for the imbalance, and for accelerating everything.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('full', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'load', lo: 0, hi: RATED }),
  controls() {
    return `
      ${slider('hs-load', 'passengers and freight (kg), rated 1,000', 1000, 0, 1000, 10)}
      ${slider('hs-a', 'start and stop acceleration (m/s²)', 1, 0.3, 1.5, 0.05)}
      ${slider('hs-q', 'counterweight share of the rated load', 0.45, 0.4, 0.5, 0.01)}
      ${slider('hs-r', 'sheave radius r (m)', 0.32, 0.2, 0.5, 0.01)}
      ${slider('hs-I', 'sheave and rotor I (kg·m²)', 12, 0, 40, 1)}
      ${slider('hs-t', 'time into the run (s)', 0.8, 0, 9, 0.05)}
      <p class="tiny" id="hs-note">A 1,000 kg car rises 9 m at up to 1.6 m/s. Teal is a rope's pull, grey a weight, purple dashed m a, drawn six times larger: the kinetic diagram. The chart's three lines are the motor's torque speeding up, cruising and slowing.</p>`;
  },
  bind(api) {
    bindSlider('hs-load', (s, v) => { s.load = v; }, api);
    bindSlider('hs-a', (s, v) => { s.a = v; }, api);
    bindSlider('hs-q', (s, v) => { s.q = v; }, api);
    bindSlider('hs-r', (s, v) => { s.r = v; }, api);
    bindSlider('hs-I', (s, v) => { s.I = v; }, api);
    bindSlider('hs-t', (s, v) => { s.t = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('hs-load', state.load);
    set('hs-a', state.a);
    set('hs-q', state.q);
    set('hs-r', state.r);
    set('hs-I', state.I);
    set('hs-t', Number(state.t.toFixed(2)));
  },
  tick(dt, state) {
    return advance(state, dt, { lo: 0, hi: runProfile({ a: state.a, v: V, h: RISE }).total + 1, rate: 1 });
  },
  compute(state) {
    const spec = specOf(state);
    const run = runProfile({ a: state.a, v: V, h: RISE });
    const now = run.at(state.t);
    const up = hoist({ ...spec, a: state.a });
    const cruise = hoist({ ...spec, a: 0 });
    const down = hoist({ ...spec, a: -state.a });
    const cur = hoist({ ...spec, a: now.acc });
    const sys = hoistBySystem({ ...spec, M: cur.M });
    const gap = Math.max(Math.abs(sys.a - now.acc), Math.abs(sys.T1 - cur.T1) / cur.T1, Math.abs(sys.T2 - cur.T2) / cur.T2);
    const sign = now.acc > 0 ? 1 : now.acc < 0 ? -1 : 0;
    const loads = Array.from({ length: 21 }, (_, i) => (RATED * i) / 20);
    const series = [state.a, 0, -state.a].map((a) => loads.map((L) => [L, hoist({ ...specOf(state, L), a }).M]));
    return {
      m1: spec.m1,
      m2: spec.m2,
      Mup: up.M,
      Mcruise: cruise.M,
      Mdown: down.M,
      M: cur.M,
      T1: cur.T1,
      T2: cur.T2,
      T1up: up.T1,
      T2up: up.T2,
      acc: now.acc,
      y: now.y,
      v: now.v,
      phase: PHASE[sign],
      wRated: V / state.r,
      rpmRated: (V / state.r) * (60 / (2 * Math.PI)),
      Pcruise: (cruise.M * V) / state.r,
      tRated: run.t1,
      balance: counterweight(state.car, RATED, state.q) - state.car,
      series,
      gap,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const W = B.free.x1 - B.free.x0;
    const tall = !(W > 1.5 * (B.free.y1 - B.free.y0) && W > 560);
    const [left, right] = veiled ? [B.free, null] : split(B.free, tall ? 0.55 : 0.4);
    // The shaft, its 9 m rise drawn as 4 units so the car stays legible: the car on the left rope,
    // the counterweight on the right, the sheave above.
    const D = 4;
    const carH = 1.6;
    const cwH = 1.2;
    const rs = 0.5;
    const top = D + carH + 0.9;
    const S = sceneIn(B, left, { x0: -2.3, x1: 1.7, y0: -1.7, y1: top + 0.9 });
    circle(S, [0, top], rs, { stroke: C.gold, width: 2.5, fill: alpha(C.gold, 0.12) });
    const spoke = c.y / state.r;
    seg(S, [0, top], [rs * Math.cos(-spoke), top + rs * Math.sin(-spoke)], { color: C.gold, width: 2 });

    const carY = (c.y / RISE) * D;
    const cwY = D - carY;
    seg(S, [-rs, top], [-rs, carY + carH], { color: C.dim, width: 1.5 });
    seg(S, [rs, top], [rs, cwY + cwH], { color: C.dim, width: 1.5 });
    poly(S, [[-rs - 0.6, carY], [-rs + 0.6, carY], [-rs + 0.6, carY + carH], [-rs - 0.6, carY + carH]], { fill: alpha(C.blue, 0.3), stroke: C.blue, width: 1.5 });
    poly(S, [[rs - 0.25, cwY], [rs + 0.25, cwY], [rs + 0.25, cwY + cwH], [rs - 0.25, cwY + cwH]], { fill: alpha(C.text, 0.3), stroke: C.text, width: 1.5 });
    // The kinetic diagram on each body, one scale: rope pull, weight, and m a (drawn six times larger).
    // On a phone the drawing is small: the arrows stay, their names give way to the readout.
    const k = (1.3 * S.k) / Math.max(c.T1, c.T2, c.m1 * G);
    const roomy = S.k > 22;
    const tag = (t) => (roomy ? t : null);
    vec(S, [-rs, carY + carH], [0, c.T1], k, { color: C.teal, label: tag('T₁') });
    vec(S, [-rs, carY], [0, -c.m1 * G], k, { color: C.dim, label: tag('m₁g') });
    vec(S, [rs, cwY + cwH], [0, c.T2], k, { color: C.teal, label: tag('T₂') });
    vec(S, [rs, cwY], [0, -c.m2 * G], k, { color: C.dim, label: tag('m₂g') });
    if (Math.abs(c.acc) > 1e-9) {
      vec(S, [-rs - 0.95, carY + carH / 2], [0, c.m1 * c.acc], k * 6, { color: C.purple, dash: [5, 4], width: 2, label: tag('m₁a') });
      vec(S, [rs + 0.6, cwY + cwH / 2], [0, -c.m2 * c.acc], k * 6, { color: C.purple, dash: [5, 4], width: 2, label: tag('m₂a') });
    }
    if (roomy) {
      label(S, `sheave r = ${fig(state.r)} m`, [rs + 0.1, top + 0.3], { color: C.gold, align: 'left' });
      label(S, veiled ? c.phase : `${c.phase}, ${fig(c.v)} m/s`, [-2.2, top + 0.6], { color: C.muted, align: 'left' });
    }
    if (veiled) return;

    // The motor's torque against the load, for each phase of a run going up.
    const all = c.series.flat().map((p) => p[1]);
    const lo = Math.min(0, ...all) * 1.1;
    const hi = Math.max(0, ...all) * 1.1;
    const P = chartIn(B, right, { lo: 0, hi: RATED }, { lo, hi });
    axes(P, { xLabel: 'load in the car (kg)', yLabel: 'motor torque (N·m)' });
    line(P, [[0, 0], [RATED, 0]], { color: alpha(C.text, 0.4), width: 1 });
    const cols = [C.pink, C.gold, C.teal];
    const names = ['speeding up', 'cruising', 'slowing'];
    c.series.forEach((pts, i) => {
      line(P, pts, { color: cols[i], width: 2.2 });
      note(P, names[i], RATED * (0.15 + 0.3 * i), pts[3 + 6 * i][1], { color: cols[i], align: 'left', dx: 0, dy: -6 });
    });
    line(P, [[c.balance, lo], [c.balance, hi]], { color: alpha(C.text, 0.5), width: 1, dash: [4, 4] });
    note(P, 'balanced', c.balance, lo, { color: C.muted, dy: -6 });
    dot(P, state.load, c.M, { color: C.yellow, r: 5 });
  },
  law: () => [String.raw`M = r\,(m_1 - m_2)\,g + \left(m_1 + m_2 + \frac{I}{r^2}\right) a\,r`, String.raw`T_1 = m_1(g + a),\quad T_2 = m_2(g - a)`],
  liveRows(state, c) {
    return [
      kv('car $m_1$, counterweight $m_2$', `${fig(c.m1)} kg, ${fig(c.m2)} kg`),
      kv('torque speeding up, cruising, slowing', `${fig(c.Mup)}, ${fig(c.Mcruise)}, ${fig(c.Mdown)} N·m`),
      kv('rope tensions now, $T_1$ and $T_2$', `${fig(c.T1)} N, ${fig(c.T2)} N`),
      kv('sheave at 1.6 m/s', `${fig(c.wRated)} rad/s = ${fig(c.rpmRated)} rpm`),
      kv('power cruising, $M\\omega$', `${fig(c.Pcruise / 1000)} kW`),
      kv('time to 1.6 m/s', `${fig(c.tRated)} s`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['phase', c.phase],
      ['torque', `${fig(c.M)} N·m`],
      ['T₁', `${fig(c.T1)} N`],
      ['T₂', `${fig(c.T2)} N`],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => {
    const heavy = c.m1 > c.m2;
    return {
      title: Math.abs(c.Mcruise) < 1 ? 'Balanced: cruising needs no torque' : heavy ? 'The car side is heavier' : 'The counterweight side is heavier',
      body: [
        String.raw`The car with its load is ${fig(c.m1)} kg; the counterweight is ${fig(c.m2)} kg. Cruising, the motor holds $r(m_1 - m_2)g = ${fig(c.Mcruise)}$ N·m${heavy ? '' : ': negative, so it brakes the counterweight'}.`,
        String.raw`Speeding up at ${fig(state.a)} m/s² adds $(m_1 + m_2 + I/r^2)\,a\,r = ${fig(c.Mup - c.Mcruise)}$ N·m, whatever the load: every mass and the sheave must speed up together.`,
        String.raw`While it speeds up, the car's rope pulls $T_1 = m_1(g + a) = ${fig(c.T1up)}$ N and the counterweight's $T_2 = m_2(g - a) = ${fig(c.T2up)}$ N. Neither is a weight.`,
      ],
    };
  }),
  predictions: [
    {
      id: 'hs-balance',
      scenario: 'balanced',
      ask: 'With 450 kg in the car and the counterweight at 45% of the rated load, the car is cruising up at 1.6 m/s.',
      apply(s) { s.t = 4; },
      watch: [{ id: 'need', label: 'the motor must supply torque to keep it moving', get: (c) => Math.abs(c.M) > 1, mode: 'bool' }],
      mode: 'bool',
      expect: { need: false },
      why: 'Car and load, 1,450 kg, match the counterweight, 1,450 kg. Cruising, both ropes pull 14,225 N and their moments on the sheave cancel. Friction aside, the motor only works to speed the car up and slow it down.',
    },
    {
      id: 'hs-empty',
      scenario: 'empty',
      ask: 'The empty car cruises up at 1.6 m/s.',
      apply(s) { s.t = 4; },
      watch: [{ id: 'brake', label: 'the motor must hold back (a negative torque)', get: (c) => c.M < 0, mode: 'bool' }],
      mode: 'bool',
      expect: { brake: true },
      why: 'The counterweight, 1,450 kg, outweighs the empty 1,000 kg car. It would pull the car up on its own, so the motor holds it back with $r(m_1 - m_2)g = -1{,}413$ N·m and can return that energy to the building.',
    },
    {
      id: 'hs-tension',
      scenario: 'full',
      ask: 'The full car stops speeding up and cruises at 1.6 m/s.',
      apply(s) { s.t = 4; },
      watch: [
        { id: 'T1', label: 'the car’s rope tension', get: (c) => c.T1 },
        { id: 'T2', label: 'the counterweight’s rope tension', get: (c) => c.T2 },
      ],
      mode: 'dir',
      expect: { T1: 'smaller', T2: 'bigger' },
      why: 'Speeding up, the car’s rope must also accelerate it: $T_1 = m_1(g + a) = 21{,}620$ N falls to the weight, 19,620 N. The counterweight was accelerating down, so its rope pulled less than its weight: $T_2$ rises from 12,775 N to 14,225 N.',
    },
  ],
});
