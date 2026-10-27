import { J_PER_BTU } from '@flux/subjects/convert.js';
import { carnotEfficiency, copRefrigerator, fromF, toF } from '@flux/subjects/thermo';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, axes, dot, layout, line, note } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, leavesOut, slider } from './widgets.js';

/**
 * Shows that a unitary air conditioner, rated at the AHRI cooling temperatures, has a COP far
 * below the Carnot COP between the indoor and outdoor air, and that a hotter outdoor temperature
 * lowers the limit while the nameplate stays put.
 *
 * Cited: AHRI 210/240 cooling condition AFull, 95 °F outdoor dry-bulb and 80 °F indoor dry-bulb.
 * The capacity and the EER are assumed, so the lab is about the gap to the limit and not about
 * one model. The indoor wet-bulb of that test is left out.
 */

const W_PER_BTU_H = J_PER_BTU / 3600;

const OUT = 'The air temperatures are not the refrigerant temperatures. The evaporator is colder than the room and the condenser is hotter than the outdoors, so the Carnot COP between the two air streams is a generous ceiling. The test also fixes a wet-bulb temperature, and the cooling load is partly latent. Fans, cycling and a dirty coil move the power. The nameplate EER is one test point, not a constant.';

const SCENARIOS = [
  { id: 'rated', name: 'Rating condition', Tin: fromF(80), Tout: fromF(95), btu: 36000, eer: 11 },
  { id: 'hot', name: 'A hotter afternoon', Tin: fromF(80), Tout: fromF(105), btu: 36000, eer: 11 },
  { id: 'mild', name: 'A milder afternoon', Tin: fromF(80), Tout: fromF(85), btu: 36000, eer: 11 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, Tin: sc.Tin, Tout: sc.Tout, btu: sc.btu, eer: sc.eer });
}

const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-9);

export default defineLab({
  id: 'ac',
  exam: 'u4',
  title: 'Air conditioner',
  hint: 'The nameplate COP is a small fraction of the Carnot COP between the room and the outdoors.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('rated', s);
    return s;
  },
  applyScenario: apply,
  sweep(state) {
    return { key: 'Tout', lo: Math.max(fromF(82), state.Tin + 1.5), hi: fromF(115) };
  },
  controls() {
    return `${slider('ac-out', 'outdoor temperature (°F)', 95, 82, 115, 1)}
      ${slider('ac-eer', 'nameplate EER (Btu/h per W)', 11, 8, 16, 0.5)}
      ${slider('ac-btu', 'cooling capacity (Btu/h)', 36000, 12000, 60000, 1000)}
      <p class="tiny">Cited: AHRI 210/240 condition AFull is 95 °F outdoors and 80 °F indoors, dry-bulb. Assumed: 36,000 Btu/h and EER 11 at that point. The indoor temperature stays at 80 °F.</p>`;
  },
  bind(api) {
    bindSlider('ac-out', (s, v) => { s.Tout = fromF(v); }, api);
    bindSlider('ac-eer', (s, v) => { s.eer = v; }, api);
    bindSlider('ac-btu', (s, v) => { s.btu = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (!el || document.activeElement === el) return;
      el.value = String(Number(val.toPrecision(5)));
    };
    set('ac-out', toF(state.Tout));
    set('ac-eer', state.eer);
    set('ac-btu', state.btu);
  },
  compute(state) {
    const Tin = state.Tin;
    const Tout = Math.max(state.Tout, Tin + 0.5);
    const eer = Math.min(Math.max(state.eer, 5), 20);
    const btu = Math.min(Math.max(state.btu, 5000), 65000);
    const copK = copRefrigerator(Tin, Tout);
    const tinR = toF(Tin) + 459.67;
    const toutR = toF(Tout) + 459.67;
    const copR = tinR / (toutR - tinR);
    const copE = eer * W_PER_BTU_H;
    const coolW = btu * W_PER_BTU_H;
    const power = btu / eer;
    const copW = coolW / power;
    const eta = carnotEfficiency(Tin, Tout);
    return {
      Tin,
      Tout,
      eer,
      btu,
      copK,
      copR,
      copE,
      copW,
      coolW,
      power,
      eta,
      ratio: copE / copK,
      gap: Math.max(rel(copK, copR), rel(copE, copW)),
    };
  },
  draw(canvas, state, c) {
    const loF = 82;
    const hiF = 115;
    const samples = [];
    let peak = c.copE;
    for (let i = 0; i <= 60; i++) {
      const F = loF + ((hiF - loF) * i) / 60;
      const cop = copRefrigerator(fromF(80), fromF(F));
      samples.push([F, cop]);
      peak = Math.max(peak, cop);
    }
    const P = layout(canvas, { lo: loF, hi: hiF }, { lo: 0, hi: peak * 1.15 });
    axes(P, { xLabel: 'outdoor °F', yLabel: 'COP' });
    line(P, samples, { color: C.teal, width: 2 });
    line(P, [[loF, c.copE], [hiF, c.copE]], { color: C.yellow, width: 2, dash: [5, 4] });
    dot(P, toF(c.Tout), c.copK, { color: C.teal, r: 5 });
    dot(P, toF(c.Tout), c.copE, { color: C.yellow, r: 5 });
    note(P, 'Carnot', samples[8][0], samples[8][1], { color: C.teal });
    note(P, 'nameplate', hiF - 8, c.copE, { align: 'right', color: C.yellow, dy: -8 });
  },
  law: () => [String.raw`\mathrm{COP_R} = T_L/(T_H - T_L)`, String.raw`\mathrm{COP} = \mathrm{EER}\times(\mathrm{Btu/h})/\mathrm{W}`],
  liveRows(state, c) {
    return [
      kv('Carnot COP, kelvin', fig(c.copK)),
      kv('Carnot COP, rankine', fig(c.copR)),
      kv('nameplate, from EER', fig(c.copE)),
      kv('nameplate, from watts', fig(c.copW)),
      kv('cooling', `${fig(c.coolW / 1000)} kW`),
      kv('electric power', `${fig(c.power / 1000)} kW`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['Carnot COP', fig(c.copK)],
      ['nameplate COP', fig(c.copE)],
      ['power', `${fig(c.power / 1000)} kW`],
      ['nameplate / Carnot', fig(c.ratio)],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => ({
    title: c.Tout > fromF(100) ? 'The ceiling falls on a hot day' : 'A wide gap at the rating point',
    body: String.raw`Between ${fig(toF(c.Tin))} °F indoors and ${fig(toF(c.Tout))} °F outdoors the Carnot COP is ${fig(c.copK)}. The nameplate, EER ${fig(c.eer)}, is a COP of ${fig(c.copE)}, about ${fig(c.ratio * 100)}% of that ceiling. The electric power at ${fig(c.btu)} Btu/h is ${fig(c.power / 1000)} kW.`,
  })),
});
