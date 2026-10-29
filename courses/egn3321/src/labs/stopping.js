import { G_FT } from '@flux/subjects/mechanics/constants.js';
import { FPS_PER_MPH, stepStop, stopDistance } from '@flux/subjects/mechanics/stopping.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, chartIn, dot, hidden, label, line, note, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { PLAY, advance } from './motion.js';
import { bindSlider, leavesOut, slider } from './widgets.js';

/**
 * Application: the stopping sight distance of a road (Hibbeler §14.1–14.3). AASHTO's design policy
 * (A Policy on Geometric Design of Highways and Streets, 2011, §3.2.2) gives every road enough
 * sight line for a driver to see an object, react for 2.5 s, and brake at 11.2 ft/s² to a stop:
 * SSD = 1.47 V t + 1.075 V²/a, about 566 ft at 60 mph. Shows that the brakes take kinetic energy at
 * a fixed rate per foot, so twice the speed needs four times the braking distance, while the
 * reaction distance only doubles; and that a downgrade, where the weight does positive work,
 * stretches the stop past a sight line built for the level.
 *
 * Recompute: work and energy along the road. Check: stepping the motion in time.
 */
const SCENARIOS = [
  { id: 'design60', name: 'Level highway, 60 mph, AASHTO driver', V: 60, t: 2.5, a: 11.2, grade: 0, sight: 570, clock: 0 },
  { id: 'down6', name: 'The same sight line on a 6% downgrade', V: 60, t: 2.5, a: 11.2, grade: -0.06, sight: 570, clock: 0 },
  { id: 'city30', name: 'City street, 30 mph', V: 30, t: 2.5, a: 11.2, grade: 0, sight: 200, clock: 0 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  const { name, id: scId, ...rest } = sc;
  void name;
  Object.assign(state, { scenarioId: scId, anim: { playing: false }, show: { play: false }, ...rest });
}

const specOf = (s) => ({ Vmph: s.V, t: s.t, a: s.a, grade: s.grade });

/** The highest speed that stops inside the sight line: S = v t + v²/(2d), solved for v. */
function speedFor(sight, t, decel) {
  return decel * (-t + Math.sqrt(t * t + (2 * sight) / decel));
}

/** Where the car is, and how fast, `clock` seconds after the driver sees the object. */
function stateAt(d, t, clock) {
  if (clock <= t) return { x: d.v * clock, v: d.v };
  const tb = Math.min(clock - t, d.tBrake);
  return { x: d.reaction + d.v * tb - 0.5 * d.decel * tb * tb, v: d.v - d.decel * tb };
}

const OUT = String.raw`The deceleration is one steady number. AASHTO's 11.2 ft/s², about 0.35 g, is a rate 90% of drivers brake harder than; a modern car on dry pavement can do far better, and on wet pavement, or with worn tyres, worse. The car is a point: the load shifting onto the front wheels, and the anti-lock system's pulsing, are left out. So is how the sight line is measured: AASHTO takes the driver's eye 3.5 ft up and the object 2.0 ft tall, which sets how long a crest curve must be.`;

export default defineLab({
  id: 'stopping',
  exam: 'u3',
  title: 'Stopping',
  gapLimit: 1e-6,
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  hint: 'The brakes take kinetic energy at a fixed rate per foot. Twice the speed needs four times the braking distance.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('design60', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'V', lo: 20, hi: 80 }),
  controls() {
    return `
      ${slider('st-V', 'speed V (mph)', 60, 20, 80, 1)}
      ${slider('st-t', 'reaction time t (s)', 2.5, 0.5, 3.5, 0.1)}
      ${slider('st-a', 'braking a on the level (ft/s²)', 11.2, 5, 25, 0.1)}
      ${slider('st-G', 'grade G (%, downhill negative)', 0, -10, 10, 0.5)}
      ${slider('st-S', 'sight distance (ft)', 570, 100, 1200, 5)}
      ${slider('st-c', 'time since the driver sees it (s)', 0, 0, 16, 0.05)}
      <p class="tiny">Grey is the reaction distance, teal the braking distance, red the object at the end of the sight line. On the chart, white is the speed and teal the kinetic energy, each as a share of its start.</p>`;
  },
  bind(api) {
    bindSlider('st-V', (s, v) => { s.V = v; }, api);
    bindSlider('st-t', (s, v) => { s.t = v; }, api);
    bindSlider('st-a', (s, v) => { s.a = v; }, api);
    bindSlider('st-G', (s, v) => { s.grade = v / 100; }, api);
    bindSlider('st-S', (s, v) => { s.sight = v; }, api);
    bindSlider('st-c', (s, v) => { s.clock = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('st-V', state.V);
    set('st-t', state.t);
    set('st-a', state.a);
    set('st-G', Number((state.grade * 100).toFixed(1)));
    set('st-S', state.sight);
    set('st-c', Number(state.clock.toFixed(2)));
  },
  tick(dt, state) {
    const d = stopDistance(specOf(state));
    const end = Number.isFinite(d.tBrake) ? state.t + d.tBrake + 1.5 : 16;
    return advance(state, dt, { lo: 0, hi: Math.min(16, end), rate: 1, key: 'clock' });
  },
  compute(state) {
    const d = stopDistance(specOf(state));
    const n = stepStop(specOf(state));
    const stops = Number.isFinite(d.braking);
    const gap = stops ? Math.abs(n.total - d.total) / d.total : 0;
    const hits = !stops || d.total > state.sight;
    // The speed left at the object, if the stop runs past the sight line.
    const left = !hits ? 0 : state.sight <= d.reaction ? d.v : Math.sqrt(Math.max(0, d.v * d.v - 2 * d.decel * (state.sight - d.reaction)));
    const vMax = d.decel > 0 ? speedFor(state.sight, state.t, d.decel) / FPS_PER_MPH : 0;
    let now = stateAt(d, state.t, state.clock);
    if (now.x > state.sight) now = { x: state.sight, v: 0, crashed: true };
    const xEnd = stops ? d.total : state.sight * 1.3;
    const xMax = Math.max(state.sight, Math.min(xEnd, 3 * state.sight)) * 1.08;
    const series = Array.from({ length: 121 }, (_, i) => {
      const x = (xMax * i) / 120;
      const sb = x - d.reaction;
      const v2 = sb <= 0 ? d.v * d.v : Math.max(0, d.v * d.v - 2 * d.decel * sb);
      return [x, Math.sqrt(v2) / d.v, v2 / (d.v * d.v)];
    });
    return {
      ...d,
      stops,
      hits,
      vLeft: left / FPS_PER_MPH,
      vMax,
      fFactor: state.a / G_FT,
      xNow: now.x,
      vNow: now.v / FPS_PER_MPH,
      crashed: !!now.crashed,
      xMax,
      series,
      gap,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const H = B.free.y1 - B.free.y0;
    const top = veiled ? B.free : { ...B.free, y1: B.free.y0 + 0.34 * H };
    const bottom = { ...B.free, y0: B.free.y0 + 0.34 * H };
    const compact = bottom.y1 - bottom.y0 < 220;
    const padX = compact ? { left: 40, right: 10 } : { left: 52, right: 14 };
    // The road as a distance line, aligned with the chart below: reaction, braking, the object.
    const S = plotIn(B, top, { lo: 0, hi: c.xMax }, { lo: -1, hi: 1 }, { ...padX, top: 20, bottom: 22 });
    const band = (x0, x1, color, text) => {
      poly(S, [[x0, -0.25], [x1, -0.25], [x1, 0.15], [x0, 0.15]], { fill: alpha(color, 0.35), stroke: null });
      if (!veiled && S.X(x1) - S.X(x0) > 90 && S.Y(-0.25) - S.Y(0.15) > 18) label(S, text, [0.5 * (x0 + x1), -0.05], { color: C.text });
    };
    seg(S, [0, -0.25], [c.xMax, -0.25], { color: C.dim, width: 1.5 });
    band(0, Math.min(c.reaction, c.xMax), C.dim, `reaction ${fig(c.reaction)} ft`);
    if (c.stops) band(c.reaction, Math.min(c.total, c.xMax), C.teal, `braking ${fig(c.braking)} ft`);
    seg(S, [state.sight, -0.6], [state.sight, 0.75], { color: C.red, width: 3 });
    label(S, 'object', [state.sight, 0.75], { color: C.red, dy: -8 });
    // The car, a fixed-size block at its place on the road.
    const cx = S.X(c.xNow);
    const cy = S.Y(-0.25);
    const { ctx } = B;
    ctx.save();
    ctx.fillStyle = c.crashed ? C.red : C.blue;
    ctx.fillRect(cx - 18, cy - 12, 18, 10);
    ctx.restore();
    const slope = state.grade === 0 ? 'level' : state.grade < 0 ? `${fig(-state.grade * 100)}% downgrade` : `${fig(state.grade * 100)}% upgrade`;
    if (veiled) {
      label(S, slope, [0.5 * c.xMax, 0.8], { color: C.muted });
      return;
    }
    label(S, `${fig(c.vNow)} mph`, [c.xNow, 0.55], { color: C.text, align: 'center' });

    // Speed and kinetic energy against distance: the energy falls in a straight line.
    const P = chartIn(B, bottom, { lo: 0, hi: c.xMax }, { lo: 0, hi: 1.12 });
    axes(P, { xLabel: 'distance from where the driver sees it (ft)', yLabel: 'share of the starting value' });
    line(P, c.series.map((p) => [p[0], p[2]]), { color: C.teal, width: 2.5 });
    line(P, c.series.map((p) => [p[0], p[1]]), { color: C.text, width: 2 });
    line(P, [[c.reaction, 0], [c.reaction, 1.12]], { color: C.dim, width: 1, dash: [4, 4] });
    line(P, [[state.sight, 0], [state.sight, 1.12]], { color: alpha(C.red, 0.7), width: 1.5, dash: [6, 4] });
    note(P, 'kinetic energy', Math.min(c.reaction + 0.3 * (c.stops ? c.braking : c.xMax), c.xMax * 0.9), 0.5, { color: C.teal, align: 'right', dx: 0 });
    note(P, 'speed', c.reaction * 0.5, 1, { color: C.text, align: 'center', dx: 0, dy: -10 });
    note(P, slope, c.xMax, 1.06, { color: C.muted, align: 'right', dx: -4, dy: 0 });
    const v = c.vNow / state.V;
    dot(P, c.xNow, v * v, { color: C.teal, r: 4 });
    dot(P, c.xNow, v, { color: C.yellow, r: 4 });
  },
  law: () => [String.raw`-(f\,mg\cos\theta + mg\sin\theta)\,d_b = 0 - \tfrac12 mv^2`, String.raw`\text{SSD} = v\,t + \frac{v^2}{2g(f\cos\theta + \sin\theta)}`],
  liveRows(state, c) {
    return [
      kv('speed $v$', `${fig(c.v)} ft/s`),
      kv('reaction distance $vt$', `${fig(c.reaction)} ft`),
      kv('braking distance', c.stops ? `${fig(c.braking)} ft` : 'never stops'),
      kv('stopping sight distance', c.stops ? `${fig(c.total)} ft` : '—'),
      kv('deceleration on this grade', `${fig(c.decel)} ft/s²`),
      kv('fastest speed that stops in the sight line', `${fig(c.vMax)} mph`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['reaction', `${fig(c.reaction)} ft`],
      ['braking', c.stops ? `${fig(c.braking)} ft` : '—'],
      ['total', c.stops ? `${fig(c.total)} ft` : '—'],
      ['verdict', c.hits ? `hits at ${fig(c.vLeft)} mph` : 'stops short'],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => {
    const body = [
      String.raw`At ${fig(state.V)} mph, $v = ${fig(c.v)}$ ft/s. Over the ${fig(state.t)} s reaction the car covers $vt = ${fig(c.reaction)}$ ft at full speed.`,
      c.stops
        ? String.raw`Braking, ${state.grade === 0 ? `friction ($f = a/g = ${fig(c.fFactor)}$) takes the kinetic energy` : state.grade > 0 ? `friction ($f = ${fig(c.fFactor)}$) and the weight take the kinetic energy` : `friction ($f = ${fig(c.fFactor)}$) must take the kinetic energy and the weight’s work too`}: $d_b = v^2/2g(f\cos\theta + \sin\theta) = ${fig(c.braking)}$ ft. The mass cancels.`
        : 'On this downgrade the weight pulls harder along the road than the brakes can hold. The car never stops.',
      c.hits
        ? String.raw`The sight line is ${fig(state.sight)} ft. The car reaches the object at ${fig(c.vLeft)} mph. It could stop in time from ${fig(c.vMax)} mph.`
        : String.raw`It stops ${fig(state.sight - c.total)} ft short of the object.`,
    ];
    return { title: c.hits ? 'The stop runs past the sight line' : 'Stops inside the sight line', body };
  }),
  predictions: [
    {
      id: 'st-double',
      scenario: 'city30',
      ask: 'Drive the same street at 60 mph instead of 30, with the same driver and brakes.',
      apply(s) { s.V = 60; },
      watch: [
        { id: 'r', label: 'the reaction distance', get: (c) => c.reaction },
        { id: 'b', label: 'the braking distance', get: (c) => c.braking },
      ],
      mode: 'factor',
      expect: { r: 2, b: 4 },
      why: 'The reaction distance is $vt$: 110 ft becomes 220 ft. The braking distance is $v^2/2a$: the brakes must take four times the kinetic energy at the same force, so 86 ft becomes 346 ft.',
    },
    {
      id: 'st-grade',
      scenario: 'design60',
      ask: 'Put the same road on a 6% downgrade.',
      apply(s) { s.grade = -0.06; },
      watch: [
        { id: 'r', label: 'the reaction distance', get: (c) => c.reaction },
        { id: 'b', label: 'the braking distance', get: (c) => c.braking },
      ],
      mode: 'dir',
      expect: { r: 'same', b: 'bigger' },
      why: 'The reaction distance does not care about the slope. Braking, the weight now does positive work along the road, against the brakes: the deceleration falls from 11.2 to 9.25 ft/s², and 346 ft becomes 419 ft. The 570 ft sight line is no longer enough.',
    },
    {
      id: 'st-alert',
      scenario: 'design60',
      ask: 'An alert driver reacts in 1.25 s instead of AASHTO’s 2.5 s.',
      apply(s) { s.t = 1.25; },
      watch: [
        { id: 'r', label: 'the reaction distance', get: (c) => c.reaction },
        { id: 'b', label: 'the braking distance', get: (c) => c.braking },
      ],
      mode: 'factor',
      expect: { r: 0.5, b: 1 },
      why: 'Halving the reaction time halves $vt$, 220 ft to 110 ft. The brakes still start at 88 ft/s, so the braking distance stays 346 ft.',
    },
  ],
});
