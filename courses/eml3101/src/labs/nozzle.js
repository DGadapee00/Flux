import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { NOZZLE, area, criticalPressures, nozzleFlow } from '@flux/subjects/thermo/nozzle.js';
import { areaRatio, machFromArea, pressureRatio } from '@flux/subjects/thermo/isentropic.js';

/**
 * Nozzle: a converging–diverging nozzle from a 500 kPa, 300 K reservoir of air, with a slider for the
 * back pressure, and the pressure and Mach number drawn along it.
 *
 * Shows that lowering the back pressure pulls more gas through only until the throat is sonic: below
 * 469 kPa the mass flow stays at 1.17 kg/s. Lower still and a normal shock enters the diverging part,
 * dropping the flow to subsonic and costing stagnation pressure, and walks to the exit as p_b falls.
 * Each station's ρVA is checked against the closed-form mass flow, and the shock's stagnation loss
 * two ways (packages/subjects/src/thermo/nozzle.js).
 */
const P0 = 500; // kPa
const CRIT = criticalPressures();
const SCENARIOS = [
  { id: 'subsonic', name: 'Subsonic all the way, p_b = 485 kPa', pb: 485 },
  { id: 'shock', name: 'Choked, a shock in the nozzle, p_b = 400 kPa', pb: 400 },
  { id: 'over', name: 'Supersonic to the exit, p_b = 150 kPa', pb: 150 },
  { id: 'design', name: 'The design pressure, p_b = 47 kPa', pb: Number((P0 * CRIT.pDesign).toFixed(2)) },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, pb: sc.pb });
}

const REGIME = {
  still: 'No flow: the back pressure equals the reservoir’s',
  subsonic: 'Subsonic all the way: not choked',
  shock: 'Choked, with a normal shock in the nozzle',
  over: 'Choked, supersonic exit: over-expanded',
  design: 'Choked, supersonic exit at the design pressure',
  under: 'Choked, supersonic exit: under-expanded',
};
const kPa = (x) => `${fig(x)} kPa`;

/** Mass flow against back pressure, as a share of the choked flow: A-star over A_t below choking, 1 once choked. */
const MDOT_CURVE = Array.from({ length: 201 }, (_, i) => {
  const r = i / 200;
  if (r <= CRIT.p1) return [r, 1];
  if (r >= 1) return [r, 0];
  const Me = Math.sqrt(5 * (r ** (-0.4 / 1.4) - 1));
  return [r, NOZZLE.Ae / areaRatio(Me) / NOZZLE.At];
});

/** p/p₀ along the nozzle, with the two isentropic branches dashed and the nozzle's shape behind. */
function pressurePlot(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 0, hi: 1 }, { lo: 0, hi: 1.08 });
  axes(P, { xLabel: 'distance along the nozzle', yLabel: 'p / p₀' });
  // The nozzle's walls, faint, scaled to fill the plot's height.
  const rmax = Math.sqrt(NOZZLE.Ai);
  const wall = (s) => c.xs.map((x) => [x, 0.54 + s * 0.5 * (Math.sqrt(area(x)) / rmax)]);
  poly(P, [...wall(1), ...wall(-1).reverse()], { fill: alpha(C.muted, 0.06), stroke: alpha(C.muted, 0.25), width: 1 });
  seg(P, [NOZZLE.xt, 0], [NOZZLE.xt, 1.08], { color: alpha(C.muted, 0.4), width: 1, dash: [2, 3] });
  label(P, 'throat', [NOZZLE.xt, 0], { color: C.muted, align: 'left', dx: 4, dy: -10 });
  // The isentropic branches with a sonic throat.
  const branch = (kind) => c.xs.filter((x) => x >= NOZZLE.xt).map((x) => [x, pressureRatio(machFromArea(area(x) / NOZZLE.At, kind))]);
  line(P, branch('subsonic'), { color: alpha(C.blue, 0.6), width: 1.2, dash: [5, 4] });
  line(P, branch('supersonic'), { color: alpha(C.blue, 0.6), width: 1.2, dash: [5, 4] });
  // The flow, split at the shock so the jump is drawn as a jump.
  const pts = c.xs.map((x, i) => [x, c.p[i]]);
  if (c.shock) {
    const k = c.xs.findIndex((x) => x > c.shock.x);
    line(P, pts.slice(0, k), { color: C.gold, width: 2.5 });
    line(P, pts.slice(k), { color: C.gold, width: 2.5 });
    const before = pressureRatio(c.shock.M1);
    seg(P, [c.shock.x, before], [c.shock.x, before * (1 + 2.8 / 2.4 * (c.shock.M1 ** 2 - 1))], { color: C.red, width: 3 });
    label(P, `shock, M ${fig(c.shock.M1)} → ${fig(c.shock.M2)}`, [c.shock.x, before], { color: C.red, align: c.shock.x > 0.75 ? 'right' : 'left', dx: c.shock.x > 0.75 ? -8 : 8, dy: 12 });
  } else line(P, pts, { color: C.gold, width: 2.5 });
  dot(P, 1, state.pb / P0, { color: C.pink, r: 5 });
  label(P, 'p_b', [1, state.pb / P0], { color: C.pink, align: 'right', dx: -8, dy: -10 });
  label(P, REGIME[c.regime], [0, 1.08], { color: c.choked ? C.green : C.text, align: 'left', dx: 4, dy: 10 });
}

/** Mass flow against back pressure, with the three critical pressures marked. */
function flowPlot(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 0, hi: P0 }, { lo: 0, hi: 1.25 * c.mdotChoked });
  axes(P, { xLabel: 'back pressure p_b (kPa)', yLabel: 'mass flow (kg/s)' });
  for (const [r, name] of [[CRIT.p1, 'chokes'], [CRIT.p2, 'shock at exit'], [CRIT.pDesign, 'design']]) {
    seg(P, [P0 * r, 0], [P0 * r, 1.25 * c.mdotChoked], { color: alpha(C.muted, 0.5), width: 1, dash: [3, 3] });
    label(P, name, [P0 * r, 1.25 * c.mdotChoked], { color: C.muted, align: name === 'chokes' ? 'right' : 'left', dx: name === 'chokes' ? -4 : 4, dy: 10 });
  }
  line(P, MDOT_CURVE.map(([r, f]) => [P0 * r, f * c.mdotChoked]), { color: C.teal, width: 2.5 });
  dot(P, state.pb, c.mdot, { color: C.pink, r: 6, ring: C.text });
}

export default defineLab({
  id: 'nozzle',
  exam: 'u2',
  title: 'Nozzle',
  hint: 'Lower the back pressure from 500 kPa. The mass flow climbs, then stops at 469 kPa however far you go. Keep going and watch a shock walk from the throat to the exit.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('subsonic', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'pb', lo: 10, hi: 500 }),
  controls() {
    return `
      ${slider('nz-pb', 'Back pressure p_b (kPa)', 485, 10, 500, 0.5)}
      <p class="tiny">Air from a reservoir at p₀ = ${P0} kPa and T₀ = 300 K, γ = 1.4. Throat 10 cm², inlet 2.5 and exit 2 times the throat. Gold: p/p₀ along the nozzle. Blue dashes: the isentropic curves with a sonic throat, subsonic above and supersonic below. Grey: the nozzle’s shape.</p>`;
  },
  bind(api) {
    bindSlider('nz-pb', (s, v) => { s.pb = v; }, api);
  },
  syncControls(state) {
    const e = document.getElementById('nz-pb');
    if (e && document.activeElement !== e) e.value = String(state.pb);
  },
  compute(state) {
    const r = nozzleFlow({ pb: state.pb / P0, p0: P0 * 1000 });
    return { ...r, shockX: r.shock ? r.shock.x : null, chokedFlag: r.choked };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      pressurePlot(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.58 * W } : { ...B.free, y1: B.free.y0 + 0.56 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    pressurePlot(B, a, state, c);
    flowPlot(B, b, state, c);
  },
  law: () => [String.raw`\frac{T_0}{T} = 1 + \frac{\gamma - 1}{2}M^2`, String.raw`\frac{A}{A^*} = \frac{1}{M}\left[\frac{2}{\gamma+1}\left(1 + \frac{\gamma-1}{2}M^2\right)\right]^{\frac{\gamma+1}{2(\gamma-1)}}`, String.raw`\dot m_\text{choked} = A_t\,p_0\sqrt{\frac{\gamma}{RT_0}}\left(\frac{2}{\gamma+1}\right)^{\frac{\gamma+1}{2(\gamma-1)}}`, String.raw`M_2^2 = \frac{1 + \frac{\gamma-1}{2}M_1^2}{\gamma M_1^2 - \frac{\gamma-1}{2}}`],
  liveRows(state, c) {
    return [
      kv('Chokes, shock at exit, design', `${fig(P0 * CRIT.p1)}, ${fig(P0 * CRIT.p2)}, ${fig(P0 * CRIT.pDesign)} kPa`),
      kv('Mass flow, choked limit', `${fig(c.mdot)}, ${fig(c.mdotChoked)} kg/s`),
      kv('Mach number at the throat, at the exit', `${fig(c.M[Math.round(NOZZLE.xt * (c.xs.length - 1))])}, ${fig(c.Me)}`),
      kv('Exit pressure', kPa(P0 * c.pe)),
      kv('Shock', c.shock ? `at ${fig(100 * c.shock.x)}% of the length, M ${fig(c.shock.M1)} → ${fig(c.shock.M2)}` : 'none in the nozzle'),
      kv('Stagnation pressure lost', c.shock ? `${fig(100 * c.p0loss)}%` : '0'),
      kv('ρVA at every station against ṁ', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['mass flow', `${fig(c.mdot)} kg/s`],
      ['exit Mach', fig(c.Me)],
      ['choked', c.choked ? 'yes' : 'no'],
      ['p₀ lost', c.shock ? `${fig(100 * c.p0loss)}%` : '0'],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Friction and heat transfer along the walls, a shock that interacts with the boundary layer and lets the flow separate, and the oblique shocks and expansion fans outside an over- or under-expanded nozzle.`;
    if (!c.choked) {
      return { title: 'Not choked yet', body: `At p_b = ${kPa(state.pb)} the flow stays subsonic everywhere, reaching only Mach ${fig(Math.max(...c.M))} at the throat, and ${fig(c.mdot)} kg/s goes through. Lower p_b and the flow rises, until the throat reaches Mach 1 at ${kPa(P0 * CRIT.p1)}. ${leavesOut}` };
    }
    if (c.shock) {
      return { title: 'Choked: the shock does the rest', body: `The throat is sonic, so ${fig(c.mdot)} kg/s goes through whatever p_b is. Past the throat the flow speeds up to Mach ${fig(c.shock.M1)}, then a normal shock drops it to ${fig(c.shock.M2)} and raises the pressure, at the cost of ${fig(100 * c.p0loss)}% of the stagnation pressure, so the subsonic flow behind it can meet ${kPa(state.pb)}. A shock slows the gas; it never speeds it up. ${leavesOut}` };
    }
    return { title: 'Choked, supersonic to the exit', body: `The nozzle runs supersonic to its exit at Mach ${fig(c.Me)} and ${kPa(P0 * c.pe)}, and ${fig(c.mdot)} kg/s goes through, the same as at ${kPa(P0 * CRIT.p1)}. ${c.regime === 'design' ? 'The exit pressure matches p_b: the jet leaves straight.' : c.regime === 'over' ? `p_b is higher than the exit pressure: shocks outside the nozzle bring the jet up to ${kPa(state.pb)}.` : 'p_b is lower than the exit pressure: the jet expands further outside.'} ${leavesOut}` };
  },
  app: false,
});
