import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { conditioning } from '@flux/subjects/math/conditioning.js';

/**
 * Condition: two nearly parallel lines, x + y = 2 and x + (1 + ε)y = 2 + δ, whose crossing you solve
 * for, with sliders for how nearly parallel they are and for a nudge to one right-hand side.
 *
 * Shows that a tiny residual does not mean an accurate answer: with ε = 0.01, a nudge of 0.35% to b
 * moves the solution by 71%, while the old solution still fits the nudged system to 0.35%. The
 * condition number κ(A) bounds the amplification. Solved by PA = LU and checked by Cramer's rule
 * (packages/subjects/src/math/conditioning.js).
 */
const SCENARIOS = [
  { id: 'well', name: 'Lines well apart: ε = 1', leps: 0, delta: 0.01 },
  { id: 'ill', name: 'Nearly parallel: ε = 0.01', leps: -2, delta: 0.01 },
  { id: 'very', name: 'Very nearly parallel: ε = 0.001', leps: -3, delta: 0.002 },
  { id: 'back', name: 'Nudged the other way', leps: -2, delta: -0.01 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, leps: sc.leps, delta: sc.delta });
}

const KEYS = [['cd-e', 'leps'], ['cd-d', 'delta']];
const pct = (x) => `${fig(100 * x)}%`;
const num3 = (x) => String(Number(x.toFixed(3)));
const pt = (v) => `(${num3(v[0])}, ${num3(v[1])})`;

/** The two lines near their crossings, the old and new solutions marked. */
function linesPlot(B, rect, state, c) {
  const eps = 10 ** state.leps;
  const [ox, oy] = c.x0;
  const [nx, ny] = c.x;
  const cx = (ox + nx) / 2;
  const cy = (oy + ny) / 2;
  const span = Math.max(3, 1.4 * Math.hypot(nx - ox, ny - oy));
  const W = rect.x1 - rect.x0;
  const H = rect.y1 - rect.y0;
  const sx = W > H ? span * (W / H) : span;
  const sy = W > H ? span : span * (H / W);
  const X = { lo: cx - sx / 2, hi: cx + sx / 2 };
  const Y = { lo: cy - sy / 2, hi: cy + sy / 2 };
  const P = plotIn(B, rect, X, Y);
  axes(P, { xLabel: 'x', yLabel: 'y' });
  // Line 1: y = 2 − x. Line 2, nudged: y = (2 + δ − x)/(1 + ε). The un-nudged line 2 faint.
  const seg = (f, color, width, dash) => line(P, [[X.lo, f(X.lo)], [X.hi, f(X.hi)]], { color, width, dash });
  // Line 1 wide and soft, so the nearly parallel line 2 shows on top of it.
  seg((x) => 2 - x, alpha(C.teal, 0.55), 6);
  seg((x) => (2 - x) / (1 + eps), alpha(C.gold, 0.35), 1.5, [5, 4]);
  seg((x) => (2 + state.delta - x) / (1 + eps), C.gold, 2);
  // The band of points that fit both nudged equations to within the old residual.
  dot(P, ox, oy, { color: C.muted, r: 6, ring: C.text });
  dot(P, nx, ny, { color: C.pink, r: 6, ring: C.text });
  label(P, `old answer ${pt(c.x0)}`, [ox, oy], { color: C.muted, align: 'right', dx: -10, dy: 16 });
  label(P, `new answer ${pt(c.x)}`, [nx, ny], { color: C.pink, align: 'left', dx: 10, dy: -12 });
}

/** On a log scale: the nudge, the old answer's residual, the answer's change, and κ's bound. */
function barsPlot(B, rect, c) {
  const vals = [c.relB, c.relR, c.relX, c.bound];
  const names = ['nudge to b', 'residual of old x', 'change in x', 'κ × nudge'];
  const colors = [C.gold, C.muted, C.pink, C.teal];
  const lo = 1e-4;
  const hi = Math.max(10, ...vals) * 3;
  const P = plotIn(B, rect, { lo: -0.6, hi: 3.6 }, { lo, hi, log: true }, { left: 52, right: 14, top: 26, bottom: 34 });
  axes(P, { yLabel: 'relative size', xFmt: () => '', yFmt: (v) => (Math.abs(Math.log10(v) - Math.round(Math.log10(v))) < 1e-9 ? pct(v) : '') });
  vals.forEach((v, k) => {
    const top = Math.max(v, lo);
    poly(P, [[k - 0.3, lo], [k + 0.3, lo], [k + 0.3, top], [k - 0.3, top]], { fill: alpha(colors[k], 0.75), stroke: null });
    label(P, pct(v), [k, top], { color: C.text, dy: -9 });
    label(P, names[k], [k, lo], { color: C.muted, dy: 12 });
  });
}

export default defineLab({
  id: 'condition',
  exam: 'u1',
  title: 'Condition',
  hint: 'Make the lines nearly parallel, then nudge one right-hand side. The answer jumps far, yet the old answer still almost satisfies both equations.',
  gapLimit: 1e-8,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('ill', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'leps', lo: -4, hi: 0 }),
  controls() {
    return `
      ${slider('cd-e', 'How far from parallel, log₁₀ ε', -2, -4, 0, 0.01)}
      ${slider('cd-d', 'Nudge δ to the second right-hand side', 0.01, -0.02, 0.02, 0.0005)}
      <p class="tiny">x + y = 2 (teal) and x + (1 + ε)y = 2 + δ (gold; faint: before the nudge). Grey dot: the answer before the nudge, (2, 0). Pink: after. Bars on a log scale, each relative to the size of b or x.</p>`;
  },
  bind(api) {
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    // δ = 0 has no nudge to amplify; read it as the smallest nudge the slider allows.
    const delta = Math.abs(state.delta) < 1e-9 ? 0.0005 : state.delta;
    return conditioning({ eps: 10 ** state.leps, delta });
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      linesPlot(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.58 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    linesPlot(B, a, state, c);
    barsPlot(B, b, c);
  },
  law: () => [String.raw`PA = LU, \qquad \kappa(A) = \|A\|\,\|A^{-1}\| = \frac{\sigma_\text{max}}{\sigma_\text{min}}`, String.raw`\frac{\|\delta\mathbf x\|}{\|\mathbf x\|} \le \kappa(A)\,\frac{\|\delta\mathbf b\|}{\|\mathbf b\|}`],
  liveRows(state, c) {
    const { L, U, swap } = c.lu;
    return [
      kv('L, U', `[1, 0; ${fig(L[1][0])}, 1], [${fig(U[0][0])}, ${fig(U[0][1])}; 0, ${fig(U[1][1])}]${swap ? ', rows swapped' : ''}`),
      kv('Answer before and after the nudge', `${pt(c.x0)}, ${pt(c.x)}`),
      kv('Angle between the lines', `${fig(c.angleDeg)}°`),
      kv('σ_max, σ_min, κ', `${fig(c.s1)}, ${fig(c.s2)}, ${fig(c.kappa)}`),
      kv('Nudge, change in x, amplification', `${pct(c.relB)}, ${pct(c.relX)}, ${fig(c.amplification)}×`),
      kv('Residual of the old answer', pct(c.relR)),
      kv('LU against Cramer’s rule', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['κ(A)', fig(c.kappa)],
      ['nudge', pct(c.relB)],
      ['change in x', pct(c.relX)],
      ['old residual', pct(c.relR)],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Large systems, where κ is estimated rather than computed, and round-off: in floating point, κ × 10⁻¹⁶ is roughly the relative error you must expect even with exact data. Scaling the equations or choosing better unknowns can lower κ.`;
    if (c.kappa < 20) {
      return { title: 'Well conditioned', body: `The lines cross at ${fig(c.angleDeg)}°, so κ = ${fig(c.kappa)}. A ${pct(c.relB)} nudge to b moves the answer ${pct(c.relX)}: small in, small out. ${leavesOut}` };
    }
    return { title: 'A small residual, a large error', body: `The lines cross at only ${fig(c.angleDeg)}°, so κ = ${fig(c.kappa)}. A ${pct(c.relB)} nudge to b moves the answer from ${pt(c.x0)} to ${pt(c.x)}, ${pct(c.relX)}. Yet the old answer still fits the nudged equations to ${pct(c.relR)}. A residual measures how well x fits the equations, not how close it is to the true x. ${leavesOut}` };
  },
  app: false,
});
