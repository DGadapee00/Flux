import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { flameChecked, flameClosed } from '@flux/subjects/thermo/flame.js';

/**
* Flame: methane burning in air with a slider for the percent of theoretical air, the adiabatic
 * flame temperature and the products drawn.
 *
 * Shows that more air does not make a hotter flame: the flame peaks near stoichiometric, 2326 K, and
 * extra air only brings nitrogen and oxygen that soak up the heat (1789 K at 150%). Too little air
 * leaves fuel energy unreleased in CO. The Newton solution on the NASA enthalpies is checked by
 * integrating the products' heat capacity with Simpson's rule (packages/subjects/src/thermo/flame.js).
 */
const SCENARIOS = [
  { id: 'stoich', name: 'Stoichiometric, 100% air', air: 100 },
  { id: 'lean', name: 'Lean, 150% air', air: 150 },
  { id: 'rich', name: 'Rich, 85% air', air: 85 },
  { id: 'vlean', name: 'Very lean, 300% air', air: 300 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, air: sc.air });
}

const KEYS = [['fl-a', 'air']];

function temp(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 80, hi: 300 }, { lo: 800, hi: 2500 });
  axes(P, { xLabel: 'theoretical air (%)', yLabel: 'adiabatic flame temperature (K)' });
  const pts = Array.from({ length: 111 }, (_, i) => {
    const a = 80 + 2 * i;
    return [a, flameClosed({ air: a }).T];
  });
  line(P, pts, { color: C.gold, width: 2.5 });
  seg(P, [100, 800], [100, 2500], { color: alpha(C.muted, 0.6), width: 1, dash: [4, 4] });
  label(P, 'stoichiometric', [100, 2500], { color: C.muted, align: 'left', dx: 4, dy: 10 });
  dot(P, state.air, c.T, { color: C.pink, r: 6, ring: C.text });
  label(P, `${fig(c.T)} K`, [state.air, c.T], { color: C.text, align: 'left', dx: 10, dy: -8 });
}

function mix(B, rect, state, c) {
  const names = ['CO2', 'CO', 'H2O', 'O2', 'N2'];
  const shown = ['CO₂', 'CO', 'H₂O', 'O₂', 'N₂'];
  const P = plotIn(B, rect, { lo: -0.5, hi: 4.5 }, { lo: 0, hi: 24 });
  axes(P, { xLabel: 'product', yLabel: 'moles per mole of CH₄', xFmt: (v) => (Math.abs(v - Math.round(v)) < 1e-6 ? shown[Math.round(v)] ?? '' : '') });
  names.forEach((k, i) => {
    const n = c.P[k];
    poly(P, [[i - 0.3, 0], [i + 0.3, 0], [i + 0.3, n], [i - 0.3, n]], { fill: alpha(k === 'N2' ? C.muted : k === 'CO' ? C.red : C.gold, 0.7), stroke: null });
    label(P, fig(n), [i, n], { color: C.text, dy: -8 });
  });
}

export default defineLab({
  id: 'flame',
  exam: 'u1',
  title: 'Flame',
  hint: 'Start at 100% and add air. Then go below 100%.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('stoich', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'air', lo: 80, hi: 300 }),
  controls() {
    return `
      ${slider('fl-a', "Theoretical air (%)", 100, 80, 300, 1)}
      <p class="tiny">CH₄ and air enter at 25 °C, burn completely as far as the oxygen allows, and lose no heat. Rich: the hydrogen takes its oxygen first; the carbon makes CO₂ and CO. Dissociation is left out. Left: flame temperature against air. Right: moles of each product per mole of fuel.</p>`;
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
    return flameChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      temp(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    temp(B, a, state, c);
    mix(B, b, state, c);
  },
  law: () => [String.raw`\mathrm{CH_4} + 2\lambda(\mathrm{O_2} + 3.76\,\mathrm{N_2}) \to \text{products}`, String.raw`\sum_\text{P} N_i\,\bar h_i(T_\text{ad}) = \sum_\text{R} N_i\,\bar h_i(298\ \text{K})`],
  liveRows(state, c) {
    return [
      kv('Flame temperature', `${fig(c.T)} K (${fig(c.Tc)} °C)`),
      kv('Air–fuel ratio by mass', fig(c.AF)),
      kv('Moles of products per mole of fuel', fig(c.nTot)),
      kv('Heat released per mole of fuel', `${fig(c.lhv / 1000)} kJ`),
      kv('Newton against the integrated c_p', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['flame', `${fig(c.T)} K`], ['air', `${fig(state.air)}%`], ['A/F', fig(c.AF)], ['CO', fig(c.P.CO)]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Above about 2000 K CO₂ and H₂O dissociate, which absorbs heat and lowers the real peak by 100 K or so and moves it slightly rich; real flames also lose heat by radiation.`;
    if (state.air < 99) return { title: 'Too little air: fuel energy left in CO', body: `At ${fig(state.air)}% air, ${fig(c.P.CO)} mol of CO leave per mole of fuel, still holding energy: only ${fig(c.lhv / 1000)} kJ of the 803 kJ is released, and the flame reaches ${fig(c.T)} K. ${leavesOut}` };
    if (state.air > 101) return { title: 'Extra air soaks up heat', body: `At ${fig(state.air)}% air the fuel releases all 803 kJ, but it must now heat ${fig(c.nTot)} mol of products, much of it nitrogen and spare oxygen: ${fig(c.T)} K, against 2326 K at stoichiometric. Engines run lean for economy and to keep turbine blades cool, not for heat. ${leavesOut}` };
    return { title: 'Stoichiometric: the hottest flame', body: `Just enough air: every carbon becomes CO₂ and every hydrogen H₂O, with nothing extra to heat. ${fig(c.T)} K. ${leavesOut}` };
  },
  app: false,
});
