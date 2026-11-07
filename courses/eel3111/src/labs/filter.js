import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { filterChecked, squareInput, squareResponse } from '@flux/subjects/em/filters.js';

/**
 * Filter: a 1 kHz, ±1 V square wave through an RC low-pass filter with a slider for the corner
 * frequency, the waves in time beside the harmonics in frequency.
 *
 * Shows that a filter reshapes a signal, not only weakens it: each harmonic is cut and delayed by its
 * own amount, so the square's corners round off, and with the corner well below 1 kHz the output is
 * a small triangle. The harmonics come from H(jω); the second method solves the circuit in time and
 * takes the Fourier coefficients of that solution (packages/subjects/src/em/filters.js).
 */
const F0 = 1000;
const SCENARIOS = [
  { id: 'high', name: 'Corner at 10 kHz: corners rounded', fc: 10000 },
  { id: 'equal', name: 'Corner at 1 kHz, the square’s own frequency', fc: 1000 },
  { id: 'low', name: 'Corner at 200 Hz: a small triangle', fc: 200 },
  { id: 'three', name: 'Corner at 3 kHz', fc: 3000 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, lfc: Math.log10(sc.fc) });
}

const hz = (f) => (f >= 1000 ? `${fig(f / 1000)} kHz` : `${fig(f)} Hz`);
const us = (t) => `${fig(t * 1e6)} µs`;

/** Two periods of the input square and the filtered output. */
function waves(B, rect, c) {
  const P = plotIn(B, rect, { lo: 0, hi: 2 }, { lo: -1.3, hi: 1.45 });
  axes(P, { xLabel: 'time (ms)', yLabel: 'volts' });
  const N = 400;
  const tin = [];
  for (let k = 0; k <= N; k++) {
    const t = (2 * k) / N;
    tin.push([t, squareInput(t * 1e-3, c.T)]);
  }
  // The square, with its jumps drawn upright.
  const sq = [];
  for (let k = 0; k < tin.length; k++) {
    if (k > 0 && tin[k][1] !== tin[k - 1][1]) sq.push([tin[k][0], tin[k - 1][1]]);
    sq.push(tin[k]);
  }
  line(P, sq, { color: alpha(C.muted, 0.7), width: 1.5 });
  const out = Array.from({ length: N + 1 }, (_, k) => {
    const t = (2 * k) / N;
    return [t, squareResponse(t * 1e-3, c.T, c.tau)];
  });
  line(P, out, { color: C.gold, width: 2.5 });
  // The fundamental alone, dashed, to show it has a delay of its own.
  const h1 = c.first;
  const fund = Array.from({ length: N + 1 }, (_, k) => {
    const t = (2 * k) / N;
    return [t, h1.ampOut * Math.sin(2 * Math.PI * F0 * t * 1e-3 + h1.phase)];
  });
  line(P, fund, { color: alpha(C.teal, 0.8), width: 1.3, dash: [5, 4] });
  label(P, 'in', [0.02, 1], { color: C.muted, align: 'left', dy: -10 });
  label(P, 'out', [2, c.Vp], { color: C.gold, align: 'right', dy: -10 });
  label(P, 'its fundamental', [2, 1.45], { color: C.teal, align: 'right', dy: 10 });
}

/** Odd harmonics, in and out, with |H| drawn over them. */
function spectrum(B, rect, c) {
  const P = plotIn(B, rect, { lo: 0, hi: 16 }, { lo: 0, hi: 1.45 });
  axes(P, { xLabel: 'harmonic n (times 1 kHz)', yLabel: 'amplitude (V)', xFmt: (v) => (v % 2 === 1 ? String(v) : '') });
  for (const h of c.list) {
    poly(P, [[h.n - 0.45, 0], [h.n, 0], [h.n, h.ampIn], [h.n - 0.45, h.ampIn]], { fill: alpha(C.muted, 0.35), stroke: null });
    poly(P, [[h.n, 0], [h.n + 0.45, 0], [h.n + 0.45, h.ampOut], [h.n, h.ampOut]], { fill: alpha(C.gold, 0.85), stroke: null });
  }
  // |H| on the same axis, scaled to the fundamental's input height.
  const curve = Array.from({ length: 161 }, (_, k) => {
    const n = 0.1 * k;
    return [n, (4 / Math.PI) / Math.sqrt(1 + (2 * Math.PI * n * F0 * c.tau) ** 2)];
  });
  line(P, curve, { color: alpha(C.teal, 0.8), width: 1.5, dash: [5, 4] });
  const nc = c.fc / F0;
  if (nc <= 16) {
    seg(P, [nc, 0], [nc, 1.45], { color: alpha(C.pink, 0.7), width: 1, dash: [3, 3] });
    label(P, 'corner', [nc, 1.45], { color: C.pink, align: nc > 12 ? 'right' : 'left', dx: nc > 12 ? -4 : 4, dy: 10 });
  }
  label(P, 'grey: in, gold: out', [16, 1.2], { color: C.muted, align: 'right' });
}

export default defineLab({
  id: 'filter',
  exam: 'u2',
  title: 'Filter',
  hint: 'Slide the corner down from 10 kHz. The square does not just shrink: its corners round, then it turns into a triangle, because the high harmonics are cut harder and delayed less.',
  gapLimit: 1e-5,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('high', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'lfc', lo: 2, hi: 4.5 }),
  controls() {
    return `
      ${slider('fl-fc', 'Corner frequency, log₁₀ f_c (Hz)', 4, 2, 4.5, 0.01)}
      <p class="tiny">A ±1 V square wave at 1 kHz drives R in series with C; the output is across C. f_c = 1/(2πRC) runs from 100 Hz to 32 kHz. Grey: the input. Gold: the output. Teal dashes: the output’s fundamental alone, and |H| over the harmonics.</p>`;
  },
  bind(api) {
    bindSlider('fl-fc', (s, v) => { s.lfc = v; }, api);
  },
  syncControls(state) {
    const e = document.getElementById('fl-fc');
    if (e && document.activeElement !== e) e.value = String(state.lfc);
  },
  compute(state) {
    const fc = 10 ** state.lfc;
    const r = filterChecked({ f0: F0, fc });
    return { ...r, fc, ratioIn: 1 / 3, peak: r.Vp, delayGap: r.first.delay - r.third.delay };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      waves(B, B.free, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.52 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    waves(B, a, c);
    spectrum(B, b, c);
  },
  law: () => [String.raw`H(j\omega) = \frac{1}{1 + j\omega RC}, \qquad f_c = \frac{1}{2\pi RC}`, String.raw`v_\text{in} = \frac{4}{\pi}\sum_{n\ \text{odd}} \frac{\sin n\omega_0 t}{n}`, String.raw`v_\text{out} = \frac{4}{\pi}\sum_{n\ \text{odd}} \frac{|H(jn\omega_0)|}{n}\,\sin\!\big(n\omega_0 t + \angle H\big)`],
  liveRows(state, c) {
    const [h1, h3, h5] = c.list;
    return [
      kv('Corner f_c, and RC', `${hz(c.fc)}, ${us(c.tau)}`),
      kv('|H| at 1, 3 and 5 kHz', `${fig(h1.gain)}, ${fig(h3.gain)}, ${fig(h5.gain)}`),
      kv('Delay at 1, 3 and 5 kHz', `${us(h1.delay)}, ${us(h3.delay)}, ${us(h5.delay)}`),
      kv('3rd harmonic over the 1st, out', `${fig(c.ratio31)} (in: 0.333)`),
      kv('Output peak', `${fig(c.Vp)} V`),
      kv('Harmonics against the time solution', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['corner', hz(c.fc)],
      ['peak out', `${fig(c.Vp)} V`],
      ['3rd / 1st', fig(c.ratio31)],
      ['delay at 1 kHz', us(c.first.delay)],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> The source’s and the load’s own resistance, which shift the corner, and real capacitors’ leakage and series resistance. Higher-order filters cut faster past the corner than this one’s 20 dB per decade.`;
    const [h1, h3] = c.list;
    if (c.fc >= 5 * F0) {
      return { title: 'Rounded corners', body: `With the corner at ${hz(c.fc)} the first few harmonics pass almost whole: |H| is ${fig(h1.gain)} at 1 kHz and ${fig(h3.gain)} at 3 kHz. Only the high ones that make the sharp edges are cut, so the corners round off. ${leavesOut}` };
    }
    if (c.fc <= F0 / 3) {
      return { title: 'A triangle, not a small square', body: `With the corner at ${hz(c.fc)}, every harmonic is cut, and the higher ones harder: the 3rd is ${fig(c.ratio31)} of the 1st where the input has 0.333. The capacitor barely charges each half cycle, so the output ramps: a triangle of ±${fig(c.Vp)} V. A filter changes the shape as well as the size. ${leavesOut}` };
    }
    return { title: 'Each harmonic cut and delayed its own way', body: `At 1 kHz the filter passes ${fig(h1.gain)} and delays ${us(h1.delay)}; at 3 kHz it passes ${fig(h3.gain)} and delays ${us(h3.delay)}. The harmonics no longer line up as they did in the square, so the output has a new shape. ${leavesOut}` };
  },
  app: false,
});
