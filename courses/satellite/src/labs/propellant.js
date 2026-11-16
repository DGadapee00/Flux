import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { TECH, budgetPropChecked, propellantClosed } from '@flux/subjects/mechanics/propulsion.js';

/**
 * Propellant budget: the Δv a mission needs, for drag makeup and disposal, and the propellant and
 * tankage each kind of thruster needs to give it.
 *
 * Shows that specific impulse is not the whole story. The rocket equation makes propellant grow
 * exponentially with Δv over exhaust speed, and the tank grows with the propellant. For cold gas the
 * tank outweighs the gas it holds, at any pressure, so nitrogen can never give more than about
 * 370 m/s however much is carried. Hydrazine needs a fifth of the mass for the same job; an electric
 * thruster a fiftieth, but it burns for days. The closed form is checked by stepping the burn and
 * finding the propellant by bisection (packages/subjects/src/mechanics/propulsion.js).
 *
 * Specific impulses lie in NASA's small spacecraft report's Table 4-1 ranges. Nitrogen's comes from
 * its heat capacity and the tank's ratio from 7075-T6's strength and density (Wikipedia). Tankage,
 * hardware masses, thrusts and the electric thruster's 40 W are our own round figures. The craft's
 * 0.06 m² and the drag model are Unit 9's.
 */
const SCENARIOS = [
  { id: 'mono', name: 'The magnetometer craft: a year at 500 km, then disposal, on hydrazine', tech: 'mono', hkm: 500, years: 1, dry: 10 },
  { id: 'cold', name: 'The same mission on cold gas', tech: 'cold', hkm: 500, years: 1, dry: 10 },
  { id: 'low', name: 'Three years at 400 km on cold gas', tech: 'cold', hkm: 400, years: 3, dry: 10 },
  { id: 'electric', name: 'Three years at 400 km, electric', tech: 'electric', hkm: 400, years: 3, dry: 10 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, tech: sc.tech, hkm: sc.hkm, years: sc.years, dry: sc.dry });
}

const SLIDERS = [['pr-h', 'hkm'], ['pr-y', 'years'], ['pr-d', 'dry']];
const ALLOCATION = 12; // kg, Unit 8's 6U allocation
const COLORS = { cold: C.blue, mono: C.gold, electric: C.green };
const kg = (x) => (x === null ? 'out of reach' : `${fig(x)} kg`);
const hrs = (h) => (h === null ? '—' : h < 1 ? `${fig(h * 60)} min` : h < 48 ? `${fig(h)} h` : `${fig(h / 24)} days`);

export default defineLab({
  id: 'propellant',
  exam: 'u14',
  title: 'Propellant budget',
  hint: 'Switch the magnetometer craft from hydrazine to cold gas and watch the propulsion system outweigh a third of the craft. Then fly five years at 350 km and watch nitrogen run out of reach.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('mono', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'hkm', lo: 350, hi: 700 }),
  controls() {
    const opt = Object.entries(TECH).map(([k, t]) => `<option value="${k}">${t.name}, ${fig(t.isp)} s</option>`).join('');
    return `
      <label class="field"><span>Thruster</span><select id="pr-t">${opt}</select></label>
      ${slider('pr-h', 'Altitude (km)', 500, 350, 700, 10)}
      ${slider('pr-y', 'Years holding the orbit against drag', 1, 0, 5, 0.5)}
      ${slider('pr-d', 'Dry mass of the craft (kg)', 10, 4, 20, 0.5)}
      <p class="tiny">Drag at a middling Sun, F10.7 = 147, on 0.06 m². Disposal lowers the perigee to 200 km, where drag brings the craft down within weeks.</p>`;
  },
  bind(api) {
    document.getElementById('pr-t')?.addEventListener('change', (e) => {
      api.slice().tech = e.target.value;
      api.bump();
    });
    for (const [id, key] of SLIDERS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    for (const [id, key] of [['pr-t', 'tech'], ...SLIDERS]) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    const c = budgetPropChecked({ hkm: state.hkm, years: state.years, mass: state.dry, area: 0.06, f107: 147, dry: state.dry, tech: state.tech });
    return { ...c, fits: c.wet !== null && c.wet <= ALLOCATION, systemKg: c.system ?? null };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const both = H > 380 || (W > 1.5 * H && W > 560);
    const [top, bottom] = both ? split(B.free, 0.66) : [B.free, null];
    const xHi = Math.max(600, Math.ceil((c.total * 1.3) / 100) * 100);
    const yHi = 15;
    const P = plotIn(B, top, { lo: 0, hi: xHi }, { lo: 0, hi: yHi });
    axes(P, { xLabel: 'Δv (m/s)', yLabel: 'propulsion system mass (kg)' });
    for (const [k, t] of Object.entries(TECH)) {
      const pts = [];
      for (let i = 0; i <= 300; i++) {
        const dv = (xHi * i) / 300;
        const r = propellantClosed({ dv, dry: state.dry, tech: k });
        if (r.system === null || r.system > yHi) break;
        pts.push([dv, r.system]);
      }
      const on = k === state.tech;
      line(P, pts, { color: on ? COLORS[k] : alpha(COLORS[k], 0.45), width: on ? 3 : 1.5 });
      const end = pts[pts.length - 1];
      if (end) label(P, t.name.split(',')[0], end, { color: COLORS[k], align: end[0] > xHi * 0.8 ? 'right' : 'left', dx: end[0] > xHi * 0.8 ? -4 : 6, dy: end[1] > yHi * 0.85 ? 14 : -8 });
    }
    // Nitrogen's ceiling, and the mission's Δv.
    const ceil = TECH.cold.isp * 9.80665 * Math.log((1 + TECH.cold.k) / TECH.cold.k);
    if (ceil < xHi) {
      seg(P, [ceil, 0], [ceil, yHi], { color: alpha(C.blue, 0.7), width: 1.5, dash: [5, 4] });
      label(P, 'nitrogen’s limit', [ceil, yHi * 0.7], { color: C.blue, align: 'left', dx: 6 });
    }
    seg(P, [c.total, 0], [c.total, yHi], { color: alpha(C.text, 0.7), width: 1.5, dash: [3, 3] });
    label(P, `mission ${fig(c.total)} m/s`, [c.total, 0], { color: C.text, align: 'left', dx: 6, dy: -10 });
    if (c.system !== null && c.system <= yHi) dot(P, c.total, c.system, { color: COLORS[state.tech], r: 5 });
    if (!bottom) return;
    // The Δv budget.
    const Q = plotIn(B, bottom, { lo: 0, hi: xHi }, { lo: 0, hi: 1 }, { left: 52, right: 16, top: 8, bottom: 40 });
    axes(Q, { xLabel: 'Δv budget (m/s)', yFmt: () => '' });
    poly(Q, [[0, 0.25], [c.makeup, 0.25], [c.makeup, 0.75], [0, 0.75]], { fill: alpha(C.teal, 0.8), stroke: null });
    poly(Q, [[c.makeup, 0.25], [c.total, 0.25], [c.total, 0.75], [c.makeup, 0.75]], { fill: alpha(C.pink, 0.8), stroke: null });
    label(Q, `drag makeup ${fig(c.makeup)}`, [0, 0.75], { color: C.teal, align: 'left', dy: -8 });
    label(Q, `disposal ${fig(c.dispose)}`, [c.makeup, 0.25], { color: C.pink, align: 'left', dy: 10 });
  },
  law: () => [
    String.raw`m_p = m_d\,\frac{R - 1}{1 - k(R - 1)}, \quad R = e^{\Delta v/u_e}`,
    String.raw`\Delta v_\text{max} = u_e \ln\frac{1 + k}{k}`,
  ],
  liveRows(state, c) {
    const t = TECH[state.tech];
    return [
      kv('Drag makeup', `${fig(c.makeup)} m/s over ${fig(state.years)} yr`),
      kv('Disposal to a 200 km perigee', `${fig(c.dispose)} m/s`),
      kv('Exhaust speed', `${fig(c.ue)} m/s`),
      kv('Tankage, of the propellant', `${fig(100 * t.k)}%`),
      kv('Most it can ever give', `${fig(c.ceiling)} m/s`),
      kv('Propellant, closed and stepped', c.reachable ? `${fig(c.mp)}, ${fig(c.mpStep)} kg` : 'out of reach'),
      kv('Propulsion system', kg(c.system)),
      kv('Wet mass', c.reachable ? `${fig(c.wet)} kg of ${ALLOCATION}` : 'out of reach'),
      kv('Burning time', hrs(c.burnH)),
      kv('Two methods differ by', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['Δv', `${fig(c.total)} m/s`],
      ['system', kg(c.system)],
      ['wet', c.reachable ? `${fig(c.wet)} kg` : 'none'],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Real nozzles that do not expand fully, so cold gas gives less than its ideal 80 s; the power an electric thruster needs, which Unit 5's array must supply; residual propellant left in the tank; gravity losses; and the Sun's cycle, which can triple the drag.`;
    const t = TECH[state.tech];
    if (!c.reachable) {
      return { title: 'Out of reach', body: `${t.name} can never give more than ${fig(c.ceiling)} m/s: past that, each kilogram of propellant brings ${fig(t.k)} kg of tank, and the rocket equation cannot keep up. The mission needs ${fig(c.total)} m/s. Choose a higher specific impulse, fly higher, or shorten the mission. ${leavesOut}` };
    }
    if (!c.fits) {
      return { title: 'It no longer fits', body: `${fig(c.total)} m/s takes ${fig(c.mp)} kg of propellant and ${fig(c.system)} kg of propulsion system in all, so the craft weighs ${fig(c.wet)} kg against its ${ALLOCATION} kg allocation. ${state.tech === 'cold' ? 'Cold gas tanks weigh more than the gas they hold.' : 'Cut the Δv or raise the specific impulse.'} ${leavesOut}` };
    }
    return { title: `${fig(c.system)} kg of propulsion`, body: `${fig(c.total)} m/s, ${fig(c.makeup)} of drag makeup and ${fig(c.dispose)} for disposal, takes ${fig(c.mp)} kg of propellant. ${state.tech === 'electric' ? `The thruster burns for ${hrs(c.burnH)} to give it, at ${fig(c.thrust * 1000)} mN.` : `It burns for ${hrs(c.burnH)}.`} The craft weighs ${fig(c.wet)} kg of its ${ALLOCATION}. ${leavesOut}` };
  },
  app: false,
});
