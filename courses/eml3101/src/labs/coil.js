import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { coilChecked, coilClosed, omega, pg } from '@flux/subjects/thermo/psychro.js';

/**
* Cooling coil: moist air through an air conditioner's coil, with sliders for the inlet temperature
 * and humidity and the leaving temperature, the process drawn on a psychrometric chart generated from
 * its equations.
 *
 * Shows that an air conditioner does not only cool: once the air passes its dew point, water
 * condenses and drips off. Air at 30 °C and 60% cooled to 12 °C gives up 7.3 g of water per kilogram,
 * and about half the heat removed is latent. The enthalpy balance is checked by following the air's
 * path and summing sensible and latent heat (packages/subjects/src/thermo/psychro.js).
 */
const SCENARIOS = [
  { id: 'summer', name: '30 °C, 60%, cooled to 12 °C', T1: 30, rh: 60, T2: 12 },
  { id: 'mild', name: 'The same, cooled only to 25 °C', T1: 30, rh: 60, T2: 25 },
  { id: 'humid', name: '32 °C, 80%, cooled to 14 °C', T1: 32, rh: 80, T2: 14 },
  { id: 'dry', name: '35 °C, 20%, cooled to 15 °C', T1: 35, rh: 20, T2: 15 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, T1: sc.T1, rh: sc.rh, T2: sc.T2 });
}

const KEYS = [['cl-t', 'T1'], ['cl-r', 'rh'], ['cl-o', 'T2']];

function chart(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 0, hi: 42 }, { lo: 0, hi: 32 });
  axes(P, { xLabel: 'dry-bulb temperature (°C)', yLabel: 'humidity ratio ω (g/kg)' });
  for (const r of [20, 40, 60, 80, 100]) {
    const pts = Array.from({ length: 85 }, (_, i) => [i / 2, 1000 * omega((r / 100) * pg(i / 2))]).filter((p) => p[1] <= 32);
    line(P, pts, { color: r === 100 ? C.blue : alpha(C.muted, 0.6), width: r === 100 ? 2 : 1 });
    const end = pts[pts.length - 1];
    if (r < 100) label(P, `${r}%`, end, { color: C.muted, align: 'right', dx: -2, dy: -6 });
  }
  const path = c.wet ? [[state.T1, 1000 * c.w1], [c.Td, 1000 * c.w1], ...Array.from({ length: 21 }, (_, i) => {
    const T = c.Td - ((c.Td - state.T2) * i) / 20;
    return [T, 1000 * omega(pg(T))];
  })] : [[state.T1, 1000 * c.w1], [state.T2, 1000 * c.w2]];
  line(P, path, { color: C.gold, width: 3 });
  dot(P, state.T1, 1000 * c.w1, { color: C.red, r: 6 });
  dot(P, state.T2, 1000 * c.w2, { color: C.blue, r: 6, ring: C.text });
  label(P, 'in', [state.T1, 1000 * c.w1], { color: C.red, align: 'left', dx: 8 });
  if (c.wet) label(P, `dew point ${fig(c.Td)} °C`, [c.Td, 1000 * c.w1], { color: C.text, dy: -12 });
}

function drip(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 5, hi: 30 }, { lo: 0, hi: 20 });
  axes(P, { xLabel: 'air out (°C)', yLabel: 'water removed (g/kg dry air)' });
  const pts = Array.from({ length: 101 }, (_, i) => {
    const T2 = 5 + i / 4;
    return [T2, 1000 * coilClosed({ T1: state.T1, rh: state.rh, T2 }).water];
  });
  line(P, pts, { color: C.blue, width: 2.5 });
  dot(P, state.T2, 1000 * c.water, { color: C.pink, r: 6, ring: C.text });
}

export default defineLab({
  id: 'coil',
  exam: 'u1',
  title: 'Cooling coil',
  hint: 'Lower the leaving temperature past the dew point and watch the path turn down the saturation curve.',
  gapLimit: 1e-8,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('summer', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'T2', lo: 5, hi: 30 }),
  controls() {
    return `
      ${slider('cl-t', "Air in, temperature (°C)", 30, 20, 40, 0.5)}
      ${slider('cl-r', "Air in, relative humidity (%)", 60, 10, 100, 1)}
      ${slider('cl-o', "Air out, temperature (°C)", 12, 5, 30, 0.5)}
      <p class="tiny">At 101.325 kPa, with saturation pressures from IAPWS-IF97. Left: the psychrometric chart, humidity ratio against temperature, with lines of 20% to 100% relative humidity and the air’s path through the coil. Right: water removed per kilogram of dry air against the leaving temperature.</p>`;
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
    return coilChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      chart(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    chart(B, a, state, c);
    drip(B, b, state, c);
  },
  law: () => [String.raw`\omega = 0.622\,\frac{p_v}{p - p_v}, \qquad \phi = \frac{p_v}{p_g(T)}`, String.raw`h = 1.005\,T + \omega\,(2501 + 1.82\,T)`, String.raw`q = h_1 - h_2 - (\omega_1 - \omega_2)\,h_f(T_2)`],
  liveRows(state, c) {
    return [
      kv('ω in and out', `${fig(1000 * c.w1)}, ${fig(1000 * c.w2)} g/kg`),
      kv('Dew point of the air in', `${fig(c.Td)} °C`),
      kv('Water removed', `${fig(1000 * c.water)} g/kg`),
      kv('Heat removed', `${fig(c.q)} kJ/kg`),
      kv('Humidity out', `${fig(c.rh2)}%`),
      kv('Enthalpy balance against the path sum', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['heat removed', `${fig(c.q)} kJ/kg`], ['water', `${fig(1000 * c.water)} g/kg`], ['dew point', `${fig(c.Td)} °C`], ['out', `${fig(c.rh2)}%`]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> A real coil does not bring all the air to its surface temperature: some bypasses, so the air leaves warmer and less dry than this, at a point on the line toward the coil’s temperature.`;
    if (!c.wet) return { title: 'Above the dew point: cooling only', body: `The air leaves at ${fig(state.T2)} °C, still above its dew point of ${fig(c.Td)} °C, so no water condenses: ω stays at ${fig(1000 * c.w1)} g/kg and the relative humidity rises to ${fig(c.rh2)}%. ${leavesOut}` };
    return { title: 'Cooling dries the air', body: `Below ${fig(c.Td)} °C the air can no longer hold its vapour: it follows the saturation curve down to ${fig(state.T2)} °C and drops ${fig(1000 * c.water)} g of water per kilogram. Of the ${fig(c.q)} kJ/kg removed, about ${fig(100 * (1 - c.sensible / c.q))}% goes into condensing that water. ${leavesOut}` };
  },
  app: false,
});
