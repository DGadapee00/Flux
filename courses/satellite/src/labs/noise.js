import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, label, line, plotIn, poly, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { dB, dBm, link, measureNoise } from '@flux/subjects/em/noise.js';

/**
 * Noise: a satellite's bits arriving at a ground receiver, buried in the receiver's own thermal noise.
 *
 * Shows that a weak signal is lost when it sinks below the noise, not because it is small. The noise
 * is k_B T_sys B: cool the receiver or narrow its band and the same signal reads cleanly again. The
 * noise power comes in closed form; the second method generates seeded white noise of density k_B T,
 * cuts it to the band by FFT and measures its power from the samples
 * (packages/subjects/src/em/noise.js).
 */
const SCENARIOS = [
  { id: 'cubesat', name: 'A small satellite’s downlink, 10 kHz', Pr: -120, T: 500, B: 1e4 },
  { id: 'wide', name: 'The same signal in a 1 MHz band', Pr: -120, T: 500, B: 1e6 },
  { id: 'cold', name: 'A cooled receiver, 100 K', Pr: -120, T: 100, B: 1e4 },
  { id: 'weak', name: 'A signal 15 dB weaker', Pr: -135, T: 500, B: 1e4 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, Pr: sc.Pr, lT: Math.log10(sc.T), lB: Math.log10(sc.B) });
}

const BITS = [1, -1, -1, 1, -1, 1, 1, 1, -1, -1, 1, -1, 1, -1, -1, -1, 1, 1, -1, 1, 1, -1, 1, 1, -1, -1, 1, -1, 1, 1, -1, 1];
const hz = (f) => (f >= 1e6 ? `${fig(f / 1e6)} MHz` : f >= 1e3 ? `${fig(f / 1e3)} kHz` : `${fig(f)} Hz`);

export default defineLab({
  id: 'noise',
  exam: 'u2',
  title: 'Noise',
  hint: 'Widen the band and the same signal drowns; narrow it or cool the receiver and the bits come back. The signal never changed.',
  gapLimit: 0.03,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('cubesat', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'lB', lo: 3, hi: 7 }),
  controls() {
    return `
      ${slider('nz-p', 'Received power (dBm)', -120, -150, -90, 0.5)}
      ${slider('nz-t', 'System noise temperature, log₁₀ T (K)', Math.log10(500), 1.5, 3.5, 0.01)}
      ${slider('nz-b', 'Bandwidth, log₁₀ B (Hz)', 4, 3, 7, 0.01)}
      <p class="tiny">Binary phase-shift keying at one bit per hertz of band, so E_b/N_0 = S/N. T from 32 K to 3200 K; B from 1 kHz to 10 MHz. The trace shows 32 bits: gold as sent, teal as received with the noise.</p>`;
  },
  bind(api) {
    bindSlider('nz-p', (s, v) => { s.Pr = v; }, api);
    bindSlider('nz-t', (s, v) => { s.lT = v; }, api);
    bindSlider('nz-b', (s, v) => { s.lB = v; }, api);
  },
  syncControls(state) {
    for (const [id, val] of [['nz-p', state.Pr], ['nz-t', state.lT], ['nz-b', state.lB]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    }
  },
  compute(state) {
    const T = 10 ** state.lT;
    const B = 10 ** state.lB;
    const l = link({ Pr: state.Pr, T, B });
    const m = measureNoise({ T, B });
    const gap = Math.abs(m.power - l.N) / l.N;
    return { ...l, T, B, measured: m.power, measuredDBm: dBm(m.power), samples: m.samples, gap, readable: l.ber < 1e-2 };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const wide = W > 1.5 * (B.free.y1 - B.free.y0) && W > 560;
    // A short canvas (a phone) gets the trace alone; the power levels are in the panel.
    const both = wide || B.free.y1 - B.free.y0 > 420;
    const [top, bottom] = both ? split(B.free, wide ? 0.6 : 0.55) : [B.free, null];
    // The received waveform: 32 bits at 8 samples each, with the receiver's noise added.
    const a = Math.sqrt(c.S);
    const n = c.samples.length;
    const sig = (i) => a * BITS[Math.floor(i / 8) % BITS.length];
    const span = Math.max(2.2 * a, 3.2 * Math.sqrt(c.measured));
    const P = plotIn(B, top, { lo: 0, hi: n }, { lo: -span, hi: span });
    axes(P, { xLabel: 'samples, 8 per bit', yLabel: 'amplitude (√W)', yFmt: (v) => (Math.abs(v) < 1e-3 * span ? '0' : v.toExponential(0)) });
    line(P, c.samples.map((v, i) => [i, sig(i) + v]), { color: alpha(C.teal, 0.85), width: 1.2 });
    const steps = [];
    for (let i = 0; i < n; i++) steps.push([i, sig(i)], [i + 1, sig(i)]);
    line(P, steps, { color: C.gold, width: 2 });
    seg(P, [0, 0], [n, 0], { color: alpha(C.text, 0.4), width: 1, dash: [4, 4] });
    label(P, `S/N = ${fig(c.snrDB)} dB`, [n, span], { color: c.readable ? C.green : C.red, align: 'right', dy: -14 });
    if (!bottom) return;

    // Power levels in dBm: the signal against the noise, by formula and from the samples.
    const vals = [state.Pr, c.noiseDBm, c.measuredDBm];
    const lo = Math.floor((Math.min(...vals) - 15) / 10) * 10;
    const hi = Math.ceil((Math.max(...vals) + 8) / 10) * 10;
    const Q = plotIn(B, bottom, { lo: 0, hi: 3 }, { lo, hi });
    axes(Q, { yLabel: 'dBm', xFmt: () => '' });
    const names = ['signal S', 'noise kTB', 'noise, sampled'];
    const colours = [C.gold, C.pink, C.purple];
    vals.forEach((v, i) => {
      poly(Q, [[i + 0.22, lo], [i + 0.78, lo], [i + 0.78, v], [i + 0.22, v]], { fill: alpha(colours[i], 0.5), stroke: colours[i], width: 1.5 });
      label(Q, fig(v), [i + 0.5, v], { color: C.text, dy: -10 });
      label(Q, names[i], [i + 0.5, lo], { color: colours[i], dy: 14 });
    });
  },
  law: () => [String.raw`N = k_B T_\text{sys} B, \qquad \frac{S}{N} = \frac{S}{k_B T_\text{sys} B}`, String.raw`\frac{E_b}{N_0} = \frac{S}{k_B T_\text{sys} R_b}, \qquad \text{BER} = \tfrac12\operatorname{erfc}\sqrt{E_b/N_0}`],
  liveRows(state, c) {
    return [
      kv('Signal S', `${fig(state.Pr)} dBm, ${c.S.toExponential(2)} W`),
      kv('T_sys, bandwidth B', `${fig(c.T)} K, ${hz(c.B)}`),
      kv('Noise kTB', `${fig(c.noiseDBm)} dBm`),
      kv('Noise from samples', `${fig(c.measuredDBm)} dBm`),
      kv('Two methods differ by', `${fig(c.gap * 100)}%`),
      kv('S/N = E_b/N_0', `${fig(c.snrDB)} dB`),
      kv('Bits wrong (BPSK)', c.ber < 1e-15 ? 'below 1 in 10¹⁵' : c.ber.toExponential(1)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['S/N', `${fig(c.snrDB)} dB`],
      ['noise', `${fig(c.noiseDBm)} dBm`],
      ['bits wrong', c.ber < 1e-15 ? '< 1e-15' : c.ber.toExponential(1)],
      ['band', hz(c.B)],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Only the receiver's own thermal noise: no interference, no fading, no coding. Real links add a margin of several dB for those, and error-correcting codes read bits at a lower E_b/N_0.`;
    if (!c.readable) {
      return {
        title: 'Below the noise',
        body: `The signal is ${fig(state.Pr)} dBm and the noise in ${hz(c.B)} is ${fig(c.noiseDBm)} dBm, so S/N is ${fig(c.snrDB)} dB and about ${fig(100 * c.ber)}% of bits come out wrong. The signal is not too small in itself: the band lets in too much noise. Narrow it, at a lower bit rate, or cool the receiver. ${leavesOut}`,
      };
    }
    return {
      title: 'Above the noise',
      body: `The noise in ${hz(c.B)} at ${fig(c.T)} K is ${fig(c.noiseDBm)} dBm, ${fig(c.snrDB)} dB below the signal. With one bit per hertz, E_b/N_0 is ${fig(c.snrDB)} dB, ${c.ber < 1e-15 ? 'and practically no bits come out wrong' : `and about ${c.ber.toExponential(1)} of bits come out wrong`}. Binary phase-shift keying needs about 10.5 dB for one error in a million. ${leavesOut}`,
    };
  },
  app: false,
});
