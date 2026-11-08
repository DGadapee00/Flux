import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { SAT, WALL, boilChecked, boilCurve, condensing } from '@flux/subjects/heat/boiling.js';

/**
* Boil: water at 1 atm against a wall hotter or colder than 100 °C, with a slider for the
 * difference, the boiling curve or the condensate film drawn.
 *
 * Shows that a hotter wall does not always boil faster: the flux climbs as ΔT³ to 1.26 MW/m² at 21 K,
 * then a vapour film starts to cover the wall and at 71 K the flux is down to 19 kW/m². Condensing,
 * h is 12 000 W/(m²·K) at 10 K and falls as ΔT grows, because the film thickens. The film formulas
 * are checked by growing the film along the wall numerically (packages/subjects/src/heat/boiling.js).
 */
const SCENARIOS = [
  {
    id: 'nucleate',
    name: 'Nucleate boiling, 10 K',
    side: 'boil',
    le: 1
  },
  {
    id: 'peak',
    name: 'Near the critical flux, 20 K',
    side: 'boil',
    le: 1.301
  },
  {
    id: 'film',
    name: 'Film boiling, 300 K',
    side: 'boil',
    le: 2.477
  },
  {
    id: 'condense',
    name: 'Steam condensing on a wall at 90 °C',
    side: 'condense',
    le: 1
  }
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, side: sc.side, le: sc.le });
}

const KEYS = [['bo-t', 'le']];

const dTof = (state) => (state.side === 'condense' ? Math.min(10 ** state.le, 100) : 10 ** state.le);
const kw = (q) => (q >= 1e6 ? `${fig(q / 1e6)} MW/m²` : `${fig(q / 1000)} kW/m²`);

function curve(B, rect, state, c) {
  if (state.side === 'condense') return film(B, rect, state, c);
  const P = plotIn(B, rect, { lo: 4, hi: 1200, log: true }, { lo: 1e3, hi: 4e6, log: true });
  axes(P, { xLabel: 'excess temperature ΔT_e (K)', yLabel: 'heat flux (W/m²)' });
  const pts = Array.from({ length: 161 }, (_, i) => {
    const d = 5 * 10 ** ((Math.log10(1000 / 5) * i) / 160);
    return [d, boilCurve(d).q];
  });
  line(P, pts, { color: C.gold, width: 2.5 });
  dot(P, c.dTc, c.qc, { color: C.red, r: 4 });
  label(P, `critical flux ${kw(c.qc)}`, [c.dTc, c.qc], { color: C.red, align: 'left', dx: 8, dy: -8 });
  dot(P, c.dTl, c.qm, { color: C.blue, r: 4 });
  label(P, 'Leidenfrost point', [c.dTl, c.qm], { color: C.blue, align: 'left', dx: 6, dy: 14 });
  dot(P, c.dT, c.q, { color: C.pink, r: 6, ring: C.text });
}

function film(B, rect, state, c) {
  const L = WALL.L * 1000;
  const dmax = c.delta * 1000 * 1.4;
  const P = plotIn(B, rect, { lo: 0, hi: dmax }, { lo: 0, hi: L });
  axes(P, { xLabel: 'film thickness (mm)', yLabel: 'height above the bottom of the wall (mm)' });
  const pts = Array.from({ length: 101 }, (_, i) => [c.delta * 1000 * (i / 100) ** 0.25, L - (L * i) / 100]);
  poly(P, [[0, L], ...pts, [0, 0]], { fill: alpha(C.blue, 0.3), stroke: null });
  line(P, pts, { color: C.blue, width: 2.5 });
  label(P, `${fig(c.delta * 1e6)} µm`, [c.delta * 1000, 0], { color: C.blue, align: 'left', dx: 6, dy: -10 });
}

function coeff(B, rect, state, c) {
  const cond = state.side === 'condense';
  const lo = 5;
  const hi = cond ? 100 : 1000;
  const P = plotIn(B, rect, { lo, hi, log: true }, { lo: cond ? 3000 : 100, hi: cond ? 3e4 : 1e5, log: true });
  axes(P, { xLabel: 'ΔT (K)', yLabel: 'h (W/(m²·K))' });
  const pts = Array.from({ length: 121 }, (_, i) => {
    const d = lo * 10 ** ((Math.log10(hi / lo) * i) / 120);
    return [d, cond ? condensing(d).h : boilCurve(d).q / d];
  });
  line(P, pts, { color: cond ? C.blue : C.gold, width: 2.5 });
  dot(P, c.dT, c.h, { color: C.pink, r: 6, ring: C.text });
  label(P, `h = ${fig(c.h)}`, [c.dT, c.h], { color: C.text, align: 'left', dx: 8, dy: -8 });
}

export default defineLab({
  id: 'boil',
  exam: 'u3',
  title: 'Boil',
  hint: 'Walk the wall from 5 K to 1000 K hotter than the water. Past 21 K, read the flux: it falls before it rises again. Then switch to condensing.',
  gapLimit: 1e-3,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('nucleate', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'le', lo: 0.7, hi: 3 }),
  controls() {
    return `
      <label class="field"><span>The wall is</span><select id="bo-side">${[['boil', 'hotter than the water: boiling'], ['condense', 'colder than the steam: condensing']].map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></label>
      ${slider('bo-t', "Wall temperature difference, log₁₀(ΔT / 1 K)", 1, 0.7, 3, 0.01)}
      <p class="tiny">Water and steam at 100 °C and 1 atm. Boiling: nucleate (Rohsenow, C_sf = 0.013), the critical flux (Zuber), transition, then a vapour film on a vertical wall 0.1 m tall. Condensing: a falling liquid film on the same wall, ΔT up to 100 K. Left: the boiling curve, or the film’s thickness down the wall. Right: h against ΔT.</p>`;
  },
  bind(api) {
    document.getElementById('bo-side')?.addEventListener('change', (e) => {
      api.slice().side = e.target.value;
      api.bump();
    });
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    {
      const el = document.getElementById('bo-side');
      if (el) el.value = String(state.side);
    }
    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    return boilChecked({ side: state.side, dT: dTof(state) });
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      curve(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    curve(B, a, state, c);
    coeff(B, b, state, c);
  },
  law: () => [String.raw`q''_\text{max} = 0.149\,h_{fg}\,\rho_v\left[\frac{\sigma g(\rho_l - \rho_v)}{\rho_v^2}\right]^{1/4}`, String.raw`\overline{h} = 0.943\left[\frac{g\rho_l(\rho_l - \rho_v)h'_{fg}k_l^3}{\mu_l\,\Delta T\,L}\right]^{1/4}`],
  liveRows(state, c) {
    return [
      kv('ΔT and regime', `${fig(c.dT)} K, ${c.regime}`),
      kv('Heat flux', kw(c.q)),
      kv('h', `${fig(c.h)} W/(m²·K)`),
      kv('Critical flux, at', `${kw(c.qc)}, ${fig(c.dTc)} K`),
      kv('Film formula against the grown film', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['flux', kw(c.q)], ['h', `${fig(c.h)} W/(m²·K)`], ['regime', c.regime], ['ΔT', `${fig(c.dT)} K`]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Nucleate boiling depends strongly on the surface: its roughness, what it is made of and how clean it is. A wall hundreds of kelvin hot also radiates across the vapour film. The transition branch is drawn as a straight line between its ends on log axes.`;
    if (state.side === 'condense') return { title: 'Condensing: a thin film, a huge h', body: `Steam condenses on the ${fig(SAT.T - c.dT)} °C wall into a film ${fig(c.delta * 1e6)} µm thick at the bottom. h is ${fig(c.h)} W/(m²·K), hundreds of times that of air. A colder wall condenses more steam, so the film thickens and h falls, though the flux, ${kw(c.q)}, still rises. <b>What the course model leaves out.</b> Ripples and waves on a longer film raise h, and a little air mixed into the steam lowers it sharply.` };
    if (c.regime === 'nucleate') return { title: 'Nucleate boiling: flux as ΔT³', body: `At ${fig(c.dT)} K bubbles form at sites on the wall and stir the liquid: the flux is ${kw(c.q)} and climbs as ΔT³ to the critical ${kw(c.qc)} at ${fig(c.dTc)} K. ${leavesOut}` };
    if (c.regime === 'transition') return { title: 'Past the peak, the flux falls', body: `At ${fig(c.dT)} K vapour patches cover part of the wall and insulate it: the flux is ${kw(c.q)}, down from ${kw(c.qc)} at ${fig(c.dTc)} K. A wall heated by a fixed power here jumps to the film branch, hundreds of kelvin hotter: burnout. ${leavesOut}` };
    return { title: 'Film boiling: heat crosses vapour', body: `At ${fig(c.dT)} K a vapour film blankets the wall and the heat must conduct across it: h is only ${fig(c.h)} W/(m²·K). The flux, ${kw(c.q)}, rises slowly with ΔT. ${leavesOut}` };
  },
  app: false,
});
