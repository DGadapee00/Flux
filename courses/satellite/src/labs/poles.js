import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { polesChecked } from '@flux/subjects/mechanics/poles.js';

/**
 * Poles: a pair of poles σ ± jω placed in the complex plane, with the step response they make.
 *
 * Shows that a pole's real part decides stability, however small: σ = −0.1 rings for a long time and
 * settles, while σ = +0.1 looks the same at first and then grows without bound. Further left settles
 * faster; further from the axis rings more. The response is built from the poles by partial
 * fractions and checked against an RK4 solution of the differential equation
 * (packages/subjects/src/mechanics/poles.js).
 */
const T = 30;
const SCENARIOS = [
  { id: 'damped', name: 'Damped: σ = −1, ω = 2', sigma: -1, omega: 2 },
  { id: 'slow', name: 'Barely stable: σ = −0.1', sigma: -0.1, omega: 2 },
  { id: 'growing', name: 'Barely unstable: σ = +0.1', sigma: 0.1, omega: 2 },
  { id: 'double', name: 'A double real pole at −1.5', sigma: -1.5, omega: 0 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, sigma: sc.sigma, omega: sc.omega });
}

const KEYS = [['pl-s', 'sigma'], ['pl-w', 'omega']];
const YLO = -2;
const YHI = 4;

/** The s-plane: the right half shaded, the two poles as crosses. */
function plane(B, rect, state) {
  const P = plotIn(B, rect, { lo: -3.5, hi: 1.5 }, { lo: -6.5, hi: 6.5 });
  axes(P, { xLabel: 'Re s = σ', yLabel: 'Im s = ω' });
  poly(P, [[0, -6.5], [1.5, -6.5], [1.5, 6.5], [0, 6.5]], { fill: alpha(C.red, 0.1), stroke: null });
  seg(P, [0, -6.5], [0, 6.5], { color: alpha(C.text, 0.5), width: 1 });
  seg(P, [-3.5, 0], [1.5, 0], { color: alpha(C.text, 0.3), width: 1 });
  label(P, 'grows', [0.75, 6.5], { color: C.red, dy: 12 });
  label(P, 'decays', [-1.75, 6.5], { color: C.green, dy: 12 });
  const color = state.sigma < 0 ? C.gold : state.sigma > 0 ? C.red : C.muted;
  const px = P.X(state.sigma);
  const r = 7;
  for (const w of state.omega > 0 ? [state.omega, -state.omega] : [0]) {
    const py = P.Y(w);
    const ctx = P.ctx;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px - r, py - r);
    ctx.lineTo(px + r, py + r);
    ctx.moveTo(px + r, py - r);
    ctx.lineTo(px - r, py + r);
    ctx.stroke();
    ctx.restore();
  }
  label(P, state.omega > 0 ? `${fig(state.sigma)} ± ${fig(state.omega)}j` : `${fig(state.sigma)}, twice`, [state.sigma, state.omega], { color, align: state.sigma > 0.2 ? 'right' : 'left', dx: state.sigma > 0.2 ? -12 : 12, dy: -12 });
}

/** The step response, clipped to the plot, with where it leaves. */
function response(B, rect, c) {
  const P = plotIn(B, rect, { lo: 0, hi: T }, { lo: YLO, hi: YHI });
  axes(P, { xLabel: 'time t (s)', yLabel: 'step response y' });
  seg(P, [0, 1], [T, 1], { color: alpha(C.green, 0.6), width: 1, dash: [5, 4] });
  seg(P, [0, 0], [T, 0], { color: alpha(C.text, 0.3), width: 1 });
  let piece = [];
  let leftAt = null;
  c.ts.forEach((t, i) => {
    const y = c.closed[i];
    if (y >= YLO && y <= YHI) piece.push([t, y]);
    else {
      if (piece.length) line(P, piece, { color: c.stable ? C.gold : C.red, width: 2.5 });
      if (leftAt == null) leftAt = t;
      piece = [];
    }
  });
  if (piece.length) line(P, piece, { color: c.stable ? C.gold : C.red, width: 2.5 });
  const msg = c.stable ? `settles to 1 in about ${fig(c.settle)} s` : leftAt != null ? `off the chart after ${fig(leftAt)} s, and still growing` : 'never settles';
  // Above the plot, in its top margin, clear of the curve.
  label(P, msg, [T, YHI], { color: c.stable ? C.green : C.red, align: 'right', dy: -12 });
}

export default defineLab({
  id: 'poles',
  exam: 'u3',
  title: 'Poles',
  hint: 'Slide σ from −0.1 to +0.1. For the first few seconds the two responses look alike. Then watch where they go.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('damped', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'sigma', lo: -3, hi: 1 }),
  controls() {
    return `
      ${slider('pl-s', 'Real part σ of the poles (1/s)', -1, -3, 1, 0.05)}
      ${slider('pl-w', 'Imaginary part ω (rad/s)', 2, 0, 6, 0.05)}
      <p class="tiny">G(s) = K/((s − p)(s − p̄)) with p = σ + jω, scaled so a settling response ends at 1. A unit step goes in at t = 0. Red half-plane: poles there grow. ω = 0 puts both poles on the real axis at σ.</p>`;
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
    return polesChecked({ sigma: state.sigma, omega: state.omega, T, samples: 600 });
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      response(B, B.free, c);
      return;
    }
    const left = wide ? { ...B.free, x1: B.free.x0 + 0.4 * W } : { ...B.free, y1: B.free.y0 + 0.45 * H };
    const right = wide ? { ...B.free, x0: left.x1 } : { ...B.free, y0: left.y1 };
    plane(B, left, state);
    response(B, right, c);
  },
  law: () => [String.raw`G(s) = \frac{K}{(s - p)(s - \bar p)}, \qquad p = \sigma + j\omega`, String.raw`y(t) = 1 + 2\,\mathrm{Re}\!\left(\frac{K e^{pt}}{p\,(p - \bar p)}\right)`, String.raw`\text{stable} \iff \sigma < 0`],
  liveRows(state, c) {
    return [
      kv('Poles', state.omega > 0 ? `${fig(state.sigma)} ± ${fig(state.omega)}j` : `${fig(state.sigma)} (double)`),
      kv('Denominator s² + a₁s + a₀', `a₁ = ${fig(c.routh.a1)}, a₀ = ${fig(c.routh.a0)}`),
      kv('Routh: both coefficients positive?', c.routh.a1 > 0 && c.routh.a0 > 0 ? 'yes: stable' : 'no: unstable'),
      kv('ω_n and ζ', c.zeta == null ? '–' : `${fig(c.wn)} rad/s, ${fig(c.zeta)}`),
      kv('Overshoot, settling time', c.stable ? `${fig(100 * c.overshoot)}%, ${fig(c.settle)} s` : '–'),
      kv(c.doubling ? 'Envelope doubles every' : 'Period of the ringing', c.doubling ? `${fig(c.doubling)} s` : c.period ? `${fig(c.period)} s` : '–'),
      kv(`y at ${T} s`, fig(c.yEnd)),
      kv('Poles against RK4, largest difference', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['σ', fig(state.sigma)],
      ['stable', c.stable ? 'yes' : 'no'],
      ['overshoot', c.stable ? `${fig(100 * c.overshoot)}%` : '–'],
      [`y at ${T} s`, fig(c.yEnd)],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Real loops have more than two poles, and zeros that shape the response too. Actuators saturate, so a loop that is unstable in the linear model may instead settle into a steady oscillation.`;
    if (state.sigma > 0) {
      return { title: 'A small σ still grows without bound', body: `With σ = ${fig(state.sigma)} the envelope e^(σt) doubles every ${fig(c.doubling)} s. Early on it looks like a slowly settling response; by ${T} s it has reached ${fig(c.yEnd)}, and it keeps going. Any pole right of the axis is unstable. ${leavesOut}` };
    }
    if (state.sigma === 0 || Math.abs(state.sigma) < 1e-9) {
      return { title: 'On the axis: never settles', body: `With σ = 0 the response ${state.omega > 0 ? 'oscillates for ever without growing or fading' : 'grows as t²/2, a double integrator'}. It is not stable: a nudge never dies out. ${leavesOut}` };
    }
    if (state.sigma > -0.3) {
      return { title: 'Stable, barely', body: `σ = ${fig(state.sigma)} decays, but slowly: the 2% settling time is 4/|σ| = ${fig(c.settle)} s, and the first overshoot is ${fig(100 * c.overshoot)}%. A satellite that rang this long would blur every image. ${leavesOut}` };
    }
    return { title: 'Left settles, up rings', body: `The poles at ${state.omega > 0 ? `${fig(state.sigma)} ± ${fig(state.omega)}j` : `${fig(state.sigma)}`} settle in about ${fig(c.settle)} s with ${fig(100 * c.overshoot)}% overshoot. Move them left to settle faster; move them away from the real axis and the response rings more. ${leavesOut}` };
  },
  app: false,
});
