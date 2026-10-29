import { M_PER_IN } from '@flux/subjects/convert.js';
import { PLAY, advance, playing } from '@flux/shells/engineering/motion.js';
import { impactDrop, impactFactor } from '@flux/subjects/mechanics/strain-energy.js';
import {
  ROPE_A_IN2, ROPE_BREAK_LBF, ROPE_E_PSI, ROPE_H_IN, ROPE_L_FT, ROPE_LOAD_LBF, ropeDrop, ropeInches,
} from '../data/rope.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { alpha, arrow, axes, begin, C, dot, hidden, label, line, panes, plotIn, poly, sceneIn, seg } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, leavesOut, showField, slider } from './widgets.js';

/**
 * Shows that a weight dropped onto a crane rope multiplies the static force
 * by 1 + √(1 + 2h/δ_st). Released from the contact point, with h = 0, the
 * factor is still 2. A longer rope stretches more and the peak force falls.
 *
 * Second method: integrate mÿ = W − ky, and work the same rope in inches.
 */

const OUT = 'The rope is a new 1/2 in 6×19 IWRC. The Caltrans Falsework Manual, Appendix D, Example 18, gives metallic area 0.118 in², nominal strength 11.5 tons, and weight 0.46 lb/ft. That line prints 13.5 million psi and, for loads up to 20% of ultimate, 12.2 million psi. This model uses 12.2 million psi. The 30 ft length, the 400 lbf hook load, and the 1 in drop are not in that example. Constructional stretch, the sheave, the hook, and the rope\'s own weight are left out. A design factor of 5 is not applied.';

const E_STEEL = 200e9;

const SCENARIOS = [
  { id: 'catch', name: '1 in drop', load: ROPE_LOAD_LBF, length: ROPE_L_FT, drop: ROPE_H_IN, d: 0.016 },
  { id: 'sudden', name: 'Released from contact', load: ROPE_LOAD_LBF, length: ROPE_L_FT, drop: 0, d: 0.016 },
  { id: 'long', name: '60 ft of the same rope', load: ROPE_LOAD_LBF, length: 60, drop: ROPE_H_IN, d: 0.016 },
  { id: 'rod', name: '16 mm steel rod', load: 1500, length: 2, drop: 0.002, d: 0.016 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, load: sc.load, length: sc.length, drop: sc.drop, d: sc.d, t: 0, anim: { playing: false }, show: { play: false } });
}

/**
 * The catch, played: the load falls h, meets the support, and stretches it past the static stretch
 * to n times that, then springs back. Fall: y = ½gt². After contact the load is a mass on a spring
 * of k = W/δst: the stretch is δst − δst cos ωt + (v₁/ω) sin ωt, with ω = √(g/δst) and v₁ = √(2gh).
 * Its peak is δst + √(δst² + 2hδst), the n·δst of the readout. Times are slowed for the eye.
 */
function catchAt(t, h, dst) {
  const g = 9.81;
  const t1 = h > 0 ? Math.sqrt((2 * h) / g) : 0;
  if (t < t1) return { y: h - 0.5 * g * t * t - h, stretch: 0 };
  const w = Math.sqrt(g / Math.max(dst, 1e-12));
  const v1 = Math.sqrt(2 * g * h);
  const s = t - t1;
  return { y: 0, stretch: dst - dst * Math.cos(w * s) + (v1 / w) * Math.sin(w * s) };
}

function member(B, rect, state, c, veiled) {
  const rod = state.scenarioId === 'rod';
  const h = rod ? Math.max(state.drop, 0) : Math.max(state.drop, 0) * M_PER_IN;
  const dst = c.deltaSt;
  const dmax = c.delta;
  // Drawn so the largest stretch is a quarter of the support's length, and the fall to match.
  const Ls = 6;
  const k = (0.25 * Ls) / Math.max(dmax, 1e-12);
  const now = playing(state) ? catchAt(Number(state.t) || 0, h, dst) : { y: 0, stretch: dmax };
  const S = sceneIn(B, rect, { x0: -3, x1: 3, y0: -Ls - 0.25 * Ls - k * h - 1.2, y1: 1 }, 8);
  poly(S, [[-2, 0], [2, 0], [2, 0.5], [-2, 0.5]], { fill: alpha(C.muted, 0.4), stroke: C.muted });
  const bottom = -Ls - k * now.stretch;
  seg(S, [0, 0], [0, bottom], { color: rod ? C.text : C.gold, width: rod ? 5 : 3 });
  seg(S, [-1.6, -Ls - k * dst], [1.6, -Ls - k * dst], { color: alpha(C.teal, 0.7), width: 1.5, dash: [4, 4] });
  seg(S, [-1.6, -Ls - k * dmax], [1.6, -Ls - k * dmax], { color: alpha(C.pink, 0.7), width: 1.5, dash: [4, 4] });
  const top = bottom + k * now.y;
  poly(S, [[-0.9, top], [0.9, top], [0.9, top - 1.1], [-0.9, top - 1.1]], { fill: alpha(C.pink, 0.3), stroke: C.pink, width: 1.5 });
  if (!veiled) {
    label(S, 'static stretch', [1.6, -Ls - k * dst], { color: C.teal, align: 'left', dx: 4 });
    label(S, `peak, ${fig(c.n)}×`, [1.6, -Ls - k * dmax], { color: C.pink, align: 'left', dx: 4 });
    label(S, rod ? 'steel rod' : 'crane rope', [0, -Ls / 2], { color: C.dim, align: 'left', dx: 8 });
  }
}

export default defineLab({
  id: 'drop',
  exam: 'u10',
  title: 'Crane rope',
  hint: 'A drop of zero still doubles the static force. A longer rope catches the same drop with less force.',
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  // Play drops the load and lets it ring, slowed so the overshoot can be seen, then drops it again.
  tick(dt, state, computed) {
    // One swing of the caught load lasts about 1.2 s on screen, whatever its real period.
    const dst = Math.max(computed?.deltaSt || 1e-3, 1e-9);
    const period = 2 * Math.PI * Math.sqrt(dst / 9.81);
    const h = state.scenarioId === 'rod' ? Math.max(state.drop, 0) : Math.max(state.drop, 0) * M_PER_IN;
    const fall = Math.sqrt((2 * h) / 9.81);
    return advance(state, dt, { lo: 0, hi: fall + 3 * period, rate: period / 1.2, key: 't' });
  },
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('catch', s);
    return s;
  },
  applyScenario: apply,
  sweep(state) {
    if (state.scenarioId === 'rod') return { key: 'drop', lo: 0, hi: 0.008 };
    return { key: 'drop', lo: 0, hi: 3 };
  },
  controls() {
    return `
      ${slider('dr-w', 'hook load (lbf)', 400, 100, 800, 10)}
      ${slider('dr-l', 'rope length (ft)', 30, 10, 60, 1)}
      ${slider('dr-h', 'drop (in)', 1, 0, 3, 0.05)}
      ${slider('dr-wn', 'weight (N)', 1500, 400, 3000, 50)}
      ${slider('dr-ln', 'rod length (m)', 2, 0.8, 3, 0.05)}
      ${slider('dr-hn', 'drop (mm)', 2, 0, 8, 0.1)}
      ${slider('dr-d', 'diameter (mm)', 16, 10, 24, 1)}
      <p class="tiny">The rope is 1/2 in 6×19 IWRC, area ${ROPE_A_IN2} in², E = ${fig(ROPE_E_PSI / 1e6)} million psi. The rod is steel, E = 200 GPa.</p>`;
  },
  bind(api) {
    bindSlider('dr-w', (s, v) => { s.load = v; }, api);
    bindSlider('dr-l', (s, v) => { s.length = v; }, api);
    bindSlider('dr-h', (s, v) => { s.drop = v; }, api);
    bindSlider('dr-wn', (s, v) => { s.load = v; }, api);
    bindSlider('dr-ln', (s, v) => { s.length = v; }, api);
    bindSlider('dr-hn', (s, v) => { s.drop = v * 1e-3; }, api);
    bindSlider('dr-d', (s, v) => { s.d = v * 1e-3; }, api);
  },
  syncControls(state) {
    const rod = state.scenarioId === 'rod';
    showField('dr-w', !rod);
    showField('dr-l', !rod);
    showField('dr-h', !rod);
    showField('dr-wn', rod);
    showField('dr-ln', rod);
    showField('dr-hn', rod);
    showField('dr-d', rod);
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('dr-w', state.load);
    set('dr-l', state.length);
    set('dr-h', state.drop);
    set('dr-wn', state.load);
    set('dr-ln', state.length);
    set('dr-hn', state.drop * 1e3);
    set('dr-d', state.d * 1e3);
  },
  compute(state) {
    if (state.scenarioId === 'rod') {
      const A = Math.PI * (Math.max(state.d, 0.004) / 2) ** 2;
      const c = impactDrop(state.load, Math.max(state.length, 0.2), A, E_STEEL, Math.max(state.drop, 0));
      return {
        n: c.n, delta: c.delta, deltaSt: c.deltaSt, force: c.force, stress: c.stress,
        fraction: 0, gap: c.gap,
      };
    }
    const c = ropeDrop(state.load, state.length, state.drop);
    return {
      n: c.n,
      delta: c.delta,
      deltaSt: c.deltaSt,
      force: c.force,
      stress: c.stress,
      fraction: c.fraction,
      gap: c.gap,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [D, R] = panes(B, 0.42);
    member(B, D, state, c, veiled);
    if (veiled) return;
    const Bc = { ...B, free: R };
    if (state.scenarioId === 'rod') return drawRod(Bc, state);
    const inch = ropeInches(state.load, state.length, state.drop);
    const pts = [];
    const hMax = Math.max(state.drop * 2, 2);
    for (let i = 0; i <= 40; i++) {
      const h = (hMax * i) / 40;
      const n = impactFactor(h, inch.deltaIn);
      pts.push([h, n * state.load]);
    }
    const yHi = Math.max(pts[pts.length - 1][1], state.load * 2, 1);
    const P = plotIn(B, R, { lo: 0, hi: hMax }, { lo: 0, hi: yHi * 1.12 });
    axes(P, { xLabel: 'drop (in)', yLabel: 'peak force (lbf)' });
    line(P, pts, { color: C.pink, width: 3 });
    line(P, [[0, state.load], [hMax, state.load]], { color: C.gold, width: 2, dash: [5, 4] });
    dot(P, state.drop, inch.forceLbf, { color: C.gold, r: 5 });
  },
  law() {
    return [String.raw`n=1+\sqrt{1+\frac{2h}{\delta_{st}}}`];
  },
  liveRows(state, c) {
    if (state.scenarioId === 'rod') {
      return [
        kv('impact factor', fig(c.n)),
        kv('peak force', `${fig(c.force)} N`),
        kv('peak stress', `${fig(c.stress / 1e6)} MPa`),
        kv('static stretch', `${fig(c.deltaSt * 1e3)} mm`),
      ].join('');
    }
    const inch = ropeInches(state.load, state.length, state.drop);
    return [
      kv('impact factor', fig(c.n)),
      kv('peak force', `${fig(inch.forceLbf)} lbf`),
      kv('peak stress', `${fig(inch.stressPsi / 1000)} ksi`),
      kv('static stretch', `${fig(inch.deltaIn)} in`),
    ].join('');
  },
  readout(state, c) {
    if (state.scenarioId === 'rod') {
      return cells([
        ['factor', fig(c.n)],
        ['force', `${fig(c.force)} N`],
        ['stress', `${fig(c.stress / 1e6)} MPa`],
        ['stretch', `${fig(c.deltaSt * 1e3)} mm`],
      ]);
    }
    const inch = ropeInches(state.load, state.length, state.drop);
    return cells([
      ['factor', fig(c.n)],
      ['force', `${fig(inch.forceLbf)} lbf`],
      ['stress', `${fig(inch.stressPsi / 1000)} ksi`],
      ['of nominal', fig(c.fraction)],
    ]);
  },
  coach(state, c) {
    if (state.scenarioId === 'rod') {
      return {
        title: 'The static stress is not the maximum',
        body: `The factor is ${fig(c.n)}. The peak stress is ${fig(c.stress / 1e6)} MPa. Released from contact, that factor would be 2. A longer rod, like a longer rope, lowers the peak force.`,
      };
    }
    return leavesOut(OUT, (s, got) => {
      const inch = ropeInches(s.load, s.length, s.drop);
      if (s.drop <= 1e-9) {
        return {
          title: 'A drop of zero still doubles the force',
          body: `The static force is ${fig(s.load)} lbf and the stress is ${fig((s.load / ROPE_A_IN2) / 1000)} ksi. Released from contact, both double: ${fig(inch.forceLbf)} lbf and ${fig(inch.stressPsi / 1000)} ksi. The static stretch is ${fig(inch.deltaIn)} in.`,
        };
      }
      return {
        title: 'The rope stretch absorbs the fall',
        body: `The factor is ${fig(got.n)}. The peak force is ${fig(inch.forceLbf)} lbf, ${fig(inch.stressPsi / 1000)} ksi, against a static stress of ${fig((s.load / ROPE_A_IN2) / 1000)} ksi. A longer rope has a larger static stretch, and the peak force falls.`,
      };
    })(state, c);
  },
});

function drawRod(B, state) {
  const A = Math.PI * (Math.max(state.d, 0.004) / 2) ** 2;
  const dst = (state.load * Math.max(state.length, 0.2)) / (A * E_STEEL);
  const hMax = Math.max(state.drop * 2, 0.004);
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const h = (hMax * i) / 40;
    pts.push([h * 1e3, impactFactor(h, dst) * state.load]);
  }
  const yHi = Math.max(pts[pts.length - 1][1], state.load * 2, 1);
  const P = plotIn(B, B.free, { lo: 0, hi: hMax * 1e3 }, { lo: 0, hi: yHi * 1.12 });
  axes(P, { xLabel: 'drop (mm)', yLabel: 'peak force (N)' });
  line(P, pts, { color: C.pink, width: 3 });
  line(P, [[0, state.load], [hMax * 1e3, state.load]], { color: C.gold, width: 2, dash: [5, 4] });
  dot(P, state.drop * 1e3, impactFactor(state.drop, dst) * state.load, { color: C.gold, r: 5 });
}
