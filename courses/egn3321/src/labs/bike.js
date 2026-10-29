import { chordalChainSpeed, drive, pitchRadius, tyreDiameter } from '@flux/subjects/mechanics/drivetrain.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, chartIn, circle, dot, hidden, label, line, note, sceneIn, seg, split, vec } from './diagram.js';
import { defineLab } from './define2d.js';
import { PLAY, advance } from './motion.js';
import { bindSlider, leavesOut, slider } from './widgets.js';

/**
 * Application: a road bike's drivetrain (Hibbeler §16.3). A Shimano 105 groupset: a 50/34-tooth
 * crankset with 172.5 mm cranks, an 11–28 cassette (11, 12, 13, 14, 15, 17, 19, 21, 23, 25, 28),
 * and a chain of ISO 606 pitch 12.7 mm, on a 25-622 (700×25C) tyre about 672 mm across. The chain
 * carries one speed from ring to cog, and the cog and the wheel share one ω. Shows that the bike's
 * speed depends only on the ratio of teeth, so 50/25 and 34/17 ride the same; that the chain moves
 * at about a tenth of the bike's speed; and that crank length changes the pedal's speed, not the bike's.
 *
 * Recompute: the tooth-count ratio. Check: the chain's speed averaged along each sprocket's pitch
 * polygon, ω r cos φ over one tooth, which must match on the ring and on the cog.
 */
export const CASSETTE = [11, 12, 13, 14, 15, 17, 19, 21, 23, 25, 28];
const RINGS = [34, 50];
const CHAINSTAY = 0.41;

const SCENARIOS = [
  { id: 'cruise', name: 'Cruising, 34/17 at 90 rpm', cadence: 90, Nf: 34, Nr: 17, width: 25, crank: 172.5, t: 0 },
  { id: 'sprint', name: 'Top gear sprint, 50/11 at 100 rpm', cadence: 100, Nf: 50, Nr: 11, width: 25, crank: 172.5, t: 0 },
  { id: 'climb', name: 'Climbing, 34/28 at 80 rpm', cadence: 80, Nf: 34, Nr: 28, width: 25, crank: 172.5, t: 0 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  const { name, id: scId, ...rest } = sc;
  void name;
  Object.assign(state, { scenarioId: scId, anim: { playing: false }, show: { play: false }, ...rest });
}

const nearest = (list, v) => list.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
const specOf = (s) => ({ cadence: s.cadence, Nf: s.Nf, Nr: s.Nr, D: tyreDiameter(0.622, s.width / 1000), crank: s.crank / 1000 });

const OUT = String.raw`The chain's speed is its average. On the pitch polygon it surges by $1 - \cos(\pi/N)$ each tooth, 4% on an 11-tooth cog, a ripple the model averages out. The tyre's diameter is taken as the rim's 622 mm plus twice the tyre's width; a real tyre is a little shorter than wide, and it flattens under the rider, so its rolling radius is a few millimetres less. The frame is the reference: the wheel's rim moves at the bike's speed relative to the frame, and rolling on the road is section 7's problem. Torque, the rider's power, and losses in the chain are Unit 6.`;

export default defineLab({
  id: 'bike',
  exam: 'u5',
  title: 'Bike',
  gapLimit: 1e-5,
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  hint: 'The chain carries one speed from ring to cog; the cog and the wheel share one ω. Only the tooth ratio sets the bike’s speed.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('cruise', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'cadence', lo: 40, hi: 120 }),
  controls() {
    return `
      ${slider('bk-n', 'cadence (rpm)', 90, 40, 120, 1)}
      ${slider('bk-f', 'chainring: 34 or 50 teeth', 34, 34, 50, 16)}
      ${slider('bk-r', 'cog teeth, 11–28 cassette', 17, 11, 28, 1)}
      ${slider('bk-w', 'tyre width (mm), 622 mm rim', 25, 23, 32, 1)}
      ${slider('bk-L', 'crank length (mm)', 172.5, 165, 175, 2.5)}
      <p class="tiny">The bike faces right; the frame is the reference. Gold is the pedal's velocity, teal the chain's, white the rim's. A cog slider stop between sizes moves to the nearest cog on the cassette.</p>`;
  },
  bind(api) {
    bindSlider('bk-n', (s, v) => { s.cadence = v; }, api);
    bindSlider('bk-f', (s, v) => { s.Nf = nearest(RINGS, v); }, api);
    bindSlider('bk-r', (s, v) => { s.Nr = nearest(CASSETTE, v); }, api);
    bindSlider('bk-w', (s, v) => { s.width = v; }, api);
    bindSlider('bk-L', (s, v) => { s.crank = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('bk-n', state.cadence);
    set('bk-f', state.Nf);
    set('bk-r', state.Nr);
    set('bk-w', state.width);
    set('bk-L', state.crank);
  },
  tick(dt, state) {
    // One full crank turn, slowed four times so the pedal and the spokes can be followed.
    return advance(state, dt, { lo: 0, hi: 60 / state.cadence, rate: 0.25 });
  },
  compute(state) {
    const spec = specOf(state);
    const d = drive(spec);
    const offRing = chordalChainSpeed(state.Nf, d.wCrank);
    const ontoCog = chordalChainSpeed(state.Nr, d.wWheel);
    const gap = Math.max(Math.abs(offRing - d.chain), Math.abs(ontoCog - d.chain)) / d.chain;
    const series = RINGS.map((Nf) => CASSETTE.map((Nr) => ({ Nf, Nr, kmh: drive({ ...spec, Nf, Nr, cadence: 120 }).kmh })));
    return {
      ...d,
      D: spec.D,
      rf: pitchRadius(state.Nf),
      rr: pitchRadius(state.Nr),
      chainRing: offRing,
      chainCog: ontoCog,
      surge: 1 - Math.cos(Math.PI / state.Nr),
      series,
      theta: d.wCrank * state.t,
      phi: d.wWheel * state.t,
      gap,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const W = B.free.x1 - B.free.x0;
    const tall = !(W > 1.5 * (B.free.y1 - B.free.y0) && W > 560);
    const [left, right] = veiled ? [B.free, null] : split(B.free, tall ? 0.56 : 0.5);
    const R = c.D / 2;
    const S = sceneIn(B, left, { x0: -R - 0.04, x1: CHAINSTAY + 0.24, y0: -R - 0.04, y1: R + 0.06 });
    const ring = [CHAINSTAY, 0];
    const cog = [0, 0];
    // The wheel, turning clockwise as the bike moves right: rim, tyre and four spokes.
    circle(S, cog, R, { stroke: alpha(C.text, 0.7), width: 5 });
    circle(S, cog, 0.311, { stroke: alpha(C.text, 0.35), width: 1.5 });
    for (let i = 0; i < 4; i++) {
      const a = -c.phi + (i * Math.PI) / 2;
      seg(S, cog, [0.311 * Math.cos(a), 0.311 * Math.sin(a)], { color: alpha(C.text, 0.35), width: 1 });
    }
    // Chain: the top and bottom spans, tangent to the two pitch circles.
    seg(S, [cog[0], c.rr], [ring[0], c.rf], { color: C.teal, width: 2 });
    seg(S, [cog[0], -c.rr], [ring[0], -c.rf], { color: alpha(C.teal, 0.6), width: 2 });
    circle(S, ring, c.rf, { stroke: C.gold, width: 2 });
    circle(S, cog, c.rr, { stroke: C.teal, width: 2 });
    // One tooth marked on each sprocket, so the turning shows.
    const mark = (O, r, a, col) => seg(S, [O[0] + 0.8 * r * Math.cos(a), O[1] + 0.8 * r * Math.sin(a)], [O[0] + r * Math.cos(a), O[1] + r * Math.sin(a)], { color: col, width: 3 });
    mark(ring, c.rf, Math.PI / 2 - c.theta, C.gold);
    mark(cog, c.rr, Math.PI / 2 - c.phi, C.teal);
    // The crank and pedal, clockwise.
    const L = state.crank / 1000;
    const a = Math.PI / 2 - c.theta;
    const P = [ring[0] + L * Math.cos(a), ring[1] + L * Math.sin(a)];
    seg(S, ring, P, { color: C.gold, width: 4 });
    dot(S, P[0], P[1], { color: C.gold, r: 5 });
    // Velocities relative to the frame, one scale for all three.
    const k = (0.6 * R * S.k) / Math.max(c.v, 1e-9);
    vec(S, P, [Math.sin(a), -Math.cos(a)], c.pedal * k, { color: C.gold });
    const chainAt = [CHAINSTAY * 0.3, c.rr + 0.3 * (c.rf - c.rr) + 0.012];
    vec(S, chainAt, [1, 0], c.chain * k, { color: C.teal });
    vec(S, [0, R], [1, 0], c.v * k, { color: C.text });
    // Labels clear of the shafts; on a phone the drawing is small and the readout carries the numbers.
    const roomy = R * S.k > 60;
    label(S, `${state.Nf}/${state.Nr}`, ring, { dy: c.rf * S.k + 14, color: C.gold });
    if (roomy) {
      label(S, veiled ? 'pedal' : `pedal ${fig(c.pedal)} m/s`, ring, { color: C.gold, dy: c.rf * S.k + 30 });
      label(S, veiled ? 'chain' : `${fig(c.chain)} m/s`, chainAt, { color: C.teal, align: 'left', dy: -10 });
      label(S, veiled ? 'rim' : `rim ${fig(c.v)} m/s`, [0, R], { color: C.text, align: 'left', dx: c.v * k + 6 });
    }
    if (veiled) return;

    // Speed against cadence for every gear on both rings; the gear in use is bold.
    const vMax = Math.max(...c.series.flat().map((g) => g.kmh));
    const Pc = chartIn(B, right, { lo: 0, hi: 120 }, { lo: 0, hi: vMax * 1.05 });
    axes(Pc, { xLabel: 'cadence (rpm)', yLabel: 'bike speed (km/h)' });
    for (const g of c.series.flat()) {
      const on = g.Nf === state.Nf && g.Nr === state.Nr;
      const col = g.Nf === 50 ? C.gold : C.teal;
      line(Pc, [[0, 0], [120, g.kmh]], { color: on ? col : alpha(col, 0.25), width: on ? 2.5 : 1 });
    }
    note(Pc, '50-tooth ring', 4, vMax * 0.98, { color: C.gold });
    note(Pc, '34-tooth ring', 60, vMax * 0.98, { color: C.teal });
    dot(Pc, state.cadence, c.kmh, { color: C.yellow, r: 5 });
  },
  law: () => [String.raw`\omega_w = \frac{N_f}{N_r}\,\omega_c`, String.raw`v = \omega_w\,\frac{D}{2},\quad v_{chain} = N_f\,p\,n_c`],
  liveRows(state, c) {
    return [
      kv('gear ratio $N_f/N_r$', fig(c.ratio)),
      kv('wheel speed', `${fig(c.wheelRpm)} rpm`),
      kv('bike speed $\\omega_w D/2$', `${fig(c.v)} m/s = ${fig(c.kmh)} km/h`),
      kv('chain speed $N_f\\,p\\,n_c$', `${fig(c.chain)} m/s`),
      kv('chain, averaged along the pitch polygon', `${fig(c.chainRing)} m/s off the ring, ${fig(c.chainCog)} onto the cog`),
      kv('pedal speed $\\omega_c L$', `${fig(c.pedal)} m/s`),
      kv('one crank turn carries the bike', `${fig(c.development)} m`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['gear', `${state.Nf}/${state.Nr}`],
      ['wheel', `${fig(c.wheelRpm)} rpm`],
      ['speed', `${fig(c.kmh)} km/h`],
      ['chain', `${fig(c.chain)} m/s`],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => ({
    title: `${state.Nf}/${state.Nr} at ${fig(state.cadence)} rpm: ${fig(c.kmh)} km/h`,
    body: [
      String.raw`In one crank turn ${state.Nf} links leave the ring and enter the ${state.Nr}-tooth cog, so the cog and the wheel turn $${state.Nf}/${state.Nr} = ${fig(c.ratio)}$ times: ${fig(c.wheelRpm)} rpm.`,
      String.raw`The tyre is ${fig(c.D * 1000)} mm across, so the bike moves $\pi D = ${fig(Math.PI * c.D)}$ m per wheel turn: ${fig(c.v)} m/s, or ${fig(c.kmh)} km/h.`,
      String.raw`The chain moves at $N_f p n_c = ${fig(c.chain)}$ m/s, a ${fig(c.v / c.chain)}th of the bike's speed. The pedal moves at ${fig(c.pedal)} m/s.`,
    ],
  })),
  predictions: [
    {
      id: 'bk-ratio',
      scenario: 'cruise',
      ask: 'Shift from 34/17 to 50/25, the big ring and a bigger cog. Keep 90 rpm.',
      apply(s) { s.Nf = 50; s.Nr = 25; },
      watch: [
        { id: 'v', label: 'the bike’s speed', get: (c) => c.v },
        { id: 'chain', label: 'the chain’s speed', get: (c) => c.chain },
      ],
      mode: 'dir',
      expect: { v: 'same', chain: 'bigger' },
      why: 'Both gears have a ratio of 2, so the wheel turns 180 rpm and the bike rides at 22.8 km/h either way. But the chain leaves a bigger ring: 50 links per crank turn instead of 34, so it moves at 0.953 m/s instead of 0.648 m/s.',
    },
    {
      id: 'bk-chain',
      scenario: 'sprint',
      ask: 'In top gear, 50/11 at 100 rpm.',
      apply() {},
      watch: [{ id: 'fast', label: 'the chain moves faster than the bike', get: (c) => c.chain > c.v, mode: 'bool' }],
      mode: 'bool',
      expect: { fast: false },
      why: 'The chain moves at $N_f p n_c = 50 \\times 0.0127 \\times 1.667 = 1.06$ m/s. The bike moves at 16.0 m/s, fifteen times faster. The small cog turns the wheel 4.5 times per crank turn, and the wheel is far bigger than the cog.',
    },
    {
      id: 'bk-crank',
      scenario: 'climb',
      ask: 'Swap the 172.5 mm cranks for 165 mm cranks. Keep 34/28 at 80 rpm.',
      apply(s) { s.crank = 165; },
      watch: [
        { id: 'v', label: 'the bike’s speed', get: (c) => c.v },
        { id: 'pedal', label: 'the pedal’s speed', get: (c) => c.pedal },
      ],
      mode: 'dir',
      expect: { v: 'same', pedal: 'smaller' },
      why: 'The crank turns the ring at the cadence whatever its length, so the bike still rides at 12.3 km/h. The pedal sits closer to the axle and moves at $\\omega_c L = 8.38 \\times 0.165 = 1.38$ m/s instead of 1.45 m/s. Crank length changes the force a rider needs, a Unit 6 question.',
    },
  ],
});
