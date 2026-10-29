import { M_PER_IN } from '@flux/subjects/convert.js';
import { rollDown, rollDownStepped } from '@flux/subjects/mechanics/wheelchair.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, chartIn, circle, dot, hidden, label, line, note, poly, sceneIn, seg, split, vec } from './diagram.js';
import { defineLab } from './define2d.js';
import { PLAY, advance } from './motion.js';
import { bindSlider, leavesOut, slider } from './widgets.js';

/**
 * Application: a wheelchair rolling down an accessible ramp (Hibbeler §18.2–18.5). The 2010 ADA
 * Standards for Accessible Design limit a ramp's running slope to 1:12 (§405.2) and one run's rise to
 * 30 in (§405.6). A manual chair rides on two 24 in rear wheels and two 6 in casters, all rolling
 * without slip. Released at the top, it reaches the foot of a full 30 in run at 3.8 m/s, 8.5 mph,
 * if no one holds it back. Shows that the rise alone sets that speed, not the slope or the mass; that
 * the wheels' spin takes only a few percent of the energy; and that rolling resistance, acting over
 * the whole length, is what a shallow ramp spends its length on.
 *
 * Recompute: work and energy with every wheel's ½Iω². Check: Newton and Euler on each wheel,
 * stepped in time.
 */
const IN = M_PER_IN;
const CHAIR = 15;
const R_REAR = 12 * IN;
const R_CASTER = 3 * IN;
const CASTER = 0.3;

const SCENARIOS = [
  { id: 'ada', name: 'ADA limit: 1:12, 30 in rise', rise: 30, run: 12, rider: 80, mw: 1.2, c: 0, t: 2.5 },
  { id: 'resist', name: 'The same, with rolling resistance', rise: 30, run: 12, rider: 80, mw: 1.2, c: 0.012, t: 2.5 },
  { id: 'steep', name: 'Too steep: 1:8, same rise', rise: 30, run: 8, rider: 80, mw: 1.2, c: 0, t: 1.6 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  const { name, id: scId, ...rest } = sc;
  void name;
  Object.assign(state, { scenarioId: scId, anim: { playing: false }, show: { play: false }, ...rest });
}

/** The chair as the subjects module wants it: SI, the wheels listed with their gyration. */
export function chairSpec(s) {
  return {
    m: CHAIR + s.rider,
    wheels: [
      // A spoked wheel keeps most of its mass at the rim: k = 0.9 R. A caster is a solid disk: k = R/√2.
      { n: 2, m: s.mw, R: R_REAR, k: 0.9 * R_REAR, name: 'rear wheels' },
      { n: 2, m: CASTER, R: R_CASTER, k: R_CASTER / Math.SQRT2, name: 'casters' },
    ],
    H: s.rise * IN,
    slope: 1 / s.run,
    c: s.c,
  };
}

const OUT = String.raw`The wheels roll without slipping and the frame is rigid. Rolling resistance is one steady coefficient, an assumed value here: in practice it depends on the tyres, their pressure, the casters' size and the floor, and on how the rider's weight splits between casters and rear wheels. The bearings' friction, air drag (small at these speeds), and the casters swivelling are left out. Above all, a real rider brakes with the hand rims, turning this energy into heat in their palms; ADA's landings and its 30 in limit per run cap how much they must take at once.`;

export default defineLab({
  id: 'wheelchair',
  exam: 'u7',
  title: 'Wheelchair',
  gapLimit: 1e-8,
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  hint: 'Released at the top, the chair turns the drop m g H into motion. The slope sets the time, the rise sets the speed.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('ada', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'rise', lo: 6, hi: 30 }),
  controls() {
    return `
      ${slider('wc-h', 'rise H (in), ADA maximum 30', 30, 6, 36, 1)}
      ${slider('wc-n', 'slope 1 : n, ADA minimum n = 12', 12, 6, 20, 1)}
      ${slider('wc-m', 'rider (kg), chair 15 kg', 80, 40, 140, 1)}
      ${slider('wc-w', 'each 24 in rear wheel (kg)', 1.2, 0.5, 3, 0.1)}
      ${slider('wc-c', 'rolling resistance coefficient (assumed)', 0, 0, 0.03, 0.001)}
      ${slider('wc-t', 'time from release (s)', 2.5, 0, 12, 0.05)}
      <p class="tiny">Released from rest at the top, no hand on the rims. White is the velocity, grey the weight. The casters are 6 in, 0.3 kg each. On the chart the weight's work splits into the chair's motion, the wheels' spin, and rolling resistance.</p>`;
  },
  bind(api) {
    bindSlider('wc-h', (s, v) => { s.rise = v; }, api);
    bindSlider('wc-n', (s, v) => { s.run = v; }, api);
    bindSlider('wc-m', (s, v) => { s.rider = v; }, api);
    bindSlider('wc-w', (s, v) => { s.mw = v; }, api);
    bindSlider('wc-c', (s, v) => { s.c = v; }, api);
    bindSlider('wc-t', (s, v) => { s.t = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('wc-h', state.rise);
    set('wc-n', state.run);
    set('wc-m', state.rider);
    set('wc-w', state.mw);
    set('wc-c', state.c);
    set('wc-t', Number(state.t.toFixed(2)));
  },
  tick(dt, state) {
    const r = rollDown(chairSpec(state));
    return advance(state, dt, { lo: 0, hi: Math.min(12, (Number.isFinite(r.t) ? r.t : 10) + 1), rate: 1 });
  },
  compute(state) {
    const spec = chairSpec(state);
    const r = rollDown(spec);
    const n = rollDownStepped(spec);
    const moves = r.v > 0;
    const gap = moves ? Math.max(Math.abs(n.v - r.v) / r.v, Math.abs(n.t - r.t) / r.t) : 0;
    const tt = moves ? Math.min(state.t, r.t) : 0;
    const s = 0.5 * r.a * tt * tt;
    const vNow = r.a * tt;
    const share = moves ? r.Trot / (r.Ttrans + r.Trot) : 0;
    return {
      ...r,
      m: spec.m,
      H: spec.H,
      run: spec.H * state.run,
      moves,
      s,
      vNow,
      share,
      mph: r.v / 0.44704,
      vSteps: n.v,
      rear: r.spin[0],
      caster: r.spin[1],
      gap,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [left, right] = veiled ? [B.free, null] : split(B.free, 0.5);
    // The ramp to scale, falling to the right, and a landing at its foot.
    const run = c.run;
    const H = c.H;
    // The chair is drawn larger than the ramp, so its wheels and rider stay legible: f times life
    // size, at most 2.5, with room above the ramp for it.
    const S0 = sceneIn(B, left, { x0: -0.6, x1: run + 1.4, y0: -0.25, y1: H + 1.5 });
    const f = Math.min(2.5, Math.max(1, 26 / (R_REAR * S0.k)));
    const S = sceneIn(B, left, { x0: -0.6, x1: run + 1.4, y0: -0.25, y1: H + 1.45 * f + 0.1 });
    poly(S, [[0, H], [run, 0], [run + 1.4, 0], [run + 1.4, -0.12], [-0.6, -0.12], [-0.6, H], [0, H]], { fill: alpha(C.text, 0.12), stroke: alpha(C.text, 0.6), width: 1.5 });
    // The chair, its rear axle s along the ramp from the top.
    const th = c.th;
    const along = [Math.cos(th), -Math.sin(th)];
    const normal = [Math.sin(th), Math.cos(th)];
    const base = c.s;
    const at = (d, up) => [along[0] * (base + f * d) + normal[0] * f * up, H + along[1] * (base + f * d) + normal[1] * f * up];
    const axle = at(0.05, R_REAR);
    const casterAt = at(0.5, R_CASTER);
    circle(S, axle, f * R_REAR, { stroke: C.text, width: 2.5 });
    const spin = -c.s / R_REAR;
    for (let i = 0; i < 3; i++) {
      const a = spin + (i * 2 * Math.PI) / 3;
      seg(S, axle, [axle[0] + f * R_REAR * Math.cos(a), axle[1] + f * R_REAR * Math.sin(a)], { color: alpha(C.text, 0.5), width: 1 });
    }
    circle(S, casterAt, f * R_CASTER, { stroke: C.text, width: 2 });
    // Frame and seat, then the rider: back, thigh, shin, head.
    const seat = at(0.12, 0.5);
    const front = at(0.5, 0.5);
    seg(S, axle, seat, { color: C.blue, width: 2.5 });
    seg(S, seat, front, { color: C.blue, width: 2.5 });
    seg(S, front, casterAt, { color: C.blue, width: 2 });
    const hip = at(0.14, 0.58);
    const shoulder = at(0.08, 1.05);
    const knee = at(0.52, 0.62);
    const foot = at(0.56, 0.2);
    seg(S, hip, shoulder, { color: alpha(C.gold, 0.8), width: 4 });
    seg(S, hip, knee, { color: alpha(C.gold, 0.8), width: 4 });
    seg(S, knee, foot, { color: alpha(C.gold, 0.8), width: 3 });
    circle(S, at(0.1, 1.2), f * 0.1, { stroke: alpha(C.gold, 0.8), fill: alpha(C.gold, 0.3), width: 2 });
    // Velocity along the ramp, on a fixed scale, and the weight, from near the hip.
    if (c.vNow > 1e-6) vec(S, at(0.3, 1.25), along, (c.vNow / 4) * 3 * f * R_REAR * S.k, { color: C.text, label: 'v' });
    vec(S, at(0.25, 0.4), [0, -1], 1.4 * f * R_REAR * S.k, { color: C.dim, label: 'mg' });
    const wide = S.X(run + 1.4) - S.X(-0.6) > 320;
    if (wide && f > 1.05 && !veiled) label(S, `chair ${Math.round(f * 10) / 10}× life size`, [-0.6, H + 1.45 * f + 0.1], { color: C.dim, align: 'left', dy: 10 });
    if (wide && !veiled) label(S, `rise ${fig(state.rise)} in, slope 1:${fig(state.run)}`, [run + 1.4, H + 1.45 * f + 0.1], { color: C.muted, align: 'right', dy: 10 });
    if (veiled) return;

    // Where the weight's work goes, against distance down the ramp.
    const L = c.L;
    const per = c.drop / L;
    const lostPer = c.lost / L;
    const moving = Math.max(0, per - lostPer);
    const rotShare = c.share;
    const P = chartIn(B, right, { lo: 0, hi: L }, { lo: 0, hi: c.drop * 1.08 });
    axes(P, { xLabel: 'distance down the ramp (m)', yLabel: 'energy (J)' });
    line(P, [[0, 0], [L, c.drop]], { color: C.text, width: 2 });
    line(P, [[0, 0], [L, c.lost]], { color: C.pink, width: 2 });
    line(P, [[0, 0], [L, moving * L * (1 - rotShare)]], { color: C.teal, width: 2.5 });
    line(P, [[0, 0], [L, moving * L * rotShare]], { color: C.gold, width: 2.5 });
    note(P, 'weight’s work, m g Δy', L * 0.3, per * L * 0.3, { color: C.text, align: 'right', dx: -8, dy: -8 });
    note(P, 'motion, ½mv²', L * 0.98, moving * L * (1 - rotShare), { color: C.teal, align: 'right', dx: 0, dy: 14 });
    note(P, 'wheels’ spin, Σ½Iω²', L * 0.98, moving * L * rotShare, { color: C.gold, align: 'right', dx: 0, dy: -6 });
    if (c.lost > 1) note(P, 'rolling resistance', L * 0.98, c.lost, { color: C.pink, align: 'right', dx: 0, dy: -6 });
    dot(P, Math.min(c.s, L), moving * Math.min(c.s, L) * (1 - rotShare), { color: C.yellow, r: 5 });
  },
  law: () => [String.raw`\tfrac12\Big(m + \sum \tfrac{I}{R^2}\Big)v^2 = mgH - c\,mg\cos\theta\,L`, String.raw`\omega = v/R,\quad L = H/\sin\theta`],
  liveRows(state, c) {
    return [
      kv('total mass $m$, effective $m + \\sum I/R^2$', `${fig(c.m)} kg, ${fig(c.mEff)} kg`),
      kv('ramp length $L$', `${fig(c.L)} m`),
      kv('weight’s work $mgH$', `${fig(c.drop)} J`),
      kv('rolling resistance takes', `${fig(c.lost)} J`),
      kv('speed at the foot', c.moves ? `${fig(c.v)} m/s = ${fig(c.mph)} mph` : 'it does not move'),
      kv('stepped, Newton–Euler', `${fig(c.vSteps)} m/s`),
      kv('wheels’ spin', `${fig(c.Trot)} J, ${fig(100 * c.share)}% of the motion`),
      kv('rear wheel, caster ω', `${fig(c.rear.omega)}, ${fig(c.caster.omega)} rad/s`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['at the foot', c.moves ? `${fig(c.v)} m/s` : '—'],
      ['time', c.moves ? `${fig(c.t)} s` : '—'],
      ['spin share', `${fig(100 * c.share)}%`],
      ['resistance', `${fig(c.lost)} J`],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => {
    if (!c.moves) {
      return { title: 'It stays put', body: String.raw`Rolling resistance, $c = ${fig(state.c)}$, is at least the slope, $1/${fig(state.run)}$. The chair needs a push.` };
    }
    return {
      title: `${fig(c.v)} m/s at the foot`,
      body: [
        String.raw`The weight does $mgH = ${fig(c.m)}(9.81)(${fig(c.H)}) = ${fig(c.drop)}$ J over the ${fig(state.rise)} in rise. ${c.lost > 1 ? String.raw`Rolling resistance takes $c\,mg\cos\theta\,L = ${fig(c.lost)}$ J over the ${fig(c.L)} m ramp.` : 'Nothing else does work: the ground pushes on wheels that do not slip.'}`,
        String.raw`Every wheel spins at $v/R$: the 24 in wheels at ${fig(c.rear.omega)} rad/s, the 6 in casters at ${fig(c.caster.omega)}. Their spin holds ${fig(c.Trot)} J, ${fig(100 * c.share)}% of the motion, because they are light next to the rider.`,
        String.raw`So $\tfrac12(${fig(c.mEff)})v^2 = ${fig(c.drop - c.lost)}$ J gives ${fig(c.v)} m/s, ${fig(c.mph)} mph: a brisk run, which is why riders brake with the rims and why ADA caps one run's rise.`,
      ],
    };
  }),
  predictions: [
    {
      id: 'wc-steep',
      scenario: 'ada',
      ask: 'Build the same 30 in rise as a steeper 1:8 ramp, too steep for ADA. No rolling resistance.',
      apply(s) { s.run = 8; },
      watch: [
        { id: 'v', label: 'the speed at the foot', get: (c) => c.v },
        { id: 't', label: 'the time to get there', get: (c) => c.t },
      ],
      mode: 'dir',
      expect: { v: 'same', t: 'smaller' },
      why: 'Only the weight does work, $mgH$, and the rise is the same: 3.82 m/s either way. The steeper ramp is shorter, 6.14 m instead of 9.18 m, and it accelerates harder, so the chair gets there in 3.2 s instead of 4.8 s.',
    },
    {
      id: 'wc-heavy',
      scenario: 'ada',
      ask: 'A heavier rider: 120 kg instead of 80 kg, in the same chair.',
      apply(s) { s.rider = 120; },
      tol: 0.01,
      watch: [{ id: 'v', label: 'the speed at the foot', get: (c) => c.v }],
      mode: 'dir',
      expect: { v: 'same' },
      why: 'The weight’s work and the kinetic energy both grow with the mass, so it cancels: $v^2 = 2gH\,m/m_{eff}$. Only the wheels’ small share shifts, and the speed rises by 0.3%.',
    },
    {
      id: 'wc-rise',
      scenario: 'ada',
      ask: 'Halve the rise to 15 in, still at 1:12.',
      apply(s) { s.rise = 15; },
      watch: [{ id: 'T', label: 'the kinetic energy at the foot', get: (c) => c.Ttrans + c.Trot }],
      mode: 'factor',
      expect: { T: 0.5 },
      why: 'The kinetic energy is the weight’s work, $mgH$: half the rise, half the energy, 355 J instead of 710 J. The speed falls only by $\\sqrt 2$, to 2.70 m/s.',
    },
  ],
});
