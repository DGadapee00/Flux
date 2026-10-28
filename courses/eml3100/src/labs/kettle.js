import { fromC, satP, toC, waterTP } from '@flux/subjects/thermo';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, dot, layout, line } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, leavesOut, showField, slider } from './widgets.js';

/**
 * Shows that a covered pot on a coil burner is a constant-pressure closed system until the water
 * boils: the heat is m Δh, the boundary work is only the tiny swell of the liquid, and the time
 * is that heat divided by the power that enters the water.
 *
 * Cited: DOE's residential cooking baseline gives an open-coil cooktop two 6-inch elements at
 * 1250 W and two 8-inch elements at 2100 W, with a cooking efficiency of 73.7% (1996 TSD, restated
 * in the 2005 priority-setting appendix). DOE's Energy Saver guide says to boil water in a covered
 * kettle or pan. The 1 kg load, the 0.5 kg load and the 20°C start are assumed. Sea-level pressure
 * is 101325 Pa. Second method: m ∫ c_p dT against m Δh, and m Δu + P ΔV against m Δh.
 */

const P_ATM = 101325;
const ETA = 0.737;
const OUT = 'The 73.7% is a test-load average for the element, not a measurement on this pot. The pot\'s metal and the lid take some of the heat, and a loose lid lets vapour leave, so the water receives less than the model assigns it. The clock stops at the boiling temperature. Evaporating the water would take the latent heat as well, which is several times the warm-up. The 1 kg and 0.5 kg loads and the starting temperature are assumed.';

const SCENARIOS = [
  { id: 'six', name: '6-inch coil, 1 kg', power: 1250, m: 1, T1: fromC(20) },
  { id: 'eight', name: '8-inch coil, 1 kg', power: 2100, m: 1, T1: fromC(20) },
  { id: 'half', name: '6-inch coil, 0.5 kg', power: 1250, m: 0.5, T1: fromC(20) },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  state.power = sc.power;
  state.m = sc.m;
  state.T1 = sc.T1;
}

function simpson(f, a, b, n = 200) {
  const h = (b - a) / n;
  let sum = f(a) + f(b);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * f(a + i * h);
  return (sum * h) / 3;
}

const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-12);

const CONTROLS = [
  { id: 'kt-m', key: 'm', label: 'mass of water (kg)', lo: 0.25, hi: 2, step: 0.05 },
  { id: 'kt-T', key: 'T1', label: 'starting temperature (°C)', lo: 5, hi: 90, step: 1, c: true },
  { id: 'kt-W', key: 'power', label: 'element rating (W)', lo: 1000, hi: 2100, step: 50 },
];

export default defineLab({
  id: 'kettle',
  exam: 'u2',
  title: 'Boiling on a coil',
  hint: 'Heat at constant pressure is m Δh. The element rating and the cooking efficiency set how long the warm-up takes.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('six', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'm', lo: 0.25, hi: 2 }),
  controls() {
    return `${CONTROLS.map((c) => slider(c.id, c.label, c.lo, c.lo, c.hi, c.step)).join('')}
      <p class="tiny">Cited: DOE coil elements, 6-inch 1250 W and 8-inch 2100 W, cooking efficiency 73.7%. A covered kettle is the DOE Energy Saver advice. Assumed: 1 kg or 0.5 kg of water, 20°C start, 101325 Pa, heat stops at the boil.</p>`;
  },
  bind(api) {
    for (const c of CONTROLS) bindSlider(c.id, (s, v) => { s[c.key] = c.c ? fromC(v) : v; }, api);
  },
  syncControls(state) {
    for (const c of CONTROLS) {
      showField(c.id, true);
      const el = document.getElementById(c.id);
      if (!el || document.activeElement === el) continue;
      const v = c.c ? toC(state[c.key]) : state[c.key];
      el.value = String(v);
    }
  },
  compute(state) {
    const T2 = satP(P_ATM).T;
    const T1 = Math.min(state.T1, T2 - 2);
    const a = waterTP(T1, P_ATM);
    const b = waterTP(T2, P_ATM);
    const q = state.m * (b.h - a.h);
    const byCp = state.m * simpson((T) => waterTP(T, P_ATM).cp, T1, T2);
    const byU = state.m * (b.u - a.u) + P_ATM * state.m * (b.v - a.v);
    const into = state.power * ETA;
    return {
      T1, T2, q, dh: b.h - a.h, time: q / into, into, Wb: P_ATM * state.m * (b.v - a.v),
      gap: Math.max(rel(q, byCp), rel(q, byU)),
    };
  },
  draw(canvas, state, c) {
    const samples = [];
    let peak = c.time;
    for (let i = 0; i <= 40; i++) {
      const m = 0.25 + ((2 - 0.25) * i) / 40;
      const t = (m * c.dh) / c.into;
      samples.push([m, t]);
      peak = Math.max(peak, t);
    }
    const P = layout(canvas, { lo: 0.25, hi: 2 }, { lo: 0, hi: peak * 1.08 });
    axes(P, { xLabel: 'mass (kg)', yLabel: 'time (s)' });
    line(P, samples, { color: C.teal, width: 3 });
    line(P, [[0.25, c.time], [2, c.time]], { color: alpha(C.gold, 0.85), width: 2, dash: [5, 4] });
    dot(P, state.m, c.time, { color: C.yellow, r: 5 });
  },
  law: () => [String.raw`Q = m(h_2 - h_1)`, String.raw`t = Q/(\eta \dot W)`],
  liveRows(state, c) {
    return [
      kv('heat into the water', `${fig(c.q / 1000)} kJ`),
      kv('power into the water', `${fig(c.into)} W`),
      kv('time to the boil', `${fig(c.time)} s`),
      kv('boundary work', `${fig(c.Wb)} J`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['heat', `${fig(c.q / 1000)} kJ`],
      ['time', `${fig(c.time)} s`],
      ['into the water', `${fig(c.into)} W`],
      ['boil', `${fig(toC(c.T2))} °C`],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => ({
    title: c.Wb < 10 ? 'Almost no boundary work' : 'Constant pressure',
    body: String.raw`The element is rated ${fig(state.power)} W. At 73.7% cooking efficiency, ${fig(c.into)} W enters the water. Heating ${fig(state.m)} kg from ${fig(toC(c.T1))} °C to ${fig(toC(c.T2))} °C takes ${fig(c.q / 1000)} kJ and ${fig(c.time)} s. The liquid swells a little, and that boundary work is only ${fig(c.Wb)} J, so Q and m Δu agree to a fraction of a percent. The heat at constant pressure is m Δh.`,
  })),
});
