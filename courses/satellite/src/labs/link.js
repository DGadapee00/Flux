import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, label, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { BANDS, REQUIRED_DB, linkBudget } from '@flux/subjects/em/link.js';

/**
 * Link budget: a satellite downlink written as a sum of decibels, from transmitter power to the
 * margin over what the receiver needs.
 *
 * Shows that power falls as the square of distance: twice the range is a quarter of the power, 6 dB,
 * and a geostationary link loses about 31 dB more than one from low orbit. Each gain or loss adds in
 * decibels. The budget is computed twice, multiplying watts and ratios and adding decibels
 * (packages/subjects/src/em/link.js).
 */
const SCENARIOS = [
  { id: 'leo', name: 'Low orbit, 1000 km: S band, 2 W, 3 m dish', band: 's', Pt: 2, GtdBi: 6, Dr: 3, dkm: 1000, Rb: 1e6, T: 300 },
  { id: 'far', name: 'Twice as far, 2000 km', band: 's', Pt: 2, GtdBi: 6, Dr: 3, dkm: 2000, Rb: 1e6, T: 300 },
  { id: 'geo', name: 'Geostationary range, 36,000 km', band: 's', Pt: 2, GtdBi: 6, Dr: 3, dkm: 36000, Rb: 1e6, T: 300 },
  { id: 'geo-fix', name: 'GEO with a 10 m dish at 100 kbit/s', band: 's', Pt: 2, GtdBi: 6, Dr: 10, dkm: 36000, Rb: 1e5, T: 300 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, band: sc.band, lPt: Math.log10(sc.Pt), GtdBi: sc.GtdBi, Dr: sc.Dr, ld: Math.log10(sc.dkm), lRb: Math.log10(sc.Rb), T: sc.T });
}

const params = (s) => ({ band: s.band, Pt: 10 ** s.lPt, GtdBi: s.GtdBi, Dr: s.Dr, d: 1000 * 10 ** s.ld, T: s.T, Rb: 10 ** s.lRb });
const KEYS = [['lk-p', 'lPt'], ['lk-g', 'GtdBi'], ['lk-dr', 'Dr'], ['lk-d', 'ld'], ['lk-rb', 'lRb'], ['lk-t', 'T']];

export default defineLab({
  id: 'link',
  exam: 'u2',
  title: 'Link budget',
  hint: 'Double the range and read the received power: down 6 dB, a quarter, not a half. Then take the satellite out to geostationary range and win the margin back.',
  gapLimit: 1e-12,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('leo', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'ld', lo: 2.5, hi: 4.6 }),
  controls() {
    return `
      <label class="field"><span>Band</span><select id="lk-band">${Object.entries(BANDS).map(([id, b]) => `<option value="${id}">${b.name}</option>`).join('')}</select></label>
      ${slider('lk-p', 'Transmitter power, log₁₀ P_t (W)', 0.3, -1, 2, 0.01)}
      ${slider('lk-g', 'Satellite antenna gain G_t (dBi)', 6, 0, 30, 0.5)}
      ${slider('lk-dr', 'Ground dish diameter (m)', 3, 0.5, 10, 0.1)}
      ${slider('lk-d', 'Range, log₁₀ d (km)', 3, 2.5, 4.6, 0.01)}
      ${slider('lk-rb', 'Bit rate, log₁₀ R_b (bit/s)', 6, 3, 7, 0.01)}
      ${slider('lk-t', 'Receiver system temperature (K)', 300, 100, 1000, 10)}
      <p class="tiny">Range from about 300 km to 40,000 km. Dish efficiency 55%. The link closes when E_b/N_0 reaches ${REQUIRED_DB} dB, one error in a million for binary phase-shift keying.</p>`;
  },
  bind(api) {
    document.getElementById('lk-band')?.addEventListener('change', (e) => {
      api.slice().band = e.target.value;
      api.bump();
    });
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    const b = document.getElementById('lk-band');
    if (b) b.value = state.band;
    for (const [id, key] of KEYS) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(state[key]);
    }
  },
  compute(state) {
    const p = params(state);
    const r = linkBudget(p);
    return { ...r, p, PrdBm: r.PrdBW + 30, dkm: p.d / 1000 };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const xm = B.free.x0 + W * 0.66;
    // The budget as a waterfall: each term moves the running total in dB.
    const t = c.terms;
    const steps = [['P_t', 0, t.PtdBW, C.gold], ['G_t', t.PtdBW, t.PtdBW + t.Gt, C.green], ['path', t.PtdBW + t.Gt, t.PtdBW + t.Gt - t.loss, C.red], ['G_r', t.PtdBW + t.Gt - t.loss, c.PrdBW, C.green]];
    const all = steps.flatMap(([, a, b]) => [a, b]);
    const lo = Math.floor((Math.min(...all) - 10) / 20) * 20;
    const hi = Math.ceil((Math.max(...all) + 10) / 20) * 20;
    const P = plotIn(B, { ...B.free, x1: xm }, { lo: 0, hi: 5 }, { lo, hi });
    axes(P, { yLabel: 'dBW', xFmt: () => '' });
    steps.forEach(([n, a, b, col], i) => {
      poly(P, [[i + 0.15, a], [i + 0.85, a], [i + 0.85, b], [i + 0.15, b]], { fill: alpha(col, 0.5), stroke: col, width: 1.5 });
      if (i < 3) seg(P, [i + 0.85, b], [i + 1.15, b], { color: alpha(C.text, 0.4), width: 1, dash: [2, 2] });
      label(P, n, [i + 0.5, lo], { color: col, dy: 14 });
      label(P, `${b - a >= 0 ? '+' : '−'}${fig(Math.abs(b - a))}`, [i + 0.5, Math.max(a, b)], { color: C.text, dy: -10 });
    });
    poly(P, [[4.15, lo], [4.85, lo], [4.85, c.PrdBW], [4.15, c.PrdBW]], { fill: alpha(C.blue, 0.5), stroke: C.blue, width: 1.5 });
    label(P, 'P_r', [4.5, lo], { color: C.blue, dy: 14 });
    label(P, fig(c.PrdBW), [4.5, c.PrdBW], { color: C.text, dy: -10 });
    // E_b/N_0 against what the receiver needs.
    const top = Math.max(REQUIRED_DB + 10, c.ebn0dB + 8);
    const bot = Math.min(0, c.ebn0dB - 5);
    const Q = plotIn(B, { ...B.free, x0: xm }, { lo: 0, hi: 1 }, { lo: bot, hi: top }, { left: 40, right: 10, top: 26, bottom: 40 });
    axes(Q, { yLabel: 'E_b/N_0 (dB)', xFmt: () => '' });
    poly(Q, [[0.2, Math.max(bot, 0)], [0.8, Math.max(bot, 0)], [0.8, c.ebn0dB], [0.2, c.ebn0dB]], { fill: alpha(c.closes ? C.green : C.red, 0.5), stroke: c.closes ? C.green : C.red, width: 1.5 });
    seg(Q, [0, REQUIRED_DB], [1, REQUIRED_DB], { color: C.yellow, width: 1.5, dash: [5, 4] });
    label(Q, 'needed', [1, REQUIRED_DB], { color: C.yellow, align: 'right', dy: -9 });
    label(Q, `${c.margin >= 0 ? '+' : '−'}${fig(Math.abs(c.margin))} dB`, [0.5, top], { color: c.closes ? C.green : C.red, dy: 12 });
  },
  law: () => [String.raw`P_r = P_tG_tG_r\left(\frac{\lambda}{4\pi d}\right)^2, \qquad G = \eta\left(\frac{\pi D}{\lambda}\right)^2`, String.raw`\frac{E_b}{N_0} = \frac{P_r}{k_BT_\text{sys}R_b}`],
  liveRows(state, c) {
    return [
      kv('Wavelength', `${fig(c.lambda * 100)} cm`),
      kv('Range', `${fig(c.dkm)} km`),
      kv('Path loss (4πd/λ)²', `${fig(c.terms.loss)} dB`),
      kv('Ground dish gain', `${fig(c.terms.Gr)} dBi`),
      kv('Received power', `${c.Pr.toExponential(2)} W = ${fig(c.PrdBm)} dBm`),
      kv('Noise density k_B T', `${fig(c.N0dBW)} dBW/Hz`),
      kv('E_b/N_0, and the margin', `${fig(c.ebn0dB)} dB, ${c.margin >= 0 ? '+' : '−'}${fig(Math.abs(c.margin))} dB`),
      kv('Watts against decibels', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['P_r', `${fig(c.PrdBm)} dBm`],
      ['path loss', `${fig(c.terms.loss)} dB`],
      ['E_b/N_0', `${fig(c.ebn0dB)} dB`],
      ['margin', `${c.margin >= 0 ? '+' : '−'}${fig(Math.abs(c.margin))} dB`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Free space only: no rain or atmospheric loss, no pointing error, no cable loss, no coding gain. Real budgets list each and keep a few dB of margin besides.`;
    return {
      title: c.closes ? `The link closes with ${fig(c.margin)} dB to spare` : `The link falls ${fig(-c.margin)} dB short`,
      body: `Over ${fig(c.dkm)} km the signal spreads over a sphere, so the path costs ${fig(c.terms.loss)} dB, and every doubling of range adds 6 dB more. The dish wins back ${fig(c.terms.Gr)} dB and the satellite’s antenna ${fig(state.GtdBi)} dB, leaving ${fig(c.PrdBm)} dBm. ${c.closes ? 'That is enough for the bit rate.' : 'Win it back with a bigger dish (+6 dB per doubling of diameter), more power, a higher-gain antenna or a lower bit rate.'} ${leavesOut}`,
    };
  },
  app: false,
});
