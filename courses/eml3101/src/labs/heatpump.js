import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { FL, hf, hg, psatR, pumpChecked, pumpClosed } from '@flux/subjects/thermo/heatpump.js';

/**
* Heat pump: a vapour-compression heat pump warming a 21 °C room, on a p–h chart, with a slider for
 * the outdoor temperature.
 *
 * Shows that a heat pump does not deliver a fixed multiple of its work: as the outdoor air cools from
 * 7 °C to −10 °C the pressure lift grows, the compressor works harder, and the COP falls from 6.2 to
 * 4.1, still well above 1. The refrigerant is a simple model of R-134a. The compressor work is checked
 * by integrating v dp along the isentrope (packages/subjects/src/thermo/heatpump.js).
 */
const SCENARIOS = [
  { id: 'mild', name: 'Outdoors 7 °C', Tout: 7 },
  { id: 'cold', name: 'Outdoors −10 °C', Tout: -10 },
  { id: 'frost', name: 'Outdoors −20 °C', Tout: -20 },
  { id: 'zero', name: 'Outdoors 0 °C', Tout: 0 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, Tout: sc.Tout });
}

const KEYS = [['hp-t', 'Tout']];

function ph(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 0, hi: 340 }, { lo: 50, hi: 2000, log: true });
  axes(P, { xLabel: 'enthalpy h (kJ/kg)', yLabel: 'pressure (kPa)' });
  const Ts = Array.from({ length: 61 }, (_, i) => 233.15 + i * 2);
  line(P, Ts.map((T) => [hf(T), psatR(T)]), { color: alpha(C.muted, 0.8), width: 1.5 });
  line(P, Ts.map((T) => [hg(T), psatR(T)]), { color: alpha(C.muted, 0.8), width: 1.5 });
  line(P, [[c.h1, c.pe], [c.h2, c.pc], [c.h3, c.pc], [c.h4, c.pe], [c.h1, c.pe]], { color: C.gold, width: 2.5 });
  label(P, 'compressor', [(c.h1 + c.h2) / 2, Math.sqrt(c.pe * c.pc)], { color: C.gold, align: 'left', dx: 8 });
  label(P, 'condenser, indoors', [(c.h2 + c.h3) / 2, c.pc], { color: C.red, dy: -10 });
  label(P, 'evaporator, outdoors', [(c.h1 + c.h4) / 2, c.pe], { color: C.blue, dy: 16 });
}

function copPlot(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: -20, hi: 8 }, { lo: 0, hi: 16 });
  axes(P, { xLabel: 'outdoor temperature (°C)', yLabel: 'COP, heat out per work in' });
  const Ts = Array.from({ length: 57 }, (_, i) => -20 + i / 2);
  line(P, Ts.map((T) => [T, pumpClosed({ Tout: T }).cop]), { color: C.gold, width: 2.5 });
  line(P, Ts.map((T) => [T, Math.min(16, pumpClosed({ Tout: T }).carnot)]), { color: alpha(C.muted, 0.8), width: 1.5, dash: [5, 4] });
  label(P, 'Carnot limit', [-20, pumpClosed({ Tout: -20 }).carnot], { color: C.muted, align: 'left', dx: 4, dy: -10 });
  seg(P, [-20, 1], [8, 1], { color: alpha(C.red, 0.7), width: 1, dash: [3, 3] });
  label(P, 'an electric heater', [8, 1], { color: C.red, align: 'right', dy: -8 });
  dot(P, state.Tout, c.cop, { color: C.pink, r: 6, ring: C.text });
}

export default defineLab({
  id: 'heatpump',
  exam: 'u3',
  title: 'Heat pump',
  hint: 'Cool the outdoor air from 7 °C to −20 °C and watch the compressor’s line on the chart grow, and the COP fall.',
  gapLimit: 1e-8,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('mild', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'Tout', lo: -20, hi: 8 }),
  controls() {
    return `
      ${slider('hp-t', "Outdoor temperature (°C)", 7, -20, 8, 0.5)}
      <p class="tiny">The refrigerant evaporates 8 K below the outdoor air and condenses at 35 °C; the compressor is 80% as good as isentropic. Left: the cycle on a p–h chart, pressure on a log scale, with the saturation dome. Right: COP against outdoor temperature, beside the Carnot limit.</p>`;
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
    return pumpChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      copPlot(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    ph(B, a, state, c);
    copPlot(B, b, state, c);
  },
  law: () => [String.raw`\text{COP}_\text{HP} = \frac{h_2 - h_3}{h_2 - h_1}, \qquad h_4 = h_3\ \text{(throttle)}`, String.raw`\text{COP}_\text{HP,Carnot} = \frac{T_H}{T_H - T_L}`],
  liveRows(state, c) {
    return [
      kv('Evaporating and condensing', `${fig(c.Te - 273.15)} °C, ${fig(c.Tc - 273.15)} °C`),
      kv('Pressures', `${fig(c.pe)} kPa to ${fig(c.pc)} kPa`),
      kv('Compressor work', `${fig(c.w)} kJ/kg`),
      kv('Heat delivered', `${fig(c.qH)} kJ/kg`),
      kv('COP, and Carnot', `${fig(c.cop)}, ${fig(c.carnot)}`),
      kv('Enthalpy rise against ∫v dp', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['COP', fig(c.cop)], ['Carnot', fig(c.carnot)], ['work', `${fig(c.w)} kJ/kg`], ['outdoors', `${fig(state.Tout)} °C`]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Below freezing the outdoor coil frosts and must be defrosted, which costs more; a real compressor’s efficiency changes with its pressure ratio; and the refrigerant here is a simple model, so real COPs are lower.`;
    return { title: 'Colder outside, lower COP', body: `With the outdoor air at ${fig(state.Tout)} °C the refrigerant must be pumped from ${fig(c.pe)} to ${fig(c.pc)} kPa, and the compressor does ${fig(c.w)} kJ/kg for ${fig(c.qH)} kJ/kg of heat: COP ${fig(c.cop)}. The Carnot limit, ${fig(c.carnot)}, falls the same way as the temperature lift grows. Even so it beats an electric heater’s 1. ${leavesOut}` };
  },
  app: false,
});
