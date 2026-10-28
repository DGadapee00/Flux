import { G } from '@flux/subjects/mechanics/constants.js';
import { crushDepth, minDuration, motionAt, shapeAt, stopPulse, stopPulseNumeric } from '@flux/subjects/mechanics/impact-pulse.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, chartIn, circle, dot, fillUnder, hidden, label, line, note, poly, sceneIn, split, vec } from './diagram.js';
import { defineLab } from './define2d.js';
import { PLAY, advance } from './motion.js';
import { bindSlider, leavesOut, slider } from './widgets.js';

/**
 * Application: a bicycle helmet's drop test (Hibbeler §15.1). The US safety standard, 16 CFR 1203
 * (CPSC), drops a helmet on a 5.0 kg headform assembly onto a steel anvil at 6.2 m/s, about a 2 m
 * fall, and fails it if the headform's peak acceleration passes 300 g. The impulse the anvil must
 * give is fixed by the drop: m(1 + e)v0. Shows that the liner cannot change that impulse; it can
 * only spread it over more time, and a longer, flatter pulse means a lower peak.
 *
 * Recompute: impulse and momentum, and the pulse's shape. Check: RK4 on m a = F(t) − mg through
 * the pulse, which must end at the rebound speed e·v0 and agree on the crush depth.
 */
const SCENARIOS = [
  { id: 'cpsc', name: 'CPSC flat-anvil drop, EPS liner', m: 5, h: 1.96, tau: 6, e: 0.1, shape: 'half-sine', t: 3 },
  { id: 'bare', name: 'No helmet: headform on steel', m: 5, h: 1.96, tau: 1, e: 0.5, shape: 'half-sine', t: 0.5 },
  { id: 'ideal', name: 'An ideal liner: a square pulse', m: 5, h: 1.96, tau: 6, e: 0.1, shape: 'square', t: 3 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  const { name, id: scId, ...rest } = sc;
  void name;
  Object.assign(state, { scenarioId: scId, anim: { playing: false }, show: { play: false }, ...rest });
}

const LIMIT = 300;
const specOf = (s) => ({ m: s.m, v0: Math.sqrt(2 * G * s.h), e: s.e, tau: s.tau / 1000, shape: s.shape });

const OUT = String.raw`The liner's force is a fixed pulse shape, half-sine or square. Real foam stiffens as it compacts, so the force climbs at the end of the crush, and a liner too thin for the drop bottoms out with a spike. The headform is rigid and drops straight; real tests also strike the hemispherical and kerbstone anvils, at several sites, after hot, cold and wet conditioning. The 300 g limit is on the whole head's acceleration; how the brain moves inside the skull, and rotation, are left out.`;

export default defineLab({
  id: 'helmet',
  exam: 'u4',
  title: 'Helmet',
  gapLimit: 1e-5,
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  hint: 'The drop fixes the impulse. The liner spreads it over more time, so the peak falls.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('cpsc', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'tau', lo: 0.5, hi: 15 }),
  controls() {
    return `
      ${slider('hm-tau', 'pulse length τ (ms)', 6, 0.5, 15, 0.1)}
      ${slider('hm-e', 'rebound e', 0.1, 0, 0.8, 0.05)}
      ${slider('hm-h', 'drop height h (m)', 1.96, 0.5, 4, 0.01)}
      ${slider('hm-t', 'time from contact (ms)', 3, -2, 18, 0.05)}
      <p class="tiny">The headform falls onto a steel anvil. Teal is the anvil's push, grey the weight, white the velocity. The chart's shaded area is the impulse; the dashed line is the 300 g limit.</p>`;
  },
  bind(api) {
    bindSlider('hm-tau', (s, v) => { s.tau = v; }, api);
    bindSlider('hm-e', (s, v) => { s.e = v; }, api);
    bindSlider('hm-h', (s, v) => { s.h = v; }, api);
    bindSlider('hm-t', (s, v) => { s.t = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('hm-tau', state.tau);
    set('hm-e', state.e);
    set('hm-h', state.h);
    set('hm-t', state.t);
  },
  tick(dt, state) {
    return advance(state, dt, { lo: -2, hi: state.tau + 3, rate: 2 });
  },
  compute(state) {
    const spec = specOf(state);
    const p = stopPulse(spec);
    const c = crushDepth(spec);
    const n = stopPulseNumeric(spec);
    const gap = Math.max(Math.abs(n.vEnd - spec.e * spec.v0) / spec.v0, Math.abs(n.crush - c.crush) / Math.max(1e-6, c.crush));
    const tau = spec.tau;
    const tMs = state.t;
    const tS = tMs / 1000;
    const now = tS < 0 ? { v: -spec.v0, x: 0 } : tS > tau ? { v: spec.e * spec.v0, x: motionAt(spec, tau).x + spec.e * spec.v0 * (tS - tau) } : motionAt(spec, tS);
    const series = Array.from({ length: 121 }, (_, i) => {
      const t = -0.15 * tau + (1.3 * tau * i) / 120;
      return [t * 1000, (p.Fpk * shapeAt(spec.shape, t, tau)) / (spec.m * G)];
    });
    return {
      ...p,
      v0: spec.v0,
      crush: c.crush,
      tCrush: c.tCrush,
      tauMin: minDuration({ v0: spec.v0, e: spec.e, shape: spec.shape, limitG: LIMIT }) * 1000,
      pass: p.gPeak <= LIMIT,
      fNow: (p.Fpk * shapeAt(spec.shape, tS, tau)) / (spec.m * G),
      vNow: now.v,
      xNow: now.x,
      series,
      gap,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const W = B.free.x1 - B.free.x0;
    const tall = !(W > 1.5 * (B.free.y1 - B.free.y0) && W > 560);
    const [left, right] = veiled ? [B.free, null] : split(B.free, tall ? 0.5 : 0.42);
    const S = sceneIn(B, left, { x0: -0.2, x1: 0.2, y0: -0.05, y1: 0.31 });
    // The anvil, then the headform and liner: the liner squashes by the crush so far.
    poly(S, [[-0.16, 0], [0.16, 0], [0.16, -0.04], [-0.16, -0.04]], { fill: alpha(C.text, 0.25), stroke: C.text, width: 1.5 });
    const liner = 0.025;
    const squash = Math.max(0, -Math.min(0, c.xNow));
    const gapAbove = state.t < 0 ? (-state.t / 1000) * c.v0 : 0;
    const R = 0.09;
    const shell = R + liner - Math.min(squash, liner * 0.95);
    const yc = shell + gapAbove;
    circle(S, [0, yc], shell, { stroke: alpha(C.gold, 0.8), fill: alpha(C.gold, 0.15), width: 1.5 });
    circle(S, [0, yc], R, { stroke: C.text, fill: alpha(C.text, 0.12), width: 1.5 });
    const r = R * S.k;
    // On a phone the scene is small: the arrows scale with the headform, and the name gives way.
    if (r > 30) label(S, '5.0 kg headform', [0, yc + shell], { color: C.muted, dy: -10 });
    // The free-body diagram: the anvil's push at the contact, scaled to this pulse's peak, and the weight.
    const fLen = 1.5 * r * Math.min(1, c.fNow / Math.max(c.gPeak, LIMIT));
    if (c.fNow > 1e-3) vec(S, [0, yc - shell], [0, 1], fLen, { color: C.teal, label: 'F' });
    vec(S, [-(R + liner + 0.03), yc + 0.3 * R], [0, -1], 0.45 * r, { color: C.dim, label: 'mg' });
    vec(S, [R + liner + 0.03, yc + 0.3 * R], [0, c.vNow], r / Math.max(c.v0, 1e-9), { color: C.text, label: 'v' });
    if (veiled) return;

    // The contact force in g against time: the area is the impulse.
    const yMax = Math.max(LIMIT * 1.15, ...c.series.map((q) => q[1]) ) * 1.05;
    const P = chartIn(B, right, { lo: c.series[0][0], hi: c.series[c.series.length - 1][0] }, { lo: 0, hi: yMax });
    axes(P, { xLabel: 'time from contact (ms)', yLabel: 'anvil force / weight (g)' });
    fillUnder(P, c.series, alpha(C.teal, 0.2));
    line(P, c.series, { color: C.teal, width: 2.5 });
    line(P, [[P.X.lo, LIMIT], [P.X.hi, LIMIT]], { color: C.red, width: 1.5, dash: [6, 4] });
    note(P, '300 g limit, 16 CFR 1203', P.X.lo + 0.02 * (P.X.hi - P.X.lo), LIMIT, { color: C.red, dy: -6 });
    note(P, `impulse ${fig(c.J)} N·s`, state.tau * 0.5, c.gPeak * 0.4, { color: C.teal, align: 'center', dx: 0 });
    dot(P, state.t, c.fNow, { color: C.yellow, r: 4 });
  },
  law: () => [String.raw`\int F\,dt - mg\tau = m(1+e)v_0`, String.raw`\text{half-sine: } F_{pk} = \frac{\pi}{2}\,\frac{\int F\,dt}{\tau}`],
  liveRows(state, c) {
    return [
      kv('impact speed $\\sqrt{2gh}$', `${fig(c.v0)} m/s`),
      kv('impulse from the anvil', `${fig(c.J)} N·s`),
      kv('peak force, peak g', `${fig(c.Fpk)} N, ${fig(c.gPeak)} g`),
      kv('mean over the pulse', `${fig(c.gMean)} g`),
      kv('liner crush', `${fig(c.crush * 1000)} mm`),
      kv('shortest pulse for 300 g', `${fig(c.tauMin)} ms`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['peak', `${fig(c.gPeak)} g`],
      ['impulse', `${fig(c.J)} N·s`],
      ['crush', `${fig(c.crush * 1000)} mm`],
      ['verdict', c.pass ? 'passes' : 'fails'],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => ({
    title: c.pass ? `Passes: ${Math.round(c.gPeak)} g, under 300` : `Fails: ${Math.round(c.gPeak)} g, over 300`,
    body: [
      String.raw`The drop fixes the impulse: the anvil must take the headform from ${fig(c.v0)} m/s down to a rebound of ${fig(state.e * c.v0)} m/s up, $m(1 + e)v_0 + mg\tau = ${fig(c.J)}$ N·s.`,
      String.raw`Spread over ${fig(state.tau)} ms as a ${state.shape === 'square' ? 'square pulse' : 'half-sine'}, that peaks at $${fig(c.Fpk)}$ N, ${fig(c.gPeak)} times the weight. Staying under 300 g needs at least ${fig(c.tauMin)} ms, and the liner crushes ${fig(c.crush * 1000)} mm.`,
      'The standard is 16 CFR 1203 (US CPSC): a 5.0 kg headform assembly onto a flat steel anvil at 6.2 m/s, peak acceleration no more than 300 g.',
    ],
  })),
  predictions: [
    {
      id: 'hm-tau',
      scenario: 'cpsc',
      ask: 'Use a thicker, softer liner that stretches the pulse from 6 ms to 12 ms.',
      apply(s) { s.tau = 12; },
      tol: 0.02,
      watch: [
        { id: 'J', label: 'the impulse from the anvil', get: (c) => c.J, mode: 'dir' },
        { id: 'g', label: 'the peak acceleration', get: (c) => c.gPeak },
      ],
      mode: 'factor',
      expect: { J: 'same', g: 0.5 },
      why: 'The impulse is set by the drop: 34.4 N·s either way, give or take the weight’s small share. Spread over twice the time, the force needs only half the height: 184 g becomes 92.6 g. The liner pays for it with twice the crush, 17 to 35 mm.',
    },
    {
      id: 'hm-bounce',
      scenario: 'cpsc',
      ask: 'Swap the foam for a springy liner that throws the headform back at 0.6 of its impact speed, with the same 6 ms pulse.',
      apply(s) { s.e = 0.6; },
      watch: [
        { id: 'J', label: 'the impulse from the anvil', get: (c) => c.J },
        { id: 'g', label: 'the peak acceleration', get: (c) => c.gPeak },
      ],
      mode: 'dir',
      expect: { J: 'bigger', g: 'bigger' },
      why: 'The anvil must now stop the headform and throw it back: $m(1 + e)v_0$ grows from 34.1 to 49.6 N·s. In the same 6 ms that peaks at 266 g instead of 184 g. A good liner crushes and stays crushed; that is why helmets are made of foam, not rubber.',
    },
    {
      id: 'hm-square',
      scenario: 'cpsc',
      ask: 'Keep the impulse and the 6 ms, but make the force flat, a square pulse, instead of a half-sine.',
      apply(s) { s.shape = 'square'; },
      watch: [{ id: 'g', label: 'the peak acceleration', get: (c) => c.gPeak }],
      mode: 'dir',
      expect: { g: 'smaller' },
      why: 'The same area under a flat line needs a lower top: the half-sine peaks $\\pi/2$ times its mean, the square pulse at its mean. 184 g falls to 117 g. Foams are chosen for a flat crush plateau for exactly this reason.',
    },
  ],
});
