import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { SODA, log10eta, paneChecked, paneClosed } from '@flux/subjects/matsci/glass.js';

/**
* Glass: soda-lime glass's viscosity against temperature, and how long a 1 m pane standing on its
 * edge takes to sink 0.1 mm under its own weight.
 *
 * Shows that old window glass is not a liquid still flowing: at room temperature the pane would take
 * about 10⁵⁰ years to sink 0.1 mm. At 500 °C, near the glass transition, it takes weeks; at 600 °C,
 * minutes. The closed form for the sinking pane is checked by summing the creep of 400 slices
 * (packages/subjects/src/matsci/glass.js).
 */
const SCENARIOS = [
  { id: 'room', name: 'Room temperature, 20 °C', TC: 20 },
  { id: 'warm', name: '400 °C', TC: 400 },
  { id: 'anneal', name: 'Near the glass transition, 500 °C', TC: 500 },
  { id: 'soft', name: '600 °C', TC: 600 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, TC: sc.TC });
}

const KEYS = [['pn-t', 'TC']];

const yrs = (ly) => (ly > 4 ? `10^${fig(ly)} years` : ly > 0 ? `${fig(10 ** ly)} years` : ly > -2.6 ? `${fig(365.25 * 10 ** ly)} days` : `${fig(525960 * 10 ** ly)} minutes`);

function visc(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 0, hi: 1000 }, { lo: 0, hi: 70 });
  axes(P, { xLabel: 'temperature (°C)', yLabel: 'log₁₀ viscosity (Pa·s)' });
  const pts = Array.from({ length: 201 }, (_, i) => [20 + (980 * i) / 200, log10eta(20 + (980 * i) / 200)]);
  line(P, pts, { color: C.gold, width: 2.5 });
  seg(P, [0, 12], [1000, 12], { color: alpha(C.blue, 0.8), width: 1.5, dash: [5, 4] });
  label(P, 'glass transition, 10¹² Pa·s', [1000, 12], { color: C.blue, align: 'right', dy: -10 });
  seg(P, [0, 6.6], [1000, 6.6], { color: alpha(C.muted, 0.7), width: 1, dash: [3, 3] });
  label(P, 'softens', [1000, 6.6], { color: C.muted, align: 'right', dy: 12 });
  dot(P, state.TC, c.le, { color: C.pink, r: 6, ring: C.text });
}

function sink(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 0, hi: 1000 }, { lo: -16, hi: 56 });
  axes(P, { xLabel: 'temperature (°C)', yLabel: 'log₁₀ years to sink 0.1 mm' });
  const pts = Array.from({ length: 201 }, (_, i) => [20 + (980 * i) / 200, paneClosed({ TC: 20 + (980 * i) / 200 }).ly]);
  line(P, pts, { color: C.gold, width: 2.5 });
  seg(P, [0, Math.log10(1.38e10)], [1000, Math.log10(1.38e10)], { color: alpha(C.red, 0.8), width: 1.5, dash: [5, 4] });
  label(P, 'age of the universe', [1000, Math.log10(1.38e10)], { color: C.red, align: 'right', dy: -10 });
  seg(P, [0, Math.log10(300)], [1000, Math.log10(300)], { color: alpha(C.muted, 0.7), width: 1, dash: [3, 3] });
  label(P, '300 years', [0, Math.log10(300)], { color: C.muted, align: 'left', dx: 6, dy: 12 });
  dot(P, state.TC, c.ly, { color: C.pink, r: 6, ring: C.text });
}

export default defineLab({
  id: 'pane',
  exam: 'u5',
  title: 'Glass',
  hint: 'Read the time at room temperature, then warm the pane to 500 °C and 600 °C.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('room', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'TC', lo: 20, hi: 1000 }),
  controls() {
    return `
      ${slider('pn-t', "Temperature (°C)", 20, 20, 1000, 1)}
      <p class="tiny">Viscosity from an Arrhenius line through soda-lime glass’s annealing point (10¹² Pa·s at 546 °C) and softening point (10^6.6 Pa·s at 726 °C). Below about 550 °C it is an extrapolation. The pane is 1 m tall, ρ = 2500 kg/m³. Left: viscosity. Right: years for the pane to sink 0.1 mm.</p>`;
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
    return paneChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      sink(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    visc(B, a, state, c);
    sink(B, b, state, c);
  },
  law: () => [String.raw`\eta = \eta_0\exp\!\left(\frac{Q}{RT}\right), \qquad Q \approx 470\ \text{kJ/mol}`, String.raw`t = \frac{6\eta\,\Delta}{\rho g H^2}`],
  liveRows(state, c) {
    return [
      kv('Viscosity', `10^${fig(c.le)} Pa·s`),
      kv('Time to sink 0.1 mm', yrs(c.ly)),
      kv('Fitted Q', `${fig(c.Q / 1000)} kJ/mol`),
      kv('Closed form against the slices', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['viscosity', `10^${fig(c.le)} Pa·s`], ['to sink 0.1 mm', yrs(c.ly)], ['at', `${fig(state.TC)} °C`], ['state', c.le > 12 ? 'glass' : 'flowing']]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Below the glass transition the viscosity does not follow one Arrhenius line, and published estimates for room temperature differ by many orders of magnitude; every one of them gives no visible flow in the age of the universe.`;
    if (c.le > 12) return { title: 'A solid on any human timescale', body: `At ${fig(state.TC)} °C the viscosity is about 10^${fig(c.le)} Pa·s, and the pane would take ${yrs(c.ly)} to sink 0.1 mm. Old panes are thicker at the bottom because crown glass came out uneven and glaziers set the thick edge down. ${leavesOut}` };
    return { title: 'Above the glass transition: it flows', body: `At ${fig(state.TC)} °C the viscosity is 10^${fig(c.le)} Pa·s, below the 10¹² that marks the glass transition, and the pane sinks 0.1 mm in ${yrs(c.ly)}. This is the range where glass is annealed, bent and blown. ${leavesOut}` };
  },
  app: false,
});
