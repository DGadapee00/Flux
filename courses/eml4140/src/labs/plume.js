import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { AIR, PLATE, plateChecked, plateClosed } from '@flux/subjects/heat/plume.js';

/**
* Plume: a heated vertical plate, 0.3 m tall, in still air at 20 °C, with a slider for its
 * temperature, the rising layer at mid-height drawn.
 *
 * Shows that h is not fixed for still air: the plate's own buoyancy drives the flow, so a hotter plate
 * drives a faster layer and h grows as ΔT^{1/4}. At 30 °C h is 3.1 W/(m²·K); at 180 °C it is 6.0. The
 * fitted g(Pr) is checked against a shooting solution of the similarity equations
 * (packages/subjects/src/heat/plume.js).
 */
const SCENARIOS = [
  {
    id: 'warm',
    name: 'A plate at 30 °C',
    Ts: 30
  },
  {
    id: 'hot',
    name: 'A plate at 60 °C',
    Ts: 60
  },
  {
    id: 'very',
    name: 'A plate at 140 °C',
    Ts: 140
  },
  {
    id: 'hottest',
    name: 'A plate at 180 °C',
    Ts: 180
  }
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, Ts: sc.Ts });
}

const KEYS = [['pl-t', 'Ts']];

function layer(B, rect, state, c) {
  const ymax = Math.min(40, Math.max(...c.across.filter((p) => p[2] - AIR.Tinf > 0.01 * c.dT || p[1] > 0.01 * c.umax).map((p) => p[0])) * 1.1);
  const P = plotIn(B, rect, { lo: 0, hi: ymax }, { lo: 0, hi: 1.15 });
  axes(P, { xLabel: 'distance from the plate at mid-height (mm)', yLabel: 'share of peak', yFmt: (v) => fig(v) });
  const pts = c.across.filter((p) => p[0] <= ymax);
  line(P, pts.map((p) => [p[0], (p[2] - AIR.Tinf) / c.dT]), { color: C.red, width: 2.5 });
  line(P, pts.map((p) => [p[0], p[1] / c.umax]), { color: C.blue, width: 2.5 });
  label(P, `temperature, ${fig(state.Ts)} °C at the wall`, [ymax, 1.1], { color: C.red, align: 'right', dx: -4 });
  label(P, `upward speed, peak ${fig(100 * c.umax)} cm/s`, [ymax, 0.98], { color: C.blue, align: 'right', dx: -4 });
}

function coeff(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 20, hi: 200 }, { lo: 0, hi: 7 });
  axes(P, { xLabel: 'plate temperature (°C)', yLabel: 'h (W/(m²·K))' });
  const pts = Array.from({ length: 101 }, (_, i) => {
    const T = 22 + (178 * i) / 100;
    return [T, plateClosed({ Ts: T }).h];
  });
  line(P, pts, { color: C.gold, width: 2.5 });
  dot(P, state.Ts, c.h, { color: C.pink, r: 6, ring: C.text });
  label(P, `h = ${fig(c.h)}`, [state.Ts, c.h], { color: C.text, dy: 16 });
}

export default defineLab({
  id: 'plume',
  exam: 'u3',
  title: 'Plume',
  hint: 'Raise the plate’s temperature and watch the layer speed up. Then read h: it grows, slowly, because the flow is the plate’s own doing.',
  gapLimit: 2e-3,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('warm', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'Ts', lo: 25, hi: 200 }),
  controls() {
    return `
      ${slider('pl-t', "Plate temperature (°C)", 60, 25, 200, 1)}
      <p class="tiny">A vertical plate 0.3 m tall in air at 20 °C (ν = 1.6 × 10⁻⁵ m²/s, k = 0.026 W/(m·K), Pr = 0.71), β = 1/T at the film temperature. Left: the upward speed and the temperature across the layer at mid-height. Right: h against the plate’s temperature.</p>`;
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
    return plateChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      coeff(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    layer(B, a, state, c);
    coeff(B, b, state, c);
  },
  law: () => [String.raw`\text{Gr}_L = \frac{g\beta\,\Delta T\,L^3}{\nu^2}, \qquad \text{Ra}_L = \text{Gr}_L\text{Pr}`, String.raw`\overline{\text{Nu}}_L = \tfrac{4}{3}\left(\tfrac{\text{Gr}_L}{4}\right)^{1/4} g(\text{Pr}), \qquad g(0.71) \approx 0.502`],
  liveRows(state, c) {
    return [
      kv('Grashof and Rayleigh numbers', `${c.Gr.toExponential(2)}, ${c.Ra.toExponential(2)}`),
      kv('Average Nu, fit and similarity', `${fig(c.Nu)}, ${fig(c.NuNum)}`),
      kv('h and the flux', `${fig(c.h)} W/(m²·K), ${fig(c.q)} W/m²`),
      kv('Rough form 0.59 Ra^{1/4}', fig(c.Nu059)),
      kv('Peak upward speed at mid-height', `${fig(100 * c.umax)} cm/s`),
      kv('Fit against shooting', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['h', `${fig(c.h)} W/(m²·K)`], ['flux', `${fig(c.q)} W/m²`], ['Ra', c.Ra.toExponential(1)], ['peak speed', `${fig(100 * c.umax)} cm/s`]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Air’s properties change across a layer this hot, radiation from the plate is often as large as the convection, and above Ra ≈ 10⁹ the layer turns turbulent.`;
    if (c.dT < 15) return { title: 'A gentle plate, a slow layer', body: `With the plate ${fig(c.dT)} °C above the air, buoyancy drives a layer that peaks at ${fig(100 * c.umax)} cm/s, and h is ${fig(c.h)} W/(m²·K). Make it hotter: the flow is the plate’s own doing. ${leavesOut}` };
    return { title: 'h grows with the temperature difference', body: `At ${fig(c.dT)} °C above the air the layer rises at up to ${fig(100 * c.umax)} cm/s and h is ${fig(c.h)} W/(m²·K), against 3.1 at 10 °C above. Gr ∝ ΔT, so h ∝ ΔT^{1/4} and the flux grows as ΔT^{5/4}. ${leavesOut}` };
  },
  app: false,
});
