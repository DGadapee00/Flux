import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { PROGRAMS, SPECTRA, level, testChecked } from '@flux/subjects/mechanics/testlevels.js';
import { trans2 } from '@flux/subjects/mechanics/randomvib.js';

/**
 * Test levels: a random vibration test on a bracket, at the levels and durations NASA's GEVS sets
 * for prototype qualification, protoflight and acceptance testing.
 *
 * Shows that a test 3 dB above the flight level is not "a bit more": it doubles the spectrum, raises
 * the response by √2 and, for a bracket whose fatigue curve has exponent 6.4, does nine times the
 * damage a minute. A protoflight test spends that on the unit that will fly; a prototype spends it on
 * a second unit and leaves the flight unit an acceptance test. The overall level of each spectrum is
 * integrated in closed form and checked by Simpson's rule; the bracket's response and fatigue life by
 * Unit 4's model and its own numeric check (packages/subjects/src/mechanics/testlevels.js).
 *
 * Spectra are GEVS Tables 2.4-3 and 2.4-4; test factors and durations GEVS Table 2.2-2. The bracket
 * is Unit 4's. The one minute at flight level in launch is our own round figure.
 */
const FLIGHT_MIN = 1;

const SCENARIOS = [
  { id: 'bracket', name: 'A 100 Hz bracket, protoflight', spectrum: 'generalized', program: 'protoflight', fn: 100, Q: 10 },
  { id: 'accept', name: 'A 350 Hz bracket, acceptance', spectrum: 'generalized', program: 'acceptance', fn: 350, Q: 10 },
  { id: 'stiff', name: 'The 350 Hz bracket, protoflight', spectrum: 'generalized', program: 'protoflight', fn: 350, Q: 10 },
  { id: 'prototype', name: 'The 350 Hz bracket, a prototype qualified instead', spectrum: 'generalized', program: 'prototype', fn: 350, Q: 10 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, spectrum: sc.spectrum, program: sc.program, fn: sc.fn, Q: sc.Q });
}

const SLIDERS = [['lv-f', 'fn'], ['lv-q', 'Q']];
const SELECTS = [['lv-s', 'spectrum'], ['lv-p', 'program']];
const SPECTRUM_NAMES = { generalized: 'GEVS generalized, components', workmanship: 'GEVS minimum workmanship' };
const pct = (x) => (x < 0.001 ? 'under 0.1%' : `${fig(100 * x)}%`);
const life = (min) => (min > 120 ? `${fig(min / 60)} h` : min >= 1 ? `${fig(min)} min` : `${fig(min * 60)} s`);

export default defineLab({
  id: 'levels',
  exam: 'u13',
  title: 'Test levels',
  hint: 'Switch the 350 Hz bracket from acceptance to protoflight and watch the minute of shaking spend nine times the life. Then qualify a prototype instead and see what is left for the unit that flies.',
  gapLimit: 1e-3,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('bracket', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'fn', lo: 50, hi: 1000 }),
  controls() {
    const opt = (o) => Object.entries(o).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
    return `
      <label class="field"><span>Flight limit spectrum</span><select id="lv-s">${opt(SPECTRUM_NAMES)}</select></label>
      <label class="field"><span>Test program</span><select id="lv-p">${opt(Object.fromEntries(Object.entries(PROGRAMS).map(([k, p]) => [k, `${p.name}: +${p.dB} dB, ${p.minutes} min`])))}</select></label>
      ${slider('lv-f', 'Bracket natural frequency (Hz)', 100, 50, 1000, 10)}
      ${slider('lv-q', 'Amplification Q', 10, 5, 40, 1)}
      <p class="tiny">One axis of a GEVS random vibration test. The flight unit also spends ${FLIGHT_MIN} minute at the flight limit level in launch. The bracket is Unit 4's.</p>`;
  },
  bind(api) {
    for (const [id, key] of SELECTS) {
      document.getElementById(id)?.addEventListener('change', (e) => {
        api.slice()[key] = e.target.value;
        api.bump();
      });
    }
    for (const [id, key] of SLIDERS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    for (const [id, key] of [...SELECTS, ...SLIDERS]) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    const c = testChecked({ ...state, flightMin: FLIGHT_MIN });
    return { ...c, flightUnitUse: 1 - c.flightLeft, flies: c.flightLeft > 0 };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const both = H > 380 || (W > 1.5 * H && W > 560);
    const [top, bottom] = both ? split(B.free, 0.62) : [B.free, null];
    const pts = SPECTRA[state.spectrum];
    const P = plotIn(B, top, { lo: 20, hi: 2000, log: true }, { lo: 1e-3, hi: 100, log: true });
    axes(P, { xLabel: 'frequency (Hz)', yLabel: 'acceleration spectrum (g²/Hz)' });
    const fs = Array.from({ length: 301 }, (_, i) => 20 * 100 ** (i / 300));
    line(P, fs.map((f) => [f, level(pts, f)]), { color: alpha(C.muted, 0.9), width: 1.5, dash: [5, 4] });
    line(P, fs.map((f) => [f, level(pts, f, c.scale)]), { color: C.teal, width: 2.5 });
    line(P, fs.map((f) => [f, Math.min(100, Math.max(1e-3, level(pts, f, c.scale) * trans2(f / state.fn, state.Q)))]), { color: C.gold, width: 2 });
    dot(P, state.fn, c.W, { color: C.gold, r: 4 });
    label(P, 'flight limit', [2000, level(pts, 2000)], { color: C.muted, align: 'right', dy: 12 });
    label(P, `test, ${fig(c.grms)} g rms`, [800, level(pts, 800, c.scale)], { color: C.teal, align: 'right', dy: -12 });
    label(P, `bracket, ${fig(c.response)} g rms`, [state.fn, Math.min(60, c.W * state.Q * state.Q)], { color: C.gold, align: state.fn > 400 ? 'right' : 'left', dx: state.fn > 400 ? -8 : 8 });
    if (!bottom) return;
    // Fatigue life spent: the tested unit, and the unit that flies.
    const rows = [
      [state.program === 'prototype' ? 'prototype test' : 'test', c.testUse, c.testUse >= 1 ? C.red : C.teal],
      ['flight unit, all', c.flightUnitUse, c.flies ? C.green : C.red],
    ];
    const hi = Math.max(1.2, Math.min(3, Math.max(...rows.map((r) => r[1])) * 1.1));
    const Q = plotIn(B, bottom, { lo: 0, hi }, { lo: 0, hi: 2 }, { left: 110, right: 16, top: 10, bottom: 40 });
    axes(Q, { xLabel: 'share of the fatigue life', yFmt: () => '' });
    rows.forEach(([name, v, color], i) => {
      const y = 1.5 - i;
      const w = Math.min(v, hi);
      poly(Q, [[0, y - 0.3], [w, y - 0.3], [w, y + 0.3], [0, y + 0.3]], { fill: alpha(color, 0.8), stroke: null });
      label(Q, name, [0, y], { color: C.text, align: 'right', dx: -6 });
      label(Q, v > hi ? `${pct(v)} ›` : pct(v), [w, y], { color: C.text, align: w > hi * 0.75 ? 'right' : 'left', dx: w > hi * 0.75 ? -6 : 6 });
    });
    seg(Q, [1, 0], [1, 2], { color: alpha(C.text, 0.7), width: 1.5, dash: [5, 4] });
  },
  law: () => [
    String.raw`g_\text{rms}^2 = \int W\,df, \qquad +3\ \text{dB} \Rightarrow W \times 2`,
    String.raw`\text{damage a minute} \propto g_\text{rms}^{\,b} = \left(\tfrac{\pi}{2} f_n Q W\right)^{b/2}`,
  ],
  liveRows(state, c) {
    return [
      kv('Test level, closed and Simpson', `${fig(c.grms)}, ${fig(c.grmsNum)} g rms`),
      kv('Spectrum at the bracket', `${fig(c.W)} g²/Hz`),
      kv('Bracket response, Miles and full', `${fig(c.response)}, ${fig(c.responseFull)} g rms`),
      kv('Life at the test level', life(c.lifeMin)),
      kv('Damage a minute, against flight', `${fig(c.perMinute)} times`),
      kv('Test uses', pct(c.testUse)),
      kv('Launch uses', pct(c.flightUse)),
      kv('Flight unit has left', c.flies ? pct(c.flightLeft) : 'none'),
      kv('Two methods differ by', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['test', `${fig(c.grms)} g rms`],
      ['bracket', `${fig(c.response)} g rms`],
      ['flight unit left', c.flies ? pct(c.flightLeft) : 'none'],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Three axes, each with its own response; several modes, not one; a fixture that adds its own resonances; force limiting and notching, which cut the input at the item's resonances; and fatigue scatter, which is wide.`;
    const p = PROGRAMS[state.program];
    if (c.testUse >= 1) {
      return { title: 'It fails in test', body: `${p.minutes} minute${p.minutes > 1 ? 's' : ''} at ${fig(c.grms)} g rms drives the bracket to ${fig(c.response)} g rms, and it lasts ${life(c.lifeMin)} at that level. Stiffen it away from the plateau, damp it, or notch the input at its resonance with the analysis to back it. ${leavesOut}` };
    }
    if (!c.flies) {
      return { title: 'The flight unit has no life left', body: `The test passes, but with launch the unit that flies would use ${pct(c.flightUnitUse)} of its fatigue life. ${state.program === 'protoflight' ? 'A protoflight test spends its life on the unit that flies; qualifying a prototype instead leaves it only an acceptance test.' : 'The design needs more margin.'} ${leavesOut}` };
    }
    if (state.program === 'prototype') {
      return { title: 'A second unit takes the test', body: `The prototype spends ${pct(c.testUse)} of its life in ${p.minutes} minutes at +3 dB. The flight unit gets an acceptance test and launch, and keeps ${pct(c.flightLeft)}. The price is a second unit, built and tested. ${leavesOut}` };
    }
    return { title: `It passes, with ${pct(c.flightLeft)} left`, body: `${p.name} at ${fig(c.grms)} g rms drives the bracket to ${fig(c.response)} g rms. ${p.dB ? `3 dB up does ${fig(c.perMinute)} times the damage of a minute at flight level. ` : ''}After test and launch the flight unit keeps ${pct(c.flightLeft)} of its fatigue life. ${leavesOut}` };
  },
  app: false,
});
