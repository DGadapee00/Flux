import { M_PER_FT, PA_PER_PSI } from '@flux/subjects/convert.js';
import { psat, satP, toC, toF } from '@flux/subjects/thermo';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, dot, layout, line } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, leavesOut, showField, slider } from './widgets.js';

/**
 * Shows that a pressure canner boils water hotter than an open pot, because the absolute pressure
 * is the gauge reading plus the atmosphere, and that a higher altitude lowers that absolute
 * pressure unless the gauge setting is raised.
 *
 * Cited: USDA Complete Guide to Home Canning (AIB 539, 2015) states that 10.5 psi gauge at sea
 * level gives 240°F, and that a weighted-gauge canner above 1,000 ft runs at 15 psi where the
 * sea-level process used 10 psi. The sea-level atmosphere and its drop with height are the
 * troposphere of the international standard atmosphere (101325 Pa, 288.15 K, lapse 0.0065 K/m).
 * Second method: Tsat by bisection on the saturation pressure, and the standard-atmosphere
 * pressure by integrating the hydrostatic equation.
 */

const P0 = 101325;
const T0 = 288.15;
const LAPSE = 0.0065;
const G = 9.80665;
const R_ISA = 287.05287;
const MPA = 1e6;

const OUT = 'The model is pure steam in equilibrium, with no air left in the vessel. A canner that was not vented holds air, and the temperature at the same gauge reading is lower. The food is not pure water, the jars warm slowly, and a real day is not the standard atmosphere. The guide\'s processing time is about killing spores, which this diagram does not time.';

const SCENARIOS = [
  { id: 'sea', name: 'Sea level, 10 psi', altitudeFt: 0, gaugePsi: 10 },
  { id: 'stated', name: 'The 10.5 psi statement', altitudeFt: 0, gaugePsi: 10.5 },
  { id: 'high', name: '5,000 ft, 15 psi', altitudeFt: 5000, gaugePsi: 15 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  state.altitudeFt = sc.altitudeFt;
  state.gaugePsi = sc.gaugePsi;
}

/** Troposphere pressure, Pa, from the international standard atmosphere. */
export function isaPressure(ft) {
  const h = Math.max(0, ft) * M_PER_FT;
  const T = T0 - LAPSE * h;
  return P0 * (T / T0) ** (G / (R_ISA * LAPSE));
}

function simpson(f, a, b, n = 200) {
  const h = (b - a) / n;
  let sum = f(a) + f(b);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * f(a + i * h);
  return (sum * h) / 3;
}

/** Hydrostatic integration of dp/p = −g dh /(R T). */
function isaHydro(ft) {
  const h = Math.max(0, ft) * M_PER_FT;
  if (h < 1) return P0;
  const integral = simpson((z) => G / (R_ISA * (T0 - LAPSE * z)), 0, h);
  return P0 * Math.exp(-integral);
}

function tsatBisect(pPa) {
  let lo = 273.16;
  let hi = 623.15;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (psat(mid) * MPA < pPa) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-12);

const CONTROLS = [
  { id: 'cn-gauge', key: 'gaugePsi', label: 'gauge pressure (psi)', lo: 0, hi: 15, step: 0.5 },
  { id: 'cn-alt', key: 'altitudeFt', label: 'altitude (ft)', lo: 0, hi: 8000, step: 100 },
];

export default defineLab({
  id: 'canner',
  exam: 'u1',
  title: 'Pressure canner',
  hint: 'The boiling temperature follows the absolute pressure: gauge plus the atmosphere at that altitude.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('sea', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'gaugePsi', lo: 0, hi: 15 }),
  controls() {
    return `${CONTROLS.map((c) => slider(c.id, c.label, c.lo, c.lo, c.hi, c.step)).join('')}
      <p class="tiny">Cited: USDA Complete Guide to Home Canning (2015) states 240°F at 10.5 psi gauge at sea level, and 15 psi on a weighted gauge above 1,000 ft where the sea-level process used 10 psi. Altitude pressure is the standard atmosphere. Assumed: pure steam, fully vented.</p>`;
  },
  bind(api) {
    for (const c of CONTROLS) bindSlider(c.id, (s, v) => { s[c.key] = v; }, api);
  },
  syncControls(state) {
    for (const c of CONTROLS) {
      showField(c.id, true);
      const el = document.getElementById(c.id);
      if (!el || document.activeElement === el) continue;
      el.value = String(state[c.key]);
    }
  },
  compute(state) {
    const patm = isaPressure(state.altitudeFt);
    const p = patm + state.gaugePsi * PA_PER_PSI;
    const T = satP(p).T;
    const hydro = isaHydro(state.altitudeFt);
    const gap = Math.max(rel(T, tsatBisect(p)), rel(patm, hydro));
    return { patm, p, T, Tc: toC(T), Tf: toF(T), gap };
  },
  draw(canvas, state, c) {
    const samples = [];
    let tLo = c.Tc;
    let tHi = c.Tc;
    for (let i = 0; i <= 40; i++) {
      const g = (15 * i) / 40;
      const t = toC(satP(c.patm + g * PA_PER_PSI).T);
      samples.push([g, t]);
      tLo = Math.min(tLo, t);
      tHi = Math.max(tHi, t);
    }
    const open = toC(satP(c.patm).T);
    const P = layout(canvas, { lo: 0, hi: 15 }, { lo: Math.min(tLo, open) - 4, hi: tHi + 4 });
    axes(P, { xLabel: 'gauge (psi)', yLabel: 'Tsat (°C)' });
    line(P, samples, { color: C.teal, width: 3 });
    line(P, [[0, open], [15, open]], { color: alpha(C.gold, 0.9), width: 2, dash: [5, 4] });
    dot(P, state.gaugePsi, c.Tc, { color: C.yellow, r: 5 });
  },
  law: () => [String.raw`P = P_\mathrm{atm} + P_\mathrm{gauge}`, String.raw`T = T_\mathrm{sat}(P)`],
  liveRows(state, c) {
    return [
      kv('absolute pressure', `${fig(c.p / 1000)} kPa`),
      kv('atmosphere', `${fig(c.patm / 1000)} kPa`),
      kv('boiling point', `${fig(c.Tc)} °C`),
      kv('boiling point', `${fig(c.Tf)} °F`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['Tsat', `${fig(c.Tc)} °C`],
      ['Tsat', `${fig(c.Tf)} °F`],
      ['absolute', `${fig(c.p / 1000)} kPa`],
      ['atmosphere', `${fig(c.patm / 1000)} kPa`],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => ({
    title: state.gaugePsi < 1 ? 'Open pot' : 'The gauge is not the whole pressure',
    body: String.raw`At ${fig(state.altitudeFt)} ft the standard atmosphere is ${fig(c.patm / 1000)} kPa. A gauge reading of ${fig(state.gaugePsi)} psi adds to that, so the absolute pressure is ${fig(c.p / 1000)} kPa and water boils at ${fig(c.Tc)} °C (${fig(c.Tf)} °F). The guide states 240°F for 10.5 psi gauge at sea level. An open pot at this altitude boils at ${fig(toC(satP(c.patm).T))} °C.`,
  })),
});
