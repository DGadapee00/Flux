import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, begin, dot, label, line, plotIn, poly, sceneIn } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { GASES, mixtureChecked } from '@flux/subjects/thermo/mixtures.js';

/**
 * Mixture: nitrogen and a second gas in one vessel, read by molecules, by mass and by pressure.
 *
 * Shows that mass and mole fractions are different things: a kilogram each of nitrogen and carbon
 * dioxide is half carbon dioxide by mass but only 39% by molecules, and a tenth of a kilogram of
 * hydrogen is 9% of the mass and 58% of the molecules. Each gas's partial pressure follows its mole
 * fraction, not its mass fraction. The closed form (p_i = y_i p, M = Σ y_i M_i, c_p = Σ x_i c_p,i)
 * is checked against each gas alone in the vessel, the totals, and the molar route to c_p
 * (packages/subjects/src/thermo/mixtures.js).
 */
const SCENARIOS = [
  { id: 'co2', name: '1 kg of N₂ and 1 kg of CO₂', gasB: 'CO2', mA: 1, mB: 1, T: 300, V: 1 },
  { id: 'h2', name: '1 kg of N₂ and 0.1 kg of H₂', gasB: 'H2', mA: 1, mB: 0.1, T: 300, V: 1 },
  { id: 'argon', name: '1 kg of N₂ and 1 kg of Ar, hot', gasB: 'AR', mA: 1, mB: 1, T: 600, V: 1 },
  { id: 'methane', name: '1 kg of N₂ and 1 kg of CH₄', gasB: 'CH4', mA: 1, mB: 1, T: 300, V: 1 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, gasB: sc.gasB, mA: sc.mA, mB: sc.mB, T: sc.T, V: sc.V });
}

const KEYS = [['mx-ma', 'mA'], ['mx-mb', 'mB'], ['mx-t', 'T'], ['mx-v', 'V']];
const pct = (x) => `${fig(100 * x)}%`;
const kPa = (p) => `${fig(p / 1000)} kPa`;
const gmol = (M) => `${fig(1000 * M)} g/mol`;

/** A repeatable, even scatter: the k-th point of the R₂ sequence in the unit square. */
const spot = (k) => [(0.5 + k * 0.7548776662) % 1, (0.5 + k * 0.5698402910) % 1];

/** Three bars, each split between the two gases: by molecules, by mass, by pressure. */
function bars(B, rect, c, f) {
  const P = plotIn(B, rect, { lo: 0, hi: 1 }, { lo: 0, hi: 3.3 }, { left: 14, right: 14, top: 24, bottom: 14 });
  const rows = [
    ['molecules: mole fraction y', c.yA, c.yB],
    ['mass: mass fraction x', c.xA, c.xB],
    [`pressure: ${kPa(c.pA)} + ${kPa(c.pB)}`, c.pA / c.p, c.pB / c.p],
  ];
  rows.forEach(([name, a, b], k) => {
    const y0 = 2.35 - 1.1 * k;
    const y1 = y0 + 0.5;
    poly(P, [[0, y0], [a, y0], [a, y1], [0, y1]], { fill: alpha(C.teal, 0.75), stroke: null });
    poly(P, [[a, y0], [1, y0], [1, y1], [a, y1]], { fill: alpha(C.gold, 0.8), stroke: null });
    label(P, name, [0, y1], { color: C.text, align: 'left', dy: -10 });
    if (a > 0.12) label(P, pct(a), [a / 2, (y0 + y1) / 2], { color: C.bg, bold: true });
    if (b > 0.12) label(P, pct(b), [a + b / 2, (y0 + y1) / 2], { color: C.bg, bold: true });
  });
  // The tempting mistake: the second gas's mass share read as its share of the pressure.
  const yMis = 2.35 - 2.2 - 0.12;
  line(P, [[1 - c.xB, yMis], [1 - c.xB, yMis + 0.74]], { color: C.red, width: 2, dash: [4, 3] });
  label(P, `${f} by mass`, [1 - c.xB, yMis], { color: C.red, align: c.xB > 0.5 ? 'left' : 'right', dx: c.xB > 0.5 ? 4 : -4, dy: 6 });
}

export default defineLab({
  id: 'mixture',
  exam: 'u1',
  title: 'Mixture',
  hint: 'Mix equal masses of N₂ and CO₂ and compare the top two bars. Then swap in hydrogen: a sliver of the mass, most of the molecules. The pressure bar always matches the molecules.',
  gapLimit: 1e-12,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('co2', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'mB', lo: 0, hi: 5 }),
  controls() {
    return `
      <label class="field"><span>Second gas</span><select id="mx-g">${Object.entries(GASES).map(([id, g]) => `<option value="${id}">${g.name}, ${g.formula}</option>`).join('')}</select></label>
      ${slider('mx-ma', 'Nitrogen, N₂ (kg)', 1, 0.1, 5, 0.05)}
      ${slider('mx-mb', 'Second gas (kg)', 1, 0, 5, 0.05)}
      ${slider('mx-t', 'Temperature (K)', 300, 300, 1000, 10)}
      ${slider('mx-v', 'Vessel volume (m³)', 1, 0.5, 5, 0.1)}
      <p class="tiny">Ideal gases. Teal: nitrogen. Gold: the second gas. Each dot stands for the same number of molecules; a bigger dot is a heavier molecule. Red dashes: where the pressure split would fall if it went by mass.</p>`;
  },
  bind(api) {
    document.getElementById('mx-g')?.addEventListener('change', (e) => {
      api.slice().gasB = e.target.value;
      api.bump();
    });
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    const el = document.getElementById('mx-g');
    if (el) el.value = state.gasB;
    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    const r = mixtureChecked(state);
    return { ...r, heavier: r.MB > r.MA, pBkPa: r.pB / 1000, pkPa: r.p / 1000 };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const side = W > 1.1 * H;
    const share = side ? 0.42 : 0.5;
    const left = side ? { ...B.free, x1: B.free.x0 + share * W } : { ...B.free, y1: B.free.y0 + share * H };
    const right = side ? { ...B.free, x0: left.x1 } : { ...B.free, y0: left.y1 };
    const g = GASES[state.gasB];
    // The vessel, with 80 dots shared by mole fraction.
    const S = sceneIn(B, left, { x0: -0.08, x1: 1.08, y0: -0.16, y1: 1.12 }, 12);
    line(S, [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]], { color: alpha(C.text, 0.7), width: 2 });
    const total = 80;
    const nB = Math.round(total * c.yB);
    // Dot size in drawing units, so it scales with the vessel; a heavier molecule is a bigger dot.
    const size = (M) => Math.max(2, S.k * (0.01 + 0.017 * Math.sqrt(M / 0.044)));
    const rA = size(c.MA);
    const rB = size(c.MB);
    for (let k = 0; k < total; k++) {
      const [u, v] = spot(k + 1);
      // 37 is coprime with 80, so (37k mod 80) runs through every slot once: exactly nB gold dots, spread out.
      const isB = (37 * k) % total < nB;
      dot(S, 0.05 + 0.9 * u, 0.05 + 0.9 * v, { color: isB ? C.gold : C.teal, r: isB ? rB : rA });
    }
    label(S, `${fig(state.mA)} kg N₂ + ${fig(state.mB)} kg ${g.formula}, ${fig(state.T)} K`, [0.5, 1], { color: C.text, dy: -10 });
    label(S, `p = ${kPa(c.p)} in ${fig(state.V)} m³`, [0.5, 0], { color: C.muted, dy: 12 });
    bars(B, right, c, g.formula);
  },
  law: () => [String.raw`y_i = \frac{N_i}{N}, \quad x_i = \frac{m_i}{m}, \quad y_i = x_i\,\frac{M}{M_i}`, String.raw`p_i = y_i\,p = \frac{N_i \bar R T}{V}`, String.raw`M = \sum y_i M_i, \qquad c_p = \sum x_i\,c_{p,i}`],
  liveRows(state, c) {
    const f = GASES[state.gasB].formula;
    return [
      kv('Molar masses, N₂ and ' + f, `${gmol(c.MA)}, ${gmol(c.MB)}`),
      kv('Amounts', `${fig(c.NA)} mol, ${fig(c.NB)} mol`),
      kv(`Mole fraction of ${f}, and mass fraction`, `${pct(c.yB)}, ${pct(c.xB)}`),
      kv('Partial pressures', `${kPa(c.pA)}, ${kPa(c.pB)}`),
      kv(`${f}'s pressure if it went by mass`, kPa(c.pBmass)),
      kv('Mixture M and R', `${gmol(c.M)}, ${fig(c.R)} J/(kg·K)`),
      kv('c_p by mass, and by moles', `${fig(c.cp)}, ${fig(c.parts.cp)} J/(kg·K)`),
      kv('Each gas alone against y_i p', `${kPa(c.parts.pA)}, ${kPa(c.parts.pB)}`),
      kv('Largest difference, two routes', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    const f = GASES[state.gasB].formula;
    return cells([
      [`${f} by moles`, pct(c.yB)],
      [`${f} by mass`, pct(c.xB)],
      [`${f} pressure`, kPa(c.pB)],
      ['mixture M', gmol(c.M)],
    ]);
  },
  coach(state, c) {
    const f = GASES[state.gasB].formula;
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Real gases at high pressure, where the molecules' own size and attraction matter and partial pressures no longer add exactly; and moist air, where one component condenses.`;
    if (state.mB <= 0) {
      return { title: 'One gas', body: `With no ${f} the vessel holds nitrogen alone at ${kPa(c.p)}. Add some and watch its share of the molecules against its share of the mass. ${leavesOut}` };
    }
    if (c.MB > c.MA) {
      return { title: 'Heavy molecules, few of them', body: `${f} is ${pct(c.xB)} of the mass but only ${pct(c.yB)} of the molecules: each molecule weighs ${fig(c.MB / c.MA)} times a nitrogen molecule. Its partial pressure follows the molecules, ${kPa(c.pB)}, not the ${kPa(c.pBmass)} the mass share would give. ${leavesOut}` };
    }
    return { title: 'Light molecules, many of them', body: `${f} is only ${pct(c.xB)} of the mass but ${pct(c.yB)} of the molecules: each weighs ${fig(c.MB / c.MA)} of a nitrogen molecule. It pushes with ${kPa(c.pB)}, ${pct(c.yB)} of the total, against the ${kPa(c.pBmass)} the mass share would suggest. ${leavesOut}` };
  },
  app: false,
});
