import { M_PER_FT, M_PER_IN, N_PER_LBF, PA_PER_PSI } from '@flux/subjects/convert.js';
import { jointFromElongations, pinJoint, threeBar } from '@flux/subjects/mechanics/deformation.js';
import { ROPE_A_IN2, ROPE_BREAK_LBF, ROPE_E_PSI } from '../data/rope.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, axes, begin, chartIn, dot, hidden, label, line, panes, poly, sceneIn, seg } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, leavesOut, slider } from './widgets.js';

/**
 * Shows that a rigging bridle is a truss joint: each wire-rope leg stretches by NL/AE, and the
 * hook goes wherever every leg's stretch, projected, agrees. Flatten the bridle and the leg
 * tension climbs well past half the load. Add a third, vertical leg and the hook has one support
 * too many: the short vertical leg is the stiff path and takes more than a third.
 *
 * Cited: the legs are 1/2 in 6×19 IWRC wire rope from the Caltrans Falsework Manual, Appendix D,
 * Example 18: metallic area 0.118 in², E = 12.2×10⁶ psi, nominal strength 11.5 tons. A wire-rope
 * sling is rated at a fifth of its breaking strength (a design factor of 5). The hoist load, the
 * 4 ft from beam to hook and the leg angles are assumed. Recompute: a stiffness solve of the hook,
 * K d = F. Second method: statics then compatibility for two legs; P/(1 + 2cos³θ) for three.
 */

const LBF = N_PER_LBF;
const IN = M_PER_IN;
const A = ROPE_A_IN2 * IN * IN;
const E = ROPE_E_PSI * PA_PER_PSI;
const H = 4 * M_PER_FT;
const WLL = ROPE_BREAK_LBF / 5;
const DEG = Math.PI / 180;
const OUT = 'The rope is a straight elastic spring at 12.2×10⁶ psi, good to about a fifth of its strength. A new rope also has constructional stretch as its strands bed in, and the sling eyes, shackles and the beam clamp all give a little. The hook is a pin. Real rigging limits the bridle angle and adds the legs\' own weight; ASME B30.9 tables give the reduced capacity at each angle.';

const SCENARIOS = [
  { id: 'two', name: 'Two legs at 60°', P: 2000 * LBF, theta: 60, skew: 0, mid: false },
  { id: 'flat', name: 'Two legs at 30°', P: 2000 * LBF, theta: 30, skew: 0, mid: false },
  { id: 'skew', name: 'Hook off centre', P: 2000 * LBF, theta: 60, skew: 0.8, mid: false },
  { id: 'three', name: 'Three legs', P: 2000 * LBF, theta: 60, skew: 0, mid: true },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, P: sc.P, theta: sc.theta, skew: sc.skew, mid: sc.mid });
}

/** The anchors, hook at the origin: the left leg at θ, the right one at a run stretched by `skew`. */
function geometry(state) {
  const th = Math.min(Math.max(Number(state.theta) || 60, 15), 85) * DEG;
  const run = H / Math.tan(th);
  const left = [-run, H];
  const right = [run * (1 + Math.max(0, Number(state.skew) || 0)), H];
  const anchors = state.mid ? [left, [0, H], right] : [left, right];
  return { th, run, anchors };
}

export function solveBridle(state) {
  const g = geometry(state);
  const P = Math.max(Number(state.P) || 0, 1);
  const s = pinJoint([0, 0], g.anchors.map((from) => ({ from, A, E })), [0, -P]);
  const T = s.members.map((m) => m.N);
  // Second method: two legs by statics then compatibility; three symmetric legs by the closed form.
  let gap = Math.max(s.residual / P, Math.abs(s.work - s.energy) / Math.max(s.energy, 1e-30));
  if (!state.mid) {
    const [a, b] = g.anchors;
    const ea = [-a[0], -a[1]].map((v) => v / Math.hypot(a[0], a[1]));
    const eb = [-b[0], -b[1]].map((v) => v / Math.hypot(b[0], b[1]));
    // Equilibrium at the hook: Na ea + Nb eb = (0, −P), solved by Cramer's rule.
    const det = ea[0] * eb[1] - ea[1] * eb[0];
    const Na = (0 * eb[1] - -P * eb[0]) / det;
    const Nb = (ea[0] * -P - ea[1] * 0) / det;
    const La = Math.hypot(a[0], a[1]);
    const Lb = Math.hypot(b[0], b[1]);
    const j = jointFromElongations([0, 0], [a, b], [(Na * La) / (A * E), (Nb * Lb) / (A * E)]);
    gap = Math.max(gap, Math.abs(Na - T[0]) / P, Math.abs(Nb - T[1]) / P, Math.hypot(j.u - s.u, j.v - s.v) / Math.max(Math.abs(s.v), 1e-12));
  } else if (!(Number(state.skew) > 0)) {
    const t = threeBar(P, H, 90 - g.th / DEG, A, E);
    gap = Math.max(gap, Math.abs(t.Nm - T[1]) / P, Math.abs(t.Ns - T[0]) / P, Math.abs(t.drop + s.v) / t.drop);
  }
  return { ...g, P, T, u: s.u, v: s.v, members: s.members, gap };
}

function member(B, rect, state, c, veiled) {
  const span = Math.max(...c.anchors.map((a) => Math.abs(a[0])), H) * 1.15;
  const S = sceneIn(B, rect, { x0: -span, x1: span, y0: -0.75 * H, y1: 1.25 * H }, 14);
  // The beam the bridle hangs from.
  poly(S, [[-span, H], [span, H], [span, 1.12 * H], [-span, 1.12 * H]], { fill: alpha(C.muted, 0.25), stroke: C.muted });
  const k = 120;
  const hook = [k * c.u, k * c.v];
  const Tmax = Math.max(...c.T, 1);
  c.anchors.forEach((a, i) => {
    seg(S, a, [0, 0], { color: alpha(C.text, 0.25), width: 1.5, dash: [4, 4] });
    seg(S, a, hook, { color: C.gold, width: 1.5 + 4 * (c.T[i] / Tmax) });
    poly(S, [[a[0] - 0.04 * H, a[1]], [a[0] + 0.04 * H, a[1]], [a[0], a[1] - 0.06 * H]], { fill: C.muted, stroke: null });
    if (!veiled) {
      // Side legs labelled near their anchors, outboard; the middle leg labelled beside its lower half.
      const f = a[0] === 0 ? 0.35 : 0.7;
      const m = [hook[0] + f * (a[0] - hook[0]), hook[1] + f * (a[1] - hook[1])];
      const side = a[0] < 0 ? -1 : 1;
      label(S, `${fig(c.T[i] / LBF)} lbf`, m, { color: C.gold, dx: 10 * side, align: side < 0 ? 'right' : 'left' });
    }
  });
  // The hoist hook and its load.
  poly(S, [[hook[0] - 0.12 * H, hook[1] - 0.18 * H], [hook[0] + 0.12 * H, hook[1] - 0.18 * H], [hook[0] + 0.12 * H, hook[1] - 0.42 * H], [hook[0] - 0.12 * H, hook[1] - 0.42 * H]], { fill: alpha(C.text, 0.15), stroke: C.text });
  seg(S, hook, [hook[0], hook[1] - 0.18 * H], { color: C.text, width: 2 });
  arrow(S, [hook[0], hook[1] - 0.42 * H], -Math.PI / 2, 28, { color: C.pink });
  if (!veiled) {
    label(S, `${fig(c.P / LBF)} lbf`, [hook[0], hook[1] - 0.42 * H], { color: C.pink, dy: 40 });
    label(S, 'hook move ×120', [-span, -0.7 * H], { color: C.dim, align: 'left' });
  }
}

export default defineLab({
  id: 'bridle',
  exam: 'u3',
  title: 'Hoist bridle',
  app: true,
  hint: 'Each rope leg stretches NL/AE; the hook moves until every leg agrees. Flatter legs pull harder. A third leg shares the load by stiffness.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('two', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'theta', lo: 20, hi: 85 }),
  controls() {
    return `
      ${slider('bd-p', 'hoist load (lbf)', 2000, 200, 4000, 100)}
      ${slider('bd-t', 'leg angle from the beam (°)', 60, 20, 85, 1)}
      ${slider('bd-s', 'hook offset (right leg longer)', 0, 0, 1.5, 0.05)}
      ${slider('bd-m', 'vertical middle leg (0 off, 1 on)', 0, 0, 1, 1)}
      <p class="tiny">Cited: 1/2 in 6×19 IWRC wire rope, metallic area 0.118 in², E = 12.2×10⁶ psi, nominal strength 23,000 lbf (Caltrans Falsework Manual, App. D, Ex. 18). Rated load at a design factor of 5: 4,600 lbf. The load, the 4 ft drop from beam to hook and the angles are assumed.</p>`;
  },
  bind(api) {
    bindSlider('bd-p', (s, v) => { s.P = v * LBF; }, api);
    bindSlider('bd-t', (s, v) => { s.theta = v; }, api);
    bindSlider('bd-s', (s, v) => { s.skew = v; }, api);
    bindSlider('bd-m', (s, v) => { s.mid = v >= 0.5; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('bd-p', Math.round(state.P / LBF));
    set('bd-t', state.theta);
    set('bd-s', state.skew);
    set('bd-m', state.mid ? 1 : 0);
  },
  compute(state) {
    const r = solveBridle(state);
    const side = r.T[0];
    const right = r.T[r.T.length - 1];
    const middle = state.mid ? r.T[1] : 0;
    return {
      side,
      right,
      middle,
      Tmax: Math.max(...r.T),
      share: middle / r.P,
      shortTakesMore: right < side,
      drop: -r.v,
      across: r.u,
      wll: Math.max(...r.T) / (WLL * LBF),
      T: r.T,
      anchors: r.anchors,
      u: r.u,
      v: r.v,
      P: r.P,
      gap: r.gap,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [D, R] = panes(B, 0.5);
    member(B, D, state, c, veiled);
    if (veiled) return;
    const P = chartIn(B, R, { lo: 20, hi: 85 }, { lo: 0, hi: Math.max(WLL * 1.1, (1.6 * c.P) / LBF) });
    axes(P, { xLabel: 'leg angle from the beam (°)', yLabel: 'left-leg tension (lbf)' });
    // The left leg's tension at every angle, for this load, offset and number of legs.
    const pts = [];
    for (let t = 20; t <= 85; t += 1) pts.push([t, solveBridle({ ...state, theta: t }).T[0] / LBF]);
    line(P, pts, { color: C.gold, width: 3 });
    line(P, [[20, WLL], [85, WLL]], { color: C.yellow, width: 1.5, dash: [6, 4] });
    dot(P, state.theta, c.side / LBF, { color: C.gold, r: 5 });
  },
  law: () => [String.raw`\delta_i = u\cos\theta_i + v\sin\theta_i = \frac{N_iL_i}{AE}`],
  liveRows(state, c) {
    return [
      kv('left leg', `${fig(c.side / LBF)} lbf`),
      state.mid ? kv('middle leg', `${fig(c.middle / LBF)} lbf (${fig(100 * c.share)}% of the load)`) : '',
      kv('right leg', `${fig(c.right / LBF)} lbf`),
      kv('of the 4,600 lbf rating', `${fig(100 * c.wll)}%`),
      kv('hook drops', `${fig(c.drop / IN)} in`),
      kv('hook moves across', `${fig(c.across / IN)} in`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['largest leg', `${fig(c.Tmax / LBF)} lbf`],
      ['of rating', `${fig(100 * c.wll)}%`],
      ['drop', `${fig(c.drop / IN)} in`],
      ['across', `${fig(c.across / IN)} in`],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => ({
    title: state.mid ? 'Three legs share by stiffness' : 'Two legs, one hook',
    body: state.mid
      ? String.raw`The vertical leg is the shortest and points straight at the load, so it carries ${fig(100 * c.share)}% of ${fig(c.P / LBF)} lbf, more than a third. The hook drops ${fig(c.drop / IN)} in, less than with two legs. Statics alone could not split the load; the legs' stretches had to agree.`
      : state.skew > 0
        ? String.raw`Off centre, the steeper left leg carries ${fig(c.side / LBF)} lbf and the flatter right leg ${fig(c.right / LBF)} lbf. Both pull equally sideways, so the steeper one must be in more tension. The hook drops ${fig(c.drop / IN)} in and creeps ${fig(Math.abs(c.across) / IN)} in toward the steeper leg.`
        : String.raw`At ${fig(state.theta)}° each leg carries ${fig(c.side / LBF)} lbf: the vertical half of the load divided by sin θ. The hook drops ${fig(c.drop / IN)} in, more than either leg stretches, because each leg also swings. That is ${fig(100 * c.wll)}% of the rope's 4,600 lbf rating.`,
  })),
});
