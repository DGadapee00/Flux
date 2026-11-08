import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { BRACKET, trans2, vibChecked, vibClosed } from '@flux/subjects/mechanics/randomvib.js';

/**
* Random vibration: a bracket under the launcher's broadband shaking, with sliders for its natural
 * frequency, its amplification Q and the input level, the response spectrum and the fatigue life drawn.
 *
 * Shows that a launch qualification is a fatigue test as well as a strength test: a 100 Hz bracket
 * with Q = 10 under 0.04 g²/Hz sees 8.0 g rms and lasts about 590 hours of shaking, but at 300 Hz,
 * Q = 30 and 0.1 g²/Hz it sees 38 g rms and fails in about half a minute, inside a two-minute test.
 * Miles' equation is checked by integrating the response spectrum, and the narrow-band damage formula
 * by integrating over the Rayleigh peaks (packages/subjects/src/mechanics/randomvib.js).
 */
const SCENARIOS = [
  { id: 'bracket', name: '100 Hz, Q = 10, 0.04 g²/Hz', fn: 100, Q: 10, W: 0.04 },
  { id: 'stiffer', name: '200 Hz, same input', fn: 200, Q: 10, W: 0.04 },
  { id: 'lively', name: '100 Hz, Q = 20', fn: 100, Q: 20, W: 0.04 },
  { id: 'harsh', name: '300 Hz, Q = 30, 0.1 g²/Hz', fn: 300, Q: 30, W: 0.1 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, fn: sc.fn, Q: sc.Q, W: sc.W });
}

const KEYS = [['rv-f', 'fn'], ['rv-q', 'Q'], ['rv-w', 'W']];

const life = (s) => (s > 7200 ? `${fig(s / 3600)} h` : s > 120 ? `${fig(s / 60)} min` : `${fig(s)} s`);

function spectra(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 10, hi: 2000, log: true }, { lo: 1e-4, hi: 100, log: true });
  axes(P, { xLabel: 'frequency (Hz)', yLabel: 'acceleration spectrum (g²/Hz)' });
  seg(P, [10, state.W], [2000, state.W], { color: alpha(C.muted, 0.9), width: 1.5, dash: [5, 4] });
  label(P, 'input', [12, state.W], { color: C.muted, align: 'left', dy: -8 });
  const fs = Array.from({ length: 401 }, (_, i) => 10 * 200 ** (i / 400));
  line(P, fs.map((f) => [f, Math.max(1e-4, Math.min(100, state.W * trans2(f / state.fn, state.Q)))]), { color: C.gold, width: 2.5 });
  label(P, `response ${fig(c.grms)} g rms`, [state.fn, Math.min(100, state.W * trans2(1, state.Q))], { color: C.gold, align: 'left', dx: 8 });
}

function lifePlot(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 20, hi: 500, log: true }, { lo: 1, hi: 1e9, log: true });
  axes(P, { xLabel: 'natural frequency f_n (Hz)', yLabel: 'fatigue life (s of shaking)' });
  const fs = Array.from({ length: 101 }, (_, i) => 20 * 25 ** (i / 100));
  line(P, fs.map((f) => [f, Math.max(1, Math.min(1e9, vibClosed({ ...state, fn: f }).lifeS))]), { color: C.gold, width: 2.5 });
  seg(P, [20, 120], [500, 120], { color: alpha(C.red, 0.8), width: 1.5, dash: [5, 4] });
  label(P, 'a two-minute test', [500, 120], { color: C.red, align: 'right', dy: -8 });
  dot(P, state.fn, Math.max(1, Math.min(1e9, c.lifeS)), { color: C.pink, r: 6, ring: C.text });
}

export default defineLab({
  id: 'random',
  exam: 'u4',
  title: 'Random vibration',
  hint: 'Double Q and read the rms response. Then raise the input and the natural frequency until the bracket fails inside the test.',
  gapLimit: 1e-8,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('bracket', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'fn', lo: 20, hi: 500 }),
  controls() {
    return `
      ${slider('rv-f', "Bracket’s natural frequency f_n (Hz)", 100, 20, 500, 1)}
      ${slider('rv-q', "Amplification Q", 10, 5, 50, 0.5)}
      ${slider('rv-w', "Input level (g²/Hz)", 0.04, 0.005, 0.2, 0.005)}
      <p class="tiny">A flat input spectrum, 20 to 2000 Hz in practice and taken as unbounded here. Bracket stress 4 MPa per g; aluminium S–N curve N = 10⁷ (100 MPa/S)^6.4 (model values). Left: input and response spectra. Right: fatigue life against natural frequency, with a two-minute test marked.</p>`;
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
    return vibChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      lifePlot(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    spectra(B, a, state, c);
    lifePlot(B, b, state, c);
  },
  law: () => [String.raw`g_\text{rms} = \sqrt{\tfrac{\pi}{2} f_n Q W}\ \text{(Miles)}`, String.raw`\dot D = f_n\,\frac{(\sqrt2\,\sigma_\text{rms})^b\,\Gamma(1 + b/2)}{N_\text{ref}S_\text{ref}^b}, \qquad t_\text{life} = 1/\dot D`],
  liveRows(state, c) {
    return [
      kv('Response, and Miles', `${fig(c.grms)} g rms, ${fig(c.miles)}`),
      kv('Stress rms, and 3σ', `${fig(c.srms)} MPa, ${fig(c.peak3)} MPa`),
      kv('Fatigue life', life(c.lifeS)),
      kv('Two-minute test', c.lifeS > 120 ? `${fig(c.lifeS / 120)} tests’ worth of life` : 'fails during it'),
      kv('Closed forms against the integrals', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['response', `${fig(c.grms)} g rms`], ['stress', `${fig(c.srms)} MPa rms`], ['life', life(c.lifeS)], ['f_n', `${fig(state.fn)} Hz`]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Real input spectra are shaped, not flat; brackets have several modes; and Miner’s rule, which adds up the damage, is itself only accurate to a factor of a few. Margins and a fatigue factor cover that.`;
    if (c.lifeS < 4 * 120) return { title: 'It would not survive qualification', body: `At ${fig(c.grms)} g rms the bracket’s stress peaks near ${fig(c.peak3)} MPa, and fatigue gives it only ${life(c.lifeS)} of shaking: less than four two-minute tests, the usual margin. Stiffen it, damp it, or isolate it. ${leavesOut}` };
    return { title: 'Random shaking is a fatigue load', body: `The bracket filters the flat input into a peak at ${fig(state.fn)} Hz: ${fig(c.grms)} g rms, ${fig(c.srms)} MPa rms. Every cycle does a little damage, ${life(c.lifeS)} of it in all. Doubling Q raises the response by √2 and cuts the life about ninefold. ${leavesOut}` };
  },
  app: false,
});
