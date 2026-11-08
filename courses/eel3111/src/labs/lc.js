import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { TANK, lcChecked } from '@flux/subjects/em/lc.js';

/**
* LC energy: a 1 µF capacitor charged to 10 V and switched across a coil, with sliders for the
 * inductance and the coil's resistance, the energy in each drawn as it trades back and forth.
 *
 * Shows where the energy goes: all 50 µJ start in the capacitor's electric field, move into the
 * coil's magnetic field as the current peaks, and come back, twice each period. With 10 mH the tank
 * rings at 1.59 kHz and the current peaks at 100 mA; resistance takes a little each cycle. The
 * closed-form response is checked by Runge–Kutta, and the energy books by adding what the resistor
 * took (packages/subjects/src/em/lc.js).
 */
const SCENARIOS = [
  { id: 'ideal', name: '10 mH, no resistance', Lmh: 10, R: 0 },
  { id: 'lossy', name: '10 mH with 20 Ω', Lmh: 10, R: 20 },
  { id: 'big', name: '100 mH: slower, smaller current', Lmh: 100, R: 5 },
  { id: 'small', name: '5 mH with 30 Ω', Lmh: 5, R: 30 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, Lmh: sc.Lmh, R: sc.R });
}

const KEYS = [['lc-l', 'Lmh'], ['lc-r', 'R']];

function energy(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 0, hi: c.tEnd * 1000 }, { lo: 0, hi: c.E0 * 1e6 * 1.15 });
  axes(P, { xLabel: 'time (ms)', yLabel: 'energy (µJ)' });
  line(P, c.pts.map((p) => [p[0] * 1000, p[3] * 1e6]), { color: C.blue, width: 2.2 });
  line(P, c.pts.map((p) => [p[0] * 1000, p[4] * 1e6]), { color: C.gold, width: 2.2 });
  line(P, c.pts.map((p) => [p[0] * 1000, p[5] * 1e6]), { color: C.red, width: 2.2 });
  line(P, c.pts.map((p) => [p[0] * 1000, (p[3] + p[4] + p[5]) * 1e6]), { color: alpha(C.text, 0.6), width: 1.2, dash: [5, 4] });
  label(P, 'capacitor', [0, c.E0 * 1e6], { color: C.blue, align: 'left', dx: 4, dy: 12 });
  label(P, 'total', [c.tEnd * 1000, c.E0 * 1e6], { color: C.muted, align: 'right', dy: -8 });
}

function wave(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 0, hi: c.tEnd * 1000 }, { lo: -1.15, hi: 1.15 });
  axes(P, { xLabel: 'time (ms)', yLabel: 'share of the peak', yFmt: (v) => fig(v) });
  seg(P, [0, 0], [c.tEnd * 1000, 0], { color: alpha(C.text, 0.35), width: 1 });
  line(P, c.pts.map((p) => [p[0] * 1000, p[1] / (TANK.C * TANK.V0)]), { color: C.blue, width: 2.2 });
  line(P, c.pts.map((p) => [p[0] * 1000, p[2] / c.Ipk0]), { color: C.gold, width: 2.2 });
  label(P, 'capacitor voltage', [c.tEnd * 1000, 1.12], { color: C.blue, align: 'right' });
  label(P, `current, peak ${fig(1000 * c.Ipk0)} mA`, [c.tEnd * 1000, -1.08], { color: C.gold, align: 'right' });
}

export default defineLab({
  id: 'lc',
  exam: 'u4',
  title: 'LC energy',
  hint: 'Watch the energy pass from capacitor to coil and back. Then add resistance and watch the red curve take its share.',
  gapLimit: 1e-4,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('ideal', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'Lmh', lo: 5, hi: 100 }),
  controls() {
    return `
      ${slider('lc-l', "Inductance L (mH)", 10, 5, 100, 1)}
      ${slider('lc-r', "Coil resistance R (Ω)", 0, 0, 50, 0.5)}
      <p class="tiny">C = 1 µF charged to 10 V, so 50 µJ to start. Left: energy in the capacitor (blue), the coil (gold) and taken by the resistor (red) over four periods. Right: the capacitor’s voltage and the current.</p>`;
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
    return lcChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      energy(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    energy(B, a, state, c);
    wave(B, b, state, c);
  },
  law: () => [String.raw`L\ddot q + R\dot q + \frac{q}{C} = 0, \qquad \omega_0 = \frac{1}{\sqrt{LC}}`, String.raw`\tfrac12 Cv^2 + \tfrac12 Li^2 + \int i^2R\,dt = \tfrac12 CV_0^2`, String.raw`I_\text{pk} = V_0\sqrt{C/L}\ (R = 0)`],
  liveRows(state, c) {
    return [
      kv('Ringing frequency', `${fig(c.f)} Hz`),
      kv('Peak current with no resistance', `${fig(1000 * c.Ipk0)} mA`),
      kv('Energy to start', `${fig(c.E0 * 1e6)} µJ`),
      kv('Damping ratio', fig(c.zeta)),
      kv('Response against Runge–Kutta, energy books', `${c.gap.toExponential(0)}, ${c.energyGap.toExponential(0)}`),
    ].join('');
  },
  readout(state, c) {
    return cells([['frequency', `${fig(c.f)} Hz`], ['peak current', `${fig(1000 * c.Ipk0)} mA`], ['energy', `${fig(c.E0 * 1e6)} µJ`], ['ζ', fig(c.zeta)]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> A real coil also has capacitance between its turns and loses energy in its core; at high frequency the wire’s resistance grows with the skin effect.`;
    if (state.R < 0.5) return { title: 'Energy swaps between two fields', body: `At t = 0 all ${fig(c.E0 * 1e6)} µJ sit in the capacitor’s electric field. As it discharges, the current builds the coil’s magnetic field; when the capacitor is empty the current peaks at ${fig(1000 * c.Ipk0)} mA and all the energy is in the coil. Then it drives the charge back. With no resistance the total never changes. ${leavesOut}` };
    return { title: 'Each swing, the resistor takes a share', body: `With ${fig(state.R)} Ω the swing decays as e^{−αt}, α = R/2L = ${fig(c.alpha)} per second: the red curve climbs toward the full ${fig(c.E0 * 1e6)} µJ as the stored energy dies away. The three still add up to the starting energy. ${leavesOut}` };
  },
  app: false,
});
