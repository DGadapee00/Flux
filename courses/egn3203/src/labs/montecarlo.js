import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { mcChecked, stdErr } from '@flux/subjects/math/montecarlo.js';

/**
* Monte Carlo: estimating π by throwing random points at a square around a quarter circle, with a
 * slider for the number of points.
 *
 * Shows that ten times the samples does not give ten times the accuracy: the standard error falls as
 * 1/√N, so ten times the points gives about three times the accuracy, and a hundred times gives ten.
 * The standard-error formula is checked by computing the quarter circle's area with Simpson's rule
 * (packages/subjects/src/math/montecarlo.js).
 */
const SCENARIOS = [
  { id: 'hundred', name: '100 points', lN: 2 },
  { id: 'thousand', name: '1000 points', lN: 3 },
  { id: 'tenk', name: '10 000 points', lN: 4 },
  { id: 'lakh', name: '100 000 points', lN: 5 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, lN: sc.lN });
}

const KEYS = [['mc-n', 'lN']];

function square(r) {
  const s = Math.min(r.x1 - r.x0, r.y1 - r.y0);
  const cx = (r.x0 + r.x1) / 2;
  const cy = (r.y0 + r.y1) / 2;
  return { ...r, x0: cx - s / 2, x1: cx + s / 2, y0: cy - s / 2, y1: cy + s / 2 };
}

function board(B, rect, state, c) {
  const P = plotIn(B, square(rect), { lo: 0, hi: 1 }, { lo: 0, hi: 1 });
  axes(P, { xLabel: 'x', yLabel: 'y' });
  const r = Math.max(1, Math.min(3, 400 / Math.sqrt(c.pts.length + 1)));
  for (const [x, y, hit] of c.pts) dot(P, x, y, { color: hit ? alpha(C.gold, 0.8) : alpha(C.blue, 0.7), r });
  line(P, Array.from({ length: 91 }, (_, i) => [Math.cos((i * Math.PI) / 180), Math.sin((i * Math.PI) / 180)]), { color: C.text, width: 1.5 });
}

function spread(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 10, hi: 1e6, log: true }, { lo: 2.4, hi: 3.9 });
  axes(P, { xLabel: 'number of points N', yLabel: 'estimate of π' });
  const ns = Array.from({ length: 101 }, (_, i) => 10 * 1e5 ** (i / 100));
  poly(P, [...ns.map((n) => [n, Math.min(3.9, Math.PI + stdErr(n))]), ...ns.slice().reverse().map((n) => [n, Math.max(2.4, Math.PI - stdErr(n))])], { fill: alpha(C.blue, 0.2), stroke: null });
  seg(P, [10, Math.PI], [1e6, Math.PI], { color: alpha(C.text, 0.6), width: 1, dash: [4, 4] });
  for (const e of c.runs) dot(P, c.N, Math.max(2.4, Math.min(3.9, e)), { color: alpha(C.muted, 0.8), r: 3 });
  dot(P, c.N, Math.max(2.4, Math.min(3.9, c.est)), { color: C.pink, r: 6, ring: C.text });
  label(P, 'π ± one standard error', [1e6, Math.PI + stdErr(1e6)], { color: C.blue, align: 'right', dy: -12 });
}

export default defineLab({
  id: 'montecarlo',
  exam: 'u2',
  title: 'Monte Carlo',
  hint: 'Go from 1000 points to 10 000 and to 100 000. Watch how slowly the shaded band narrows.',
  gapLimit: 1e-8,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('hundred', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'lN', lo: 1, hi: 6 }),
  controls() {
    return `
      ${slider('mc-n', "Number of points, log₁₀ N", 3, 1, 6, 0.05)}
      <p class="tiny">Points from a fixed, seeded generator, so a given N gives the same estimate each time. Left: up to 3000 of the points, inside the quarter circle in gold. Right: the estimate against N, with π ± one standard error (shaded) and other runs at this N.</p>`;
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
    return mcChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      spread(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    board(B, a, state, c);
    spread(B, b, state, c);
  },
  law: () => [String.raw`I = \int_\Omega f\,dV \approx \frac{|\Omega|}{N}\sum_{i=1}^{N} f(\mathbf x_i)`, String.raw`\text{standard error} = \frac{|\Omega|\,\sigma_f}{\sqrt N}, \qquad \pi \approx 4\,\frac{\text{inside}}{N} \pm \frac{4\sqrt{p(1 - p)}}{\sqrt N}`],
  liveRows(state, c) {
    return [
      kv('Points', String(c.N)),
      kv('Inside', String(c.inside)),
      kv('Estimate', c.est.toFixed(5)),
      kv('Error, and the standard error', `${c.err.toExponential(1)}, ${c.se.toExponential(1)}`),
      kv('Standard error against Simpson’s p', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['estimate', c.est.toFixed(4)], ['error', c.err.toExponential(1)], ['standard error', c.se.toExponential(1)], ['N', String(c.N)]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Low-discrepancy sequences, which spread the points evenly instead of at random, converge nearer 1/N in low dimensions; Monte Carlo’s 1/√N wins only when the dimension is high.`;
    return { title: 'Accuracy grows as √N', body: `With N = ${c.N} the estimate is ${c.est.toFixed(4)}, off by ${c.err.toExponential(1)}; the standard error is 1.64/√N = ${c.se.toExponential(1)}. Each throw is a coin weighted π/4, and averaging N of them shrinks the spread only as 1/√N: ten times the points buys about three times the accuracy. ${leavesOut}` };
  },
  app: false,
});
