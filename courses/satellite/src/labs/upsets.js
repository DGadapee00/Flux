import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, axes, begin, dot, label, line, plotIn, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { upsetsChecked } from '@flux/subjects/em/upsets.js';

/**
 * Memory upsets: radiation flips bits; a correcting code and a scrubber keep the data.
 *
 * Shows that a code which corrects one bit per word turns a hundred errors a day into one every few
 * years, as long as a scrubber clears each word before a second upset lands in it. The losses
 * grow as the square of the upset rate: a storm four times as intense is sixteen times as costly.
 * Scrubbing twice as often halves them. The closed form is a Poisson count per word; the second
 * method integrates the word's three-state chain (packages/subjects/src/em/upsets.js).
 *
 * The rate, 1.12 × 10⁻⁷ upsets per bit per day, is Cassini's: 280 single-bit errors a day in its
 * 2.5 Gbit recorders (Wikipedia, ECC memory).
 */
export const CASSINI = 280 / 2.5e9; // upsets per bit per day
const WORD = 72; // 64 data bits and 8 check bits

const SCENARIOS = [
  { id: 'daily', name: '1 Gbit with a code, scrubbed daily', gbit: 1, r7: 1.12, lgH: Math.log10(24), ecc: true },
  { id: 'bare', name: 'The same memory with no code', gbit: 1, r7: 1.12, lgH: Math.log10(24), ecc: false },
  { id: 'storm', name: 'A solar storm: four times the upsets', gbit: 1, r7: 4.48, lgH: Math.log10(24), ecc: true },
  { id: 'hourly', name: 'Scrubbed every hour', gbit: 1, r7: 1.12, lgH: 0, ecc: true },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, gbit: sc.gbit, r7: sc.r7, lgH: sc.lgH, ecc: sc.ecc });
}

const KEYS = [['up-g', 'gbit'], ['up-r', 'r7'], ['up-t', 'lgH']];
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
/** 6.14 × 10⁻¹³ */
const sci = (x, n = 3) => {
  const [m, e] = x.toExponential(n - 1).split('e');
  return `${m} × 10${String(Number(e)).split('').map((ch) => SUP[ch]).join('')}`;
};
const every = (d) => {
  if (d >= 365.25) return `${fig(d / 365.25)} years`;
  if (d >= 1) return `${fig(d)} days`;
  if (d * 24 >= 1) return `${fig(d * 24)} hours`;
  if (d * 1440 >= 1) return `${fig(d * 1440)} minutes`;
  return `${fig(d * 86400)} s`;
};
const perDay = (n) => (n >= 0.1 ? `${fig(n)} a day` : `one every ${every(1 / n)}`);

export default defineLab({
  id: 'upsets',
  exam: 'u9',
  title: 'Memory upsets',
  hint: 'Switch the code off and watch a hundred errors a day appear. Switch it back on, then slide the scrub interval and watch the losses follow it.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('daily', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'lgH', lo: -1.5, hi: 3 }),
  controls() {
    return `
      <label class="field"><span>Protection</span><select id="up-ecc"><option value="on">A code that corrects one bit in each 72-bit word</option><option value="off">No code</option></select></label>
      ${slider('up-g', 'Memory (Gbit)', 1, 0.1, 8, 0.1)}
      ${slider('up-r', 'Upsets per bit per day (× 10⁻⁷)', 1.12, 0.1, 10, 0.01)}
      ${slider('up-t', 'Scrub interval, 2 minutes to 40 days (log)', Math.log10(24), -1.5, 3, 0.01)}
      <p class="tiny">Each bit flips at random, independently. The scrubber reads every word, corrects a single flip and writes it back. Cassini's recorders saw about 1.12 × 10⁻⁷ upsets per bit per day.</p>`;
  },
  bind(api) {
    document.getElementById('up-ecc')?.addEventListener('change', (e) => {
      api.slice().ecc = e.target.value === 'on';
      api.bump();
    });
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    const el = document.getElementById('up-ecc');
    if (el) el.value = state.ecc ? 'on' : 'off';
    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    const scrub = 10 ** state.lgH / 24;
    return { scrub, ...upsetsChecked({ bits: state.gbit * 1e9, word: WORD, rate: state.r7 * 1e-7, scrub, ecc: state.ecc }) };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const P = plotIn(B, B.free, { lo: 0.01, hi: 1000, log: true }, { lo: 1e-7, hi: 1e3, log: true });
    axes(P, { xLabel: 'scrub interval (hours)', yLabel: 'errors a day' });
    const pts = c.curve.map(([T, n]) => [T * 24, n]);
    line(P, pts, { color: C.teal, width: 2.5 });
    seg(P, [0.01, c.single], [1000, c.single], { color: C.red, width: 2, dash: [6, 4] });
    label(P, 'no code: every upset is an error', [0.02, c.single], { color: C.red, align: 'left', dy: -10 });
    label(P, 'with the code: two upsets in one word', [pts[60][0], pts[60][1]], { color: C.teal, align: 'right', dx: -8, dy: -12 });
    if (state.ecc) dot(P, c.scrub * 24, c.uncorrectable, { color: C.gold, r: 6, ring: C.gold });
    else dot(P, c.scrub * 24, c.single, { color: C.red, r: 6 });
  },
  law: () => [
    String.raw`P_2 = 1 - e^{-x}(1 + x), \qquad x = k\lambda T`,
    String.raw`\text{errors a day} = \frac{N}{k}\,\frac{P_2}{T} \approx \frac{N k \lambda^2 T}{2}`,
  ],
  liveRows(state, c) {
    return [
      kv('Scrub interval', every(c.scrub)),
      kv('Upsets in the whole memory', perDay(c.single)),
      kv('Mean upsets per word per scrub', state.ecc ? sci(c.x) : 'no code'),
      kv('Errors the code cannot fix, Poisson', state.ecc ? perDay(c.uncorrectable) : perDay(c.single)),
      kv('Errors the code cannot fix, chain', state.ecc ? perDay(c.chainRate) : perDay(c.single)),
      kv('Two methods differ by', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['upsets', perDay(c.single)],
      ['lost data', perDay(c.uncorrectable)],
      ['scrub', every(c.scrub)],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> One particle that flips several neighbouring bits, which a code that spreads each word's bits apart guards against; upsets in the processor and its registers, not only the memory; and latch-up, which draws a destructive current and needs a power cycle, not a code.`;
    if (!state.ecc) {
      return { title: 'Every upset is an error', body: `${fig(state.gbit)} Gbit at ${fig(state.r7)} × 10⁻⁷ upsets per bit per day takes ${fig(c.single)} upsets a day, and with no code each one corrupts data. A code that corrects one bit per word, read back by a scrubber, turns that into one loss every few years. ${leavesOut}` };
    }
    return { title: 'The code fixes one; the scrubber stops a second', body: `Each 72-bit word takes ${sci(c.x, 2)} upsets on average between scrubs. Data is lost only when two land in the same word first: ${perDay(c.uncorrectable)}, against ${fig(c.single)} upsets a day. The losses go as the square of the upset rate and in proportion to the scrub interval. ${leavesOut}` };
  },
  app: false,
});
