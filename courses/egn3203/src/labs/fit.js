import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { XS, fitChecked, fitStats, polyval, qrSolve, truth, vander, data } from '@flux/subjects/math/lsq.js';

/**
* Fit: polynomials of rising degree fitted by least squares to ten noisy points from a line, with
 * sliders for the degree and the noise.
 *
 * Shows that a better fit to the data is not a better model: as the degree rises the misses at the
 * points shrink, to zero at degree 9, while the curve swings away from the line between and beyond
 * them. The line (degree 1) misses the points by 0.22 but the true line by 0.02; degree 9 misses
 * the points by nothing and the line by 1.5. QR is checked against the normal equations
 * (packages/subjects/src/math/lsq.js).
 */
const SCENARIOS = [
  { id: 'line', name: 'A line, degree 1', d: 1, sigma: 1 },
  { id: 'cubic', name: 'A cubic', d: 3, sigma: 1 },
  { id: 'seven', name: 'Degree 7', d: 7, sigma: 1 },
  { id: 'through', name: 'Through every point, degree 9', d: 9, sigma: 1 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, d: sc.d, sigma: sc.sigma });
}

const KEYS = [['ft-d', 'd'], ['ft-s', 'sigma']];

function fitPlot(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: -1.1, hi: 1.1 }, { lo: -0.5, hi: 2.5 });
  axes(P, { xLabel: 'x', yLabel: 'y' });
  line(P, [[-1.1, truth(-1.1)], [1.1, truth(1.1)]], { color: alpha(C.muted, 0.9), width: 1.5, dash: [6, 4] });
  const pts = Array.from({ length: 221 }, (_, i) => {
    const x = -1.1 + (2.2 * i) / 220;
    return [x, Math.max(-0.5, Math.min(2.5, polyval(c.coef, x)))];
  });
  line(P, pts, { color: C.gold, width: 2.5 });
  XS.forEach((x, i) => dot(P, x, c.ys[i], { color: C.blue, r: 5 }));
}

function scores(B, rect, state, c) {
  const rows = Array.from({ length: 10 }, (_, d) => {
    const s = fitStats(d, state.sigma, qrSolve(vander(XS, d), data(state.sigma)));
    return [d, s.miss, s.off];
  });
  const hi = Math.max(0.5, ...rows.map((r) => Math.min(2, r[2]))) * 1.15;
  const P = plotIn(B, rect, { lo: -0.3, hi: 9.3 }, { lo: 0, hi });
  axes(P, { xLabel: 'degree', yLabel: 'root-mean-square size' });
  line(P, rows.map((r) => [r[0], r[1]]), { color: C.blue, width: 2.5 });
  line(P, rows.map((r) => [r[0], Math.min(hi, r[2])]), { color: C.red, width: 2.5 });
  label(P, 'miss at the points', [0, rows[0][1]], { color: C.blue, align: 'left', dx: 6, dy: -10 });
  label(P, 'off the true line', [5, Math.min(hi, rows[5][2])], { color: C.red, align: 'right', dx: -6, dy: -12 });
  dot(P, state.d, c.miss, { color: C.blue, r: 6, ring: C.text });
  dot(P, state.d, Math.min(hi, c.off), { color: C.red, r: 6, ring: C.text });
}

export default defineLab({
  id: 'fit',
  exam: 'u1',
  title: 'Fit',
  hint: 'Raise the degree from 1 to 9. Watch the misses at the points fall to zero while the curve leaves the line.',
  gapLimit: 1e-8,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('line', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'd', lo: 0, hi: 9 }),
  controls() {
    return `
      ${slider('ft-d', "Polynomial degree", 1, 0, 9, 1)}
      ${slider('ft-s', "Noise size", 1, 0, 2, 0.05)}
      <p class="tiny">Ten points at equal spacing on [−1, 1] from y = 1 + 0.5x plus a fixed draw of noise. Left: the points, the true line (dashed) and the fit. Right: the root-mean-square miss at the points and the root-mean-square distance from the true line, against the degree.</p>`;
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
    return fitChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      fitPlot(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    fitPlot(B, a, state, c);
    scores(B, b, state, c);
  },
  law: () => [String.raw`\min_{\mathbf x}\|A\mathbf x - \mathbf b\|^2, \qquad A^{\mathsf T}A\,\hat{\mathbf x} = A^{\mathsf T}\mathbf b`, String.raw`A = QR \;\Rightarrow\; R\hat{\mathbf x} = Q^{\mathsf T}\mathbf b`],
  liveRows(state, c) {
    return [
      kv('Coefficients', String(state.d + 1)),
      kv('Miss at the points (RMS)', fig(c.miss)),
      kv('Off the true line (RMS)', fig(c.off)),
      kv('Slope term', fig(c.slope)),
      kv('QR against the normal equations', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['degree', String(state.d)], ['miss at points', fig(c.miss)], ['off the line', fig(c.off)], ['coefficients', String(state.d + 1)]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> To choose a degree honestly, hold some points back and score the fit on them (cross-validation), or penalise extra coefficients; and the normal equations square A’s condition number, which is why QR is used.`;
    if (state.d >= 6) return { title: 'Fitting the noise', body: `With ${state.d + 1} coefficients for 10 points the curve follows the noise: it misses the points by only ${fig(c.miss)}, but strays ${fig(c.off)} from the line that made them, most near the ends. ${leavesOut}` };
    if (state.d === 0) return { title: 'Too simple', body: `A constant cannot follow the slope: it misses the points by ${fig(c.miss)} and the line by ${fig(c.off)}. ${leavesOut}` };
    return { title: 'Close to the truth', body: `Degree ${state.d} misses the points by ${fig(c.miss)}, mostly the noise, and stays within ${fig(c.off)} of the true line. A higher degree would shrink the first number and grow the second. ${leavesOut}` };
  },
  app: false,
});
