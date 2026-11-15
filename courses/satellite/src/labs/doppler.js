import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, axes, begin, dot, label, line, plotIn, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { dopplerChecked } from '@flux/subjects/mechanics/doppler.js';

/**
 * Doppler: what a ground station hears as the craft crosses its sky.
 *
 * Shows that the carrier arrives shifted, highest as the craft rises, through zero overhead and
 * lowest as it sets, and that the shift grows in proportion to the carrier frequency: kilohertz at
 * UHF, tens of kilohertz at S-band. The station must track it. The shift changes fastest overhead,
 * and that rate, with the light time, is what tracking measures to find the orbit. The geometric
 * range rate is checked against Runge–Kutta propagation with the velocity projected on the line of
 * sight (packages/subjects/src/mechanics/doppler.js).
 *
 * Carriers lie in the bands NASA's small spacecraft report lists for small craft radios (Table 9-3):
 * 437 MHz in UHF, 2200 MHz in S-band, 8400 MHz in X-band.
 */
export const BANDS = Object.freeze({ uhf: { name: 'UHF, 437 MHz', f: 437 }, s: { name: 'S-band, 2200 MHz', f: 2200 }, x: { name: 'X-band, 8400 MHz', f: 8400 } });

const SCENARIOS = [
  { id: 'uhf', name: 'UHF at 500 km, above 10°', band: 'uhf', hkm: 500, eps: 10, twoWay: false },
  { id: 'sband', name: 'S-band at 500 km', band: 's', hkm: 500, eps: 10, twoWay: false },
  { id: 'coherent', name: 'S-band, two-way coherent', band: 's', hkm: 500, eps: 10, twoWay: true },
  { id: 'high', name: 'UHF at 800 km', band: 'uhf', hkm: 800, eps: 10, twoWay: false },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, band: sc.band, hkm: sc.hkm, eps: sc.eps, twoWay: sc.twoWay });
}

const KEYS = [['dp-h', 'hkm'], ['dp-e', 'eps']];
const khz = (hz) => `${fig(hz / 1000)} kHz`;

export default defineLab({
  id: 'doppler',
  exam: 'u2',
  title: 'Doppler',
  hint: 'Swap UHF for S-band and watch the shift grow fivefold. Then switch to a two-way coherent link and watch it double again.',
  gapLimit: 1e-5,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('uhf', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'hkm', lo: 300, hi: 1000 }),
  controls() {
    return `
      <label class="field"><span>Carrier</span><select id="dp-b">${Object.entries(BANDS).map(([k, b]) => `<option value="${k}">${b.name}</option>`).join('')}</select></label>
      <label class="field"><span>Link</span><select id="dp-w"><option value="one">One-way: the craft's own oscillator</option><option value="two">Two-way coherent: the craft turns the uplink around</option></select></label>
      ${slider('dp-h', 'Altitude (km)', 500, 300, 1000, 10)}
      ${slider('dp-e', 'Lowest elevation the station uses (°)', 10, 0, 40, 1)}
      <p class="tiny">A circular orbit passing straight overhead; Earth's turning is left out. Time is measured from overhead.</p>`;
  },
  bind(api) {
    document.getElementById('dp-b')?.addEventListener('change', (e) => {
      api.slice().band = e.target.value;
      api.bump();
    });
    document.getElementById('dp-w')?.addEventListener('change', (e) => {
      api.slice().twoWay = e.target.value === 'two';
      api.bump();
    });
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    const b = document.getElementById('dp-b');
    if (b) b.value = state.band;
    const w = document.getElementById('dp-w');
    if (w) w.value = state.twoWay ? 'two' : 'one';
    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    const c = dopplerChecked({ hkm: state.hkm, eps: state.eps, fMHz: BANDS[state.band].f });
    const k = state.twoWay ? 2 : 1;
    return { ...c, k, shift: k * c.shiftEdge, slopeSeen: k * c.slope, curveSeen: c.curve.map(([t, s, r]) => [t, k * s, r]) };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const both = H > 380 || (W > 1.5 * H && W > 560);
    const [top, bottom] = both ? split(B.free, 0.6) : [B.free, null];
    const half = c.duration / 2;
    const span = Math.max(1, c.shift / 1000) * 1.2;
    const P = plotIn(B, top, { lo: -half * 1.05, hi: half * 1.05 }, { lo: -span, hi: span });
    axes(P, { xLabel: 'seconds from overhead', yLabel: 'shift (kHz)' });
    seg(P, [-half * 1.05, 0], [half * 1.05, 0], { color: C.muted, width: 1, dash: [3, 3] });
    line(P, c.curveSeen.map(([t, s]) => [t, s]), { color: C.teal, width: 2.5 });
    dot(P, -half, c.shift / 1000, { color: C.gold, r: 5 });
    dot(P, half, -c.shift / 1000, { color: C.gold, r: 5 });
    label(P, `rising: +${khz(c.shift)}`, [-half, c.shift / 1000], { color: C.gold, align: 'left', dx: 10, dy: -14 });
    label(P, `setting: −${khz(c.shift)}`, [half, -c.shift / 1000], { color: C.gold, align: 'right', dx: -10, dy: 14 });
    if (!bottom) return;
    const Q = plotIn(B, bottom, { lo: -half * 1.05, hi: half * 1.05 }, { lo: 0, hi: c.rhoEdge * 1.1 });
    axes(Q, { xLabel: 'seconds from overhead', yLabel: 'range (km)' });
    line(Q, c.curveSeen.map(([t, , r]) => [t, r]), { color: C.blue, width: 2.5 });
    label(Q, `${fig(state.hkm)} km overhead, ${fig(c.rhoEdge)} km at ${fig(state.eps)}°`, [0, c.rhoEdge * 1.04], { color: C.blue });
  },
  law: () => [
    String.raw`\rho = \sqrt{R^2 + a^2 - 2Ra\cos\theta}, \qquad \dot\rho = \frac{R a n \sin\theta}{\rho}`,
    String.raw`\Delta f = -\frac{f\,\dot\rho}{c}\ \ (\times 2\ \text{two-way})`,
  ],
  liveRows(state, c) {
    return [
      kv('Pass length', `${fig(c.duration / 60)} min`),
      kv('Range overhead, at the edge', `${fig(state.hkm)} km, ${fig(c.rhoEdge)} km`),
      kv('Range rate at the edge, closed form', `${c.rateEdge.toFixed(4)} km/s`),
      kv('Range rate at the edge, propagated', `${c.numRate.toFixed(4)} km/s`),
      kv('Largest shift', khz(c.shift)),
      kv('Shift changes overhead at', `${fig(c.slopeSeen)} Hz/s`),
      kv('Two-way light time, overhead to edge', `${fig(c.lightMin * 1000)} to ${fig(c.lightEdge * 1000)} ms`),
      kv('Two methods differ by', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['largest shift', `±${khz(c.shift)}`],
      ['overhead slope', `${fig(c.slopeSeen)} Hz/s`],
      ['pass', `${fig(c.duration / 60)} min`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Passes that miss overhead, which shift less and turn more gently; Earth's turning, which adds up to half a kilometre a second at the equator; and the drift of the craft's own oscillator with temperature.`;
    const band = BANDS[state.band].name;
    const way = state.twoWay ? 'The link is two-way coherent, so the shift is counted on the way up and on the way down: twice the one-way figure. ' : '';
    return { title: `±${khz(c.shift)} at ${band}`, body: `${way}As the craft rises above ${fig(state.eps)}° it closes at ${fig(c.rateEdge)} km/s and the carrier arrives ${khz(c.shift)} high. Overhead the shift passes through zero, changing ${fig(c.slopeSeen)} Hz each second; as it sets it arrives as far low. The receiver must follow the whole swing, and the shift scales with the carrier: five times as much at S-band as at UHF. ${leavesOut}` };
  },
  app: false,
});
