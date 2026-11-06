import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, line, note, plotIn, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { PHASE, aliasByDft, aliasFrequency } from '@flux/subjects/design/instruments.js';

/**
 * Sampling: a vibration sampled by a data-acquisition card, and the frequency the samples show.
 *
 * Shows aliasing: sampled below twice its frequency, a signal does not just lose detail, it shows up
 * as a slower wave that is not there. The folding formula is checked against a windowed DFT of the
 * samples (packages/subjects/src/design/instruments.js). `gap` is the difference as a share of the
 * sample rate.
 */
const SCENARIOS = [
  { id: 'fine', name: '50 Hz sampled at 1 kHz', f: 50, fs: 1000 },
  { id: 'near', name: '480 Hz, just under half the rate', f: 480, fs: 1000 },
  { id: 'alias', name: '950 Hz at 1 kHz: a ghost', f: 950, fs: 1000 },
  { id: 'strobe', name: 'Sampled at its own frequency', f: 400, fs: 400 },
  { id: 'fan', name: 'A fan’s 130 Hz at 200 Hz', f: 130, fs: 200 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, f: sc.f, fs: sc.fs });
}

export default defineLab({
  id: 'sampling',
  exam: 'u5',
  title: 'Sampling',
  hint: 'Lower the sample rate past twice the signal’s frequency: the samples trace out a slower wave that is not there.',
  gapLimit: 5e-4,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('alias', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'f', lo: 10, hi: 1500 }),
  controls() {
    return `
      ${slider('sa-f', 'signal frequency f (Hz)', 950, 10, 1500, 1)}
      ${slider('sa-fs', 'sample rate fₛ (Hz)', 1000, 100, 2000, 10)}
      <p class="tiny">A pure tone. Real cards put an analog low-pass filter before the converter for this reason.</p>`;
  },
  bind(api) {
    bindSlider('sa-f', (s, v) => { s.f = v; }, api);
    bindSlider('sa-fs', (s, v) => { s.fs = v; }, api);
  },
  syncControls(state) {
    for (const [id, val] of [['sa-f', state.f], ['sa-fs', state.fs]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    }
  },
  compute(state) {
    const fa = aliasFrequency(state.f, state.fs);
    const d = aliasByDft(state.f, state.fs, 384);
    const gap = Math.abs(d.f - fa) / state.fs;
    const spectrum = Array.from({ length: 121 }, (_, i) => {
      const g = (i / 120) * (state.fs / 2);
      return [g, d.mag(g)];
    });
    return { fa, dft: d.f, nyquist: state.fs / 2, perCycle: state.fs / state.f, aliased: state.f > state.fs / 2, spectrum, gap };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const [top, bottom] = split(B.free, 0.55);
    const span = 24 / state.fs; // 24 sample periods
    const P = plotIn(B, top, { lo: 0, hi: span * 1000 }, { lo: -1.3, hi: 1.3 });
    axes(P, { xLabel: 't (ms)', yLabel: 'signal' });
    const n = 600;
    line(P, Array.from({ length: n + 1 }, (_, i) => {
      const t = (i / n) * span;
      return [t * 1000, Math.sin(2 * Math.PI * state.f * t + PHASE)];
    }), { color: alpha(C.text, 0.35), width: 1 });
    // The slowest sine through the samples: the alias, with the sign that matches them.
    const k = Math.round(state.f / state.fs);
    const fSigned = state.f - k * state.fs;
    line(P, Array.from({ length: n + 1 }, (_, i) => {
      const t = (i / n) * span;
      return [t * 1000, Math.sin(2 * Math.PI * fSigned * t + PHASE)];
    }), { color: C.pink, width: 2 });
    for (let i = 0; i <= 24; i++) {
      const t = i / state.fs;
      dot(P, t * 1000, Math.sin(2 * Math.PI * state.f * t + PHASE), { color: C.yellow, r: 3.5 });
    }
    const max = Math.max(...c.spectrum.map(([, m]) => m)) || 1;
    const Q = plotIn(B, bottom, { lo: 0, hi: state.fs / 2 }, { lo: 0, hi: 1.15 });
    axes(Q, { xLabel: 'frequency the samples show (Hz)', yFmt: () => '' });
    line(Q, c.spectrum.map(([g, m]) => [g, m / max]), { color: C.teal, width: 2 });
    seg(Q, [c.fa, 0], [c.fa, 1.1], { color: C.pink, width: 1.5, dash: [4, 3] });
    note(Q, `${fig(c.fa)} Hz`, c.fa, 1.05, { color: C.pink });
  },
  law: () => [String.raw`f_a = \left|\,f - k f_s\,\right|,\quad k = \operatorname{round}(f/f_s)`, String.raw`f_s > 2 f_\text{max}`],
  liveRows(state, c) {
    return [
      kv('Nyquist frequency $f_s/2$', `${fig(c.nyquist)} Hz`),
      kv('samples per cycle', fig(c.perCycle)),
      kv('peak of the samples’ spectrum', `${fig(c.dft)} Hz`),
      kv('folding formula against DFT', `${fig(c.gap * 100)}% of fₛ`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['true frequency', `${fig(state.f)} Hz`],
      ['samples show', `${fig(c.fa)} Hz`],
      ['Nyquist', `${fig(c.nyquist)} Hz`],
      ['aliased', c.aliased ? 'yes' : 'no'],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> A pure tone and perfect timing. Real signals carry noise and harmonics up to high frequencies, which alias down too unless an analog anti-aliasing filter removes them before sampling.`;
    let title = 'Sampled well';
    let body = String.raw`${fig(c.perCycle)} samples per cycle: the samples follow the wave, and its frequency reads true.`;
    if (c.aliased && c.fa < 1e-9) {
      title = 'It looks like it stopped';
      body = String.raw`Sampled at its own frequency, every sample lands at the same point of the cycle. The data show a constant, like a strobe light on a fan.`;
    } else if (c.aliased) {
      title = 'A wave that is not there';
      body = String.raw`At ${fig(state.f)} Hz the signal is above the Nyquist frequency, ${fig(c.nyquist)} Hz. The samples trace a ${fig(c.fa)} Hz wave instead, and nothing in the data says it is false.`;
    } else if (c.perCycle < 4) {
      title = 'Under the limit, but barely';
      body = String.raw`Only ${fig(c.perCycle)} samples per cycle. The frequency reads true, but the shape and the peak are poorly caught. Sample five to ten times faster than the highest frequency you care about.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
