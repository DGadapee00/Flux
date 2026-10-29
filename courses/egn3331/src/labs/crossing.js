import { integrateFixed } from '@flux/subjects/mechanics/elastic.js';
import { fixedPointAt, simpleMacaulay } from '@flux/subjects/mechanics/macaulay.js';
import { PLAY, advance, playing } from '@flux/shells/engineering/motion.js';
import { CAR_FRONT, CAR_LB, CAR_WB_IN, STEEL_E_PSI, W8 } from '../data/crossing.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, axes, begin, chartIn, circle, dot, hidden, label, line, panes, pinSupport, poly, rollerSupport, sceneIn, seg, wall } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, leavesOut, slider } from './widgets.js';

/**
 * Shows that deflections from separate loads add, and that fixing a beam's ends cuts its sag far
 * more than its moment. A Civic rolling over two W8×10 stringers: on a 12 ft span the 9 ft
 * wheelbase keeps the axles apart, and the sag peaks with the front axle alone at midspan. On a
 * 20 ft span it peaks with both axles on, the front 3 ft past midspan. Fixed ends cut the midspan
 * drop under one axle to a quarter and the moment to a half.
 *
 * Cited: 2024 Honda Civic LX, 2,877 lb, 107.7 in wheelbase, 61/39 front/rear (Honda). W8×10,
 * Ix = 30.8 in⁴, Sx = 7.81 in³ (AISC Manual Table 1-1); E = 29,000 ksi. Each stringer carries one
 * wheel line. The span and the end fixity are assumed. Recompute: Macaulay brackets for the simple
 * span, closed-form fixed-end cases superposed for the fixed one. Second method: each axle's
 * closed-form drop superposed (simple), and a direct integration of the total moment (fixed).
 */

const E = STEEL_E_PSI;
const EI = E * W8.Ix;
const WB = CAR_WB_IN / 12;
const FRONT = (CAR_FRONT * CAR_LB) / 2;
const REAR = ((1 - CAR_FRONT) * CAR_LB) / 2;
const OUT = 'The car is two still point loads. A moving car bounces on its springs, and bridge codes add a dynamic allowance for that, a third or so on top of the static load. The deck shares each wheel between both stringers a little; here each takes one wheel line. Real supports are neither pins nor perfectly fixed: a bolted seat on a concrete abutment is somewhere between the two lines on the chart. AASHTO\'s L/800 is an optional limit for vehicle bridges.';

const SCENARIOS = [
  { id: 'mid', name: 'Front axle at midspan', L: 12, pos: 6, fixed: 0 },
  { id: 'both', name: 'Both axles on the span', L: 12, pos: 10.5, fixed: 0 },
  { id: 'fixed', name: 'Front axle at midspan, ends fixed', L: 12, pos: 6, fixed: 1 },
  { id: 'long', name: '20 ft span, worst position', L: 20, pos: 13.1, fixed: 0 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, {
    scenarioId: sc.id, L: sc.L, pos: sc.pos, fixed: sc.fixed, anim: { playing: false }, show: { play: false },
  });
}

/** The axles on the span, in inches from the left support, as point loads in lbf. */
function axles(state) {
  const L = (Number(state.L) || 12) * 12;
  const f = (Number(state.pos) || 0) * 12;
  const r = f - CAR_WB_IN;
  return [{ a: f, P: FRONT }, { a: r, P: REAR }].filter((p) => p.a > 1e-6 && p.a < L - 1e-6);
}

/** Simple span: drop at x from P at a, positive down. */
const simpleDrop = (P, L, a, x) => {
  const b = L - a;
  return x <= a
    ? (P * b * x * (L * L - b * b - x * x)) / (6 * L * EI)
    : (P * a * (L - x) * (L * L - a * a - (L - x) ** 2)) / (6 * L * EI);
};

export function crossing(state) {
  const L = (Number(state.L) || 12) * 12;
  const fixed = Number(state.fixed) >= 0.5;
  const pts = axles(state);
  let drop;
  let M;
  let drop2;
  if (!fixed) {
    const m = simpleMacaulay({ L, EI, points: pts });
    drop = (x) => -m.y(x);
    M = m.M;
    drop2 = (x) => pts.reduce((s, p) => s + simpleDrop(p.P, L, p.a, x), 0);
  } else {
    const parts = pts.map((p) => fixedPointAt(p.P, L, p.a, EI));
    drop = (x) => parts.reduce((s, f) => s + f.drop(x), 0);
    M = (x) => parts.reduce((s, f) => s + f.M(x), 0);
    // Second method: integrate the summed moment from the fixed left end.
    const r = integrateFixed(M, L, EI, 2000, pts.map((p) => p.a));
    const k = Math.round(r.x.length / 2);
    const xk = r.x[k];
    drop2 = (x) => (Math.abs(x - xk) < 1e-9 ? -r.y[k] : drop(x));
    drop2.at = xk;
  }
  const mid = drop(L / 2);
  const xc = fixed ? drop2.at : L / 2;
  const scale = Math.max(Math.abs(drop(xc)), 1e-9);
  const gap = pts.length ? Math.abs(drop2(xc) - drop(xc)) / scale : 0;
  let max = 0;
  let xMax = L / 2;
  let Mmax = 0;
  for (let i = 0; i <= 120; i++) {
    const x = (L * i) / 120;
    const d = drop(x);
    if (d > max) { max = d; xMax = x; }
    Mmax = Math.max(Mmax, Math.abs(M(x)));
  }
  for (const p of pts) Mmax = Math.max(Mmax, Math.abs(M(p.a)));
  if (fixed) Mmax = Math.max(Mmax, Math.abs(M(0)), Math.abs(M(L)));
  return {
    L, fixed, pts, mid, max, xMax, Mmax, stress: Mmax / W8.Sx, limit: L / 800, drop, gap,
  };
}

function member(B, rect, state, c, veiled) {
  const L = c.L;
  const S = sceneIn(B, rect, { x0: -0.08 * L, x1: 1.08 * L, y0: -0.3 * L, y1: Math.max(0.3 * L, 80) }, 12);
  const k = (0.1 * L) / Math.max(c.max, c.limit, 1e-9);
  // The deflected stringer, exaggerated, over the straight one.
  seg(S, [0, 0], [L, 0], { color: alpha(C.text, 0.25), width: 1.5, dash: [4, 4] });
  const shape = [];
  for (let i = 0; i <= 60; i++) {
    const x = (L * i) / 60;
    shape.push([x, -k * c.drop(x)]);
  }
  for (let i = 1; i < shape.length; i++) seg(S, shape[i - 1], shape[i], { color: C.gold, width: 4 });
  if (c.fixed) {
    wall(S, 0, -0.08 * L, 0.08 * L, { side: -1 });
    wall(S, L, -0.08 * L, 0.08 * L, { side: 1 });
  } else {
    pinSupport(S, [0, 0]);
    rollerSupport(S, [L, 0]);
  }
  // The car: body over its wheels, wheels on the deflected deck.
  const f = (Number(state.pos) || 0) * 12;
  const r = f - CAR_WB_IN;
  // A schematic body: 12 in wheels, a 45 in roofline, overhangs of 35 and 40 in.
  const wheelR = 12;
  const deckAt = (x) => (x > 0 && x < L ? -k * c.drop(x) : 0);
  const lift = wheelR + Math.max(deckAt(f), deckAt(r)) * 0.5;
  const body = [[r - 35, 0], [f + 40, 0], [f + 36, 22], [f - 10, 30], [r + 0.45 * CAR_WB_IN, 45], [r + 0.05 * CAR_WB_IN, 44], [r - 33, 24]]
    .map(([x, y]) => [x, y + lift]);
  poly(S, body, { fill: alpha(C.teal, 0.18), stroke: C.teal, width: 1.5 });
  for (const [x, P] of [[f, FRONT], [r, REAR]]) {
    circle(S, [x, deckAt(x) + wheelR], wheelR, { stroke: C.text, fill: alpha(C.text, 0.2), width: 1.5 });
    if (!veiled && x > 0 && x < L) {
      arrow(S, [x, deckAt(x) - 2], -Math.PI / 2, 18, { color: C.pink, width: 2 });
      label(S, `${fig(P)} lb`, [x, deckAt(x)], { color: C.pink, dy: 34 });
    }
  }
  if (!veiled) label(S, `${fig(L / 12)} ft, W8×10 · sag ×${fig(k)}`, [-0.08 * L, Math.max(0.3 * L, 80)], { color: C.dim, align: 'left', dy: 6 });
}

export default defineLab({
  id: 'crossing',
  exam: 'u8',
  title: 'Car on a bridge',
  app: true,
  hint: 'Each axle bends the beam on its own, and the sags add. Fixed ends turn the beam back at its supports, so it sags far less.',
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('mid', s);
    return s;
  },
  applyScenario: apply,
  sweep: (state) => ({ key: 'pos', lo: 0.1, hi: (Number(state.L) || 12) + WB - 0.1 }),
  tick(dt, state) {
    return advance(state, dt, { lo: 0, hi: (Number(state.L) || 12) + WB, rate: 3, key: 'pos' });
  },
  controls() {
    return `
      ${slider('cx-x', 'front axle from the left support (ft)', 6, 0, 30, 0.1)}
      ${slider('cx-l', 'span (ft)', 12, 8, 20, 0.5)}
      ${slider('cx-f', 'ends (0 pinned, 1 fixed)', 0, 0, 1, 1)}
      <p class="tiny">Cited: 2024 Honda Civic LX, 2,877 lb, 107.7 in wheelbase, 61/39 front/rear (Honda). W8×10, Ix 30.8 in⁴, Sx 7.81 in³ (AISC); E = 29,000 ksi. Each stringer takes one wheel line. The span and the ends are assumed. Play drives the car across at 3 ft/s.</p>`;
  },
  bind(api) {
    bindSlider('cx-x', (s, v) => { s.pos = v; }, api);
    bindSlider('cx-l', (s, v) => { s.L = v; }, api);
    bindSlider('cx-f', (s, v) => { s.fixed = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('cx-x', Math.round((Number(state.pos) || 0) * 10) / 10);
    set('cx-l', state.L);
    set('cx-f', Number(state.fixed) >= 0.5 ? 1 : 0);
  },
  compute(state) {
    return crossing(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [D, R] = panes(B, 0.5, { long: true });
    // The car drives on and off the bridge; keep it inside its own pane.
    B.ctx.save();
    B.ctx.beginPath();
    B.ctx.rect(D.x0, D.y0, D.x1 - D.x0, D.y1 - D.y0);
    B.ctx.clip();
    member(B, D, state, c, veiled);
    B.ctx.restore();
    if (veiled) return;
    const Lft = c.L / 12;
    const hiX = Lft + WB;
    const simple = [];
    const fixedPts = [];
    let top = c.limit;
    for (let i = 0; i <= 90; i++) {
      const p = (hiX * i) / 90;
      const a = crossing({ ...state, pos: p, fixed: 0 }).mid;
      const b = crossing({ ...state, pos: p, fixed: 1 }).mid;
      simple.push([p, a]);
      fixedPts.push([p, b]);
      top = Math.max(top, a);
    }
    const P = chartIn(B, R, { lo: 0, hi: hiX }, { lo: 0, hi: top * 1.15 });
    axes(P, { xLabel: 'front axle position (ft)', yLabel: 'midspan sag (in)' });
    line(P, [[0, c.limit], [hiX, c.limit]], { color: C.yellow, width: 1.5, dash: [6, 4] });
    line(P, simple, { color: C.gold, width: c.fixed ? 1.5 : 3 });
    line(P, fixedPts, { color: C.teal, width: c.fixed ? 3 : 1.5 });
    dot(P, Number(state.pos) || 0, c.mid, { color: c.fixed ? C.teal : C.gold, r: 5 });
  },
  law: () => [String.raw`y(x) = \sum_i y_i(x)`, String.raw`\Delta_{\text{fixed}} = \tfrac14\,\Delta_{\text{simple}}\ \ (P\text{ at midspan})`],
  liveRows(state, c) {
    return [
      kv('axles on the span', `${c.pts.length}`),
      kv('midspan sag', `${fig(c.mid)} in`),
      kv('largest sag', `${fig(c.max)} in at ${fig(c.xMax / 12)} ft`),
      kv('L/800 limit', `${fig(c.limit)} in`),
      kv('largest moment', `${fig(c.Mmax / 12)} lbf·ft`),
      kv('bending stress', `${fig(c.stress / 1000)} ksi`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['ends', c.fixed ? 'fixed' : 'pinned'],
      ['midspan sag', `${fig(c.mid)} in`],
      ['moment', `${fig(c.Mmax / 12)} lbf·ft`],
      ['stress', `${fig(c.stress / 1000)} ksi`],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => ({
    title: c.fixed ? 'Fixed ends stiffen it most' : c.pts.length > 1 ? 'Two axles, two sags added' : 'One axle on a simple span',
    body: c.fixed
      ? String.raw`The walls hold the ends level, so the stringer bends back up near each support. Midspan sags ${fig(c.mid)} in, and the largest moment, ${fig(c.Mmax / 12)} lbf·ft, may now sit at a wall, not under a wheel.`
      : c.pts.length > 1
        ? String.raw`Each axle sags the stringer by its own amount, and the sags add: ${fig(c.mid)} in at midspan, ${fig(c.max)} in at most. The bending stress peaks at ${fig(c.stress / 1000)} ksi, well below the 36 ksi of A36 or 50 ksi of A992.`
        : String.raw`With ${c.pts.length ? 'only the front axle' : 'no axle'} on the span, midspan sags ${fig(c.mid)} in against an L/800 limit of ${fig(c.limit)} in. Press Play to drive the car across and watch the sag build as the rear axle arrives.`,
  })),
});
