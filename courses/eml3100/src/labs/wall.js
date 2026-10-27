import { J_PER_BTU, K_PER_R, M_PER_FT } from '@flux/subjects/convert.js';
import { fromC, reservoirGeneration, toC, toF } from '@flux/subjects/thermo';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, axes, dot, layout, line, note } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, leavesOut, slider } from './widgets.js';

/**
 * Shows that heat crossing a wall from a warm room to cold air generates entropy, and that the
 * generation shrinks as the two temperatures approach each other.
 *
 * Cited: US DOE, from the 2021 IECC, climate zone 4 except marine. An uninsulated attic ceiling
 * is R-60. An uninsulated 2×4 wood-frame wall is met by R-20 plus R-5 continuous insulation,
 * or by R-13 plus R-10 continuous, or by R-20 continuous alone.
 * https://www.energy.gov/cmei/buildings/articles/energy-efficient-home-improvement-credit-insulation-and-air-sealing
 * The indoor temperature, the outdoor temperature and the area are assumed.
 */

/** R in h·ft²·°F/Btu, returned as m²·K/W, from the exact foot, Btu and rankine. */
export function rIpToSi(rIp) {
  return rIp * M_PER_FT ** 2 * K_PER_R * 3600 / J_PER_BTU;
}

const OUT = 'The R-value is a layer sum. Studs, plates and a window are a parallel path with a lower R, so the real heat loss is larger. Air leaks through the same wall and carry enthalpy the conduction model never sees. The outdoor temperature also moves through the day, and the wall itself stores heat while it does.';

const LAYERS = {
  ceiling: 60,
  wall: 25,
  fill: 23,
  board: 20,
};

const SCENARIOS = [
  { id: 'ceiling', name: 'Attic ceiling, R-60', layer: 'ceiling', Tin: fromC(21), Tout: fromC(0), area: 80 },
  { id: 'wall', name: 'Wood-frame wall, R-20 + R-5', layer: 'wall', Tin: fromC(21), Tout: fromC(0), area: 40 },
  { id: 'mild', name: 'The same wall on a milder day', layer: 'wall', Tin: fromC(21), Tout: fromC(10), area: 40 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, {
    scenarioId: sc.id, layer: sc.layer, Tin: sc.Tin, Tout: sc.Tout, area: sc.area,
  });
}

const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-9);

export default defineLab({
  id: 'wall',
  exam: 'u5',
  title: 'Heat through a wall',
  hint: 'A temperature difference pushes heat through the wall, and that heat generates entropy in the two rooms.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('wall', s);
    return s;
  },
  applyScenario: apply,
  sweep(state) {
    return { key: 'Tout', lo: fromC(-10), hi: state.Tin - 2 };
  },
  controls() {
    return `${slider('wl-out', 'outdoor temperature (°C)', 0, -10, 18, 1)}
      ${slider('wl-area', 'area (m²)', 40, 10, 120, 5)}
      <p class="tiny">Cited: DOE, from the 2021 IECC, climate zone 4 except marine. Ceiling R-60 for an uninsulated attic. Wall options for an uninsulated 2×4 frame: R-20 + R-5 continuous, R-13 + R-10 continuous, or R-20 continuous. Assumed: 21 °C indoors, and the areas above.</p>`;
  },
  bind(api) {
    bindSlider('wl-out', (s, v) => { s.Tout = fromC(v); }, api);
    bindSlider('wl-area', (s, v) => { s.area = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (!el || document.activeElement === el) return;
      el.value = String(Number(val.toPrecision(5)));
    };
    set('wl-out', toC(state.Tout));
    set('wl-area', state.area);
  },
  compute(state) {
    const Tin = state.Tin;
    const Tout = Math.min(state.Tout, Tin - 0.5);
    const area = Math.min(Math.max(state.area, 1), 200);
    const rIp = LAYERS[state.layer] || 25;
    const rSi = rIpToSi(rIp);
    const q = (area * (Tin - Tout)) / rSi;
    const areaFt = area / M_PER_FT ** 2;
    const dTf = (Tin - Tout) / K_PER_R;
    const qIp = (areaFt * dTf / rIp) * (J_PER_BTU / 3600);
    const sgen = reservoirGeneration(q, Tin, Tout);
    const tinR = toF(Tin) + 459.67;
    const toutR = toF(Tout) + 459.67;
    const sgenR = q * (1 / (toutR * K_PER_R) - 1 / (tinR * K_PER_R));
    return {
      Tin, Tout, area, rIp, rSi, q, qIp, sgen, sgenR,
      lost: Tin * sgen,
      gap: Math.max(rel(q, qIp), rel(sgen, sgenR)),
    };
  },
  draw(canvas, state, c) {
    const lo = -10;
    const hi = 18;
    const samples = [];
    let peak = 1;
    for (let i = 0; i <= 40; i++) {
      const tC = lo + ((hi - lo) * i) / 40;
      const Tout = fromC(tC);
      const q = (c.area * (c.Tin - Tout)) / c.rSi;
      samples.push([tC, q]);
      peak = Math.max(peak, q);
    }
    const P = layout(canvas, { lo, hi }, { lo: 0, hi: peak * 1.15 });
    axes(P, { xLabel: 'outdoor °C', yLabel: 'heat loss (W)' });
    line(P, samples, { color: C.teal, width: 2 });
    dot(P, toC(c.Tout), c.q, { color: C.yellow, r: 5 });
    note(P, `R-${c.rIp}`, lo + 2, peak, { color: C.teal });
  },
  law: () => [String.raw`\dot Q = A\,\Delta T / R`, String.raw`\dot S_\mathrm{gen} = \dot Q(1/T_L - 1/T_H)`],
  liveRows(state, c) {
    return [
      kv('R, SI', `${fig(c.rSi)} m²·K/W`),
      kv('heat, from R in SI', `${fig(c.q)} W`),
      kv('heat, from R in IP', `${fig(c.qIp)} W`),
      kv('S_gen', `${fig(c.sgen)} W/K`),
      kv('S_gen from rankine', `${fig(c.sgenR)} W/K`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['R', `R-${c.rIp}`],
      ['Q', `${fig(c.q)} W`],
      ['S_gen', `${fig(c.sgen)} W/K`],
      ['lost work', `${fig(c.lost)} W`],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => ({
    title: c.Tout < fromC(5) ? 'A cold day makes more entropy' : 'A smaller difference wastes less',
    body: String.raw`R-${c.rIp} is ${fig(c.rSi)} m²·K/W. Across ${fig(c.area)} m² the heat loss is ${fig(c.q)} W. That heat leaves ${fig(toC(c.Tin))} °C and arrives at ${fig(toC(c.Tout))} °C, generating ${fig(c.sgen)} W/K. The work that generation makes unavailable, against the room, is ${fig(c.lost)} W.`,
  })),
});
