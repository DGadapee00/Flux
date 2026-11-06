import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, line, note, plotIn, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { pwmClosed, pwmNumeric } from '@flux/subjects/design/instruments.js';

/**
 * PWM: a microcontroller's timer switching 12 V onto a coil (a motor winding held still, or a
 * solenoid) through a transistor.
 *
 * Shows that the duty cycle sets the average voltage and current, and the frequency only sets how
 * much the current ripples: below the coil's time constant it follows the switching. A faster PWM
 * leaves fewer timer counts per period. The ripple formula is checked by stepping the coil period
 * by period from rest (packages/subjects/src/design/instruments.js).
 */
const V = 12;
const R = 2;
const L = 1e-3;
const CLOCK = 16e6; // timer clock, Hz: an example microcontroller

const SCENARIOS = [
  { id: 'fast', name: '20 kHz, half duty', D: 0.5, f: 20000 },
  { id: 'slow', name: '200 Hz, half duty', D: 0.5, f: 200 },
  { id: 'quarter', name: '20 kHz, quarter duty', D: 0.25, f: 20000 },
  { id: 'audible', name: '2 kHz, half duty', D: 0.5, f: 2000 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, D: sc.D, logf: Math.log10(sc.f) });
}

export default defineLab({
  id: 'pwm',
  exam: 'u6',
  title: 'PWM drive',
  hint: 'Change the duty cycle: the average current follows. Change the frequency: the average stays, and only the ripple changes.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('fast', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'D', lo: 0.02, hi: 0.98 }),
  controls() {
    return `
      ${slider('pw-D', 'duty cycle D', 0.5, 0, 1, 0.01)}
      ${slider('pw-f', 'frequency, log₁₀ f (Hz)', 4.3, 2, 4.7, 0.01)}
      <p class="tiny">12 V into a 2 Ω, 1 mH coil: τ = L/R = 0.5 ms. Timer clock 16 MHz, an example microcontroller.</p>`;
  },
  bind(api) {
    bindSlider('pw-D', (s, v) => { s.D = v; }, api);
    bindSlider('pw-f', (s, v) => { s.logf = v; }, api);
  },
  syncControls(state) {
    for (const [id, val] of [['pw-D', state.D], ['pw-f', state.logf]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    }
  },
  compute(state) {
    const f = 10 ** state.logf;
    const p = { V, R, L, D: state.D, f };
    const a = pwmClosed(p);
    const n = pwmNumeric(p);
    const gap = Math.max(Math.abs(n.meanI - a.meanI), Math.abs(n.ripple - a.ripple)) / (V / R);
    const counts = Math.floor(CLOCK / f);
    // Three periods of the steady waveform, for the drawing.
    const T = 1 / f;
    const tau = L / R;
    const lowI = a.meanI - a.ripple / 2;
    let i = Math.max(0, lowI);
    // Start the drawing at the true trough: iterate one period to its fixed point.
    for (let k = 0; k < 200; k++) {
      const on = V / R + (i - V / R) * Math.exp((-state.D * T) / tau);
      i = on * Math.exp((-(1 - state.D) * T) / tau);
    }
    const wave = [];
    const volts = [];
    let cur = i;
    for (let k = 0; k <= 300; k++) {
      const t = (k / 300) * 3 * T;
      const ph = (t % T) / T;
      const v = ph < state.D ? V : 0;
      if (k > 0) {
        const dt = (3 * T) / 300;
        cur = v / R + (cur - v / R) * Math.exp(-dt / tau);
      }
      wave.push([t * 1000, cur]);
      volts.push([t * 1000, v / R]);
    }
    return { ...a, f, counts, bits: Math.log2(counts), audible: f < 20000, wave, volts, gap };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const span = (3 / c.f) * 1000;
    const P = plotIn(B, B.free, { lo: 0, hi: span }, { lo: 0, hi: (V / R) * 1.15 });
    axes(P, { xLabel: 't (ms)', yLabel: 'current (A)' });
    line(P, c.volts, { color: alpha(C.gold, 0.45), width: 1.5 });
    line(P, c.wave, { color: C.teal, width: 2.5 });
    seg(P, [0, c.meanI], [span, c.meanI], { color: C.pink, width: 1.5, dash: [6, 4] });
    note(P, `mean ${fig(c.meanI)} A`, span * 0.02, c.meanI, { color: C.pink, dy: -8 });
    note(P, 'switch on: full 6 A if left on', span * 0.02, (V / R) * 1.05, { color: alpha(C.gold, 0.9) });
  },
  law: () => [String.raw`\bar V = D\,V,\qquad \bar I = \frac{D\,V}{R}`, String.raw`\Delta I = \frac{V}{R}\,\frac{(1 - e^{-DT/\tau})(1 - e^{-(1-D)T/\tau})}{1 - e^{-T/\tau}},\quad \tau = \frac{L}{R}`],
  liveRows(state, c) {
    return [
      kv('frequency', `${fig(c.f)} Hz`),
      kv('period against τ', `${fig(1 / c.f / c.tau)}`),
      kv('timer counts per period', `${c.counts} (${fig(c.bits)} bits)`),
      kv('ripple formula against stepping the coil', `${fig(c.gap * 100)}%`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['average voltage', `${fig(c.avgV)} V`],
      ['mean current', `${fig(c.meanI)} A`],
      ['ripple', `${fig(c.ripple)} A`],
      ['audible', c.audible ? 'yes' : 'no'],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> The transistor is a perfect switch and the coil does not turn. A real driver needs a flyback diode across the coil, or the current's sudden stop will spike the voltage and kill the transistor.`;
    const T = 1 / c.f;
    let title = 'Duty sets the average';
    let body = String.raw`The pin is on ${fig(state.D * 100)}% of the time, so the coil sees ${fig(c.avgV)} V on average and carries ${fig(c.meanI)} A. At ${fig(c.f)} Hz the period is short against τ = 0.5 ms, and the current barely ripples: ${fig(c.ripple)} A.`;
    if (T > c.tau) {
      title = 'Too slow: the current follows the switch';
      body = String.raw`At ${fig(c.f)} Hz each period, ${fig(T * 1000)} ms, is longer than the coil's time constant, so the current climbs and falls each cycle: ${fig(c.ripple)} A of ripple around the same ${fig(c.meanI)} A mean. A motor would judder and hum.`;
    } else if (c.audible) {
      title = 'Smooth enough, but you can hear it';
      body = String.raw`${fig(c.f)} Hz is within hearing, and the coil sings at it. Moving above 20 kHz is quiet, at the cost of timer resolution: ${c.counts} counts per period here.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
