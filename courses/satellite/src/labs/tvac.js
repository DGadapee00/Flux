import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { PLATEAU_H, tvacChecked } from '@flux/subjects/heat/tvac.js';
import { FINISHES } from '@flux/subjects/heat/spacecraft.js';

/**
 * Thermal vacuum: one cycle of a test article between its cold and hot plateaus in a vacuum chamber,
 * and the days a campaign of cycles takes.
 *
 * Shows that a thermal vacuum test is long, and why. In vacuum the article exchanges heat only by
 * radiation with the shroud, so its thermal mass and its emissivity set how fast it moves: a craft
 * twice as heavy takes twice as long, and a shiny one ten times longer than a black one. Cooling is
 * slower than heating, because radiation falls as T⁴ at the cold end. Driving the shroud further past
 * the plateau speeds the move but raises the rate of change, which GEVS keeps below 1 °C a minute. At
 * system level the plateaus, 24 hours each, are most of each cycle. The transition time in closed
 * form is checked by stepping the article with RK4 (packages/subjects/src/heat/tvac.js).
 *
 * Plateaus are the 0 to 50 °C operating range widened by GEVS's 10 °C protoflight margin; plateau
 * hours, cycle counts and the 1 °C/min limit are GEVS Table 2.6-1. The articles' masses, areas and
 * dissipations and the chamber's range are our own round figures.
 */
export const ARTICLES = Object.freeze({
  u3: { name: '3U CubeSat, 4 kg', m: 4, A: 0.156, Q: 5 },
  u6: { name: '6U CubeSat, 12 kg', m: 12, A: 0.27, Q: 10 },
  ss: { name: 'Small satellite, 50 kg', m: 50, A: 1.5, Q: 40 },
});
const AFT = [0, 50];
const MARGIN = 10;
const RATE_LIMIT = 1; // °C/min, GEVS Table 2.6-1
const K0 = 273.15;

const SCENARIOS = [
  { id: 'six', name: 'A 6U CubeSat, four cycles at system level', article: 'u6', m: 12, Q: 10, finish: 'black', overdrive: 20, level: 'system', cycles: 4 },
  { id: 'twelve', name: 'The same craft, all twelve cycles at system level', article: 'u6', m: 12, Q: 10, finish: 'black', overdrive: 20, level: 'system', cycles: 12 },
  { id: 'hard', name: 'The shroud driven 50 °C past each plateau', article: 'u6', m: 12, Q: 10, finish: 'black', overdrive: 50, level: 'system', cycles: 4 },
  { id: 'bare', name: 'A polished aluminium craft, powered off', article: 'u6', m: 12, Q: 0, finish: 'aluminium', overdrive: 20, level: 'system', cycles: 4 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, article: sc.article, m: sc.m, Q: sc.Q, finish: sc.finish, overdrive: sc.overdrive, level: sc.level, cycles: sc.cycles });
}

const SLIDERS = [['tv-m', 'm'], ['tv-q', 'Q'], ['tv-o', 'overdrive'], ['tv-n', 'cycles']];
const SELECTS = [['tv-a', 'article'], ['tv-f', 'finish'], ['tv-l', 'level']];
const LEVELS = { unit: 'Unit, 4 h plateaus', subsystem: 'Subsystem, 12 h plateaus', system: 'System, 24 h plateaus' };
const hours = (h) => (h === null ? 'never' : h < 1 ? `${fig(h * 60)} min` : `${fig(h)} h`);

function params(state) {
  const a = ARTICLES[state.article];
  return { m: state.m, A: a.A, eps: FINISHES[state.finish].eps, Q: state.Q, aftLo: AFT[0], aftHi: AFT[1], margin: MARGIN, overdrive: state.overdrive, level: state.level, cycles: state.cycles };
}

export default defineLab({
  id: 'tvac',
  exam: 'u13',
  title: 'Thermal vacuum',
  hint: 'Double the mass and watch both transitions double. Then switch the finish to polished aluminium and watch a cycle stretch past a week.',
  gapLimit: 1e-4,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('six', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'overdrive', lo: 5, hi: 80 }),
  controls() {
    const opt = (o) => Object.entries(o).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
    return `
      <label class="field"><span>Test article</span><select id="tv-a">${opt(Object.fromEntries(Object.entries(ARTICLES).map(([k, a]) => [k, a.name])))}</select></label>
      <label class="field"><span>Outer finish</span><select id="tv-f">${opt(Object.fromEntries(Object.entries(FINISHES).map(([k, f]) => [k, `${f.name}, ε = ${f.eps}`])))}</select></label>
      <label class="field"><span>Level of assembly</span><select id="tv-l">${opt(LEVELS)}</select></label>
      ${slider('tv-m', 'Mass (kg)', 12, 1, 100, 1)}
      ${slider('tv-q', 'Power dissipated in test (W)', 10, 0, 60, 1)}
      ${slider('tv-o', 'Shroud driven past the plateau (°C)', 20, 5, 80, 1)}
      ${slider('tv-n', 'Cycles', 4, 1, 12, 1)}
      <p class="tiny">Plateaus at −10 and 60 °C: the 0 to 50 °C operating range with GEVS's 10 °C margin. The shroud runs from −180 to 150 °C, and holds the article once it arrives.</p>`;
  },
  bind(api) {
    for (const [id, key] of SELECTS) {
      document.getElementById(id)?.addEventListener('change', (e) => {
        const s = api.slice();
        s[key] = e.target.value;
        if (key === 'article') {
          s.m = ARTICLES[s.article].m;
          s.Q = ARTICLES[s.article].Q;
        }
        api.bump();
      });
    }
    for (const [id, key] of SLIDERS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    for (const [id, key] of [...SELECTS, ...SLIDERS]) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    const c = tvacChecked(params(state));
    return {
      ...c,
      heatH: c.heat.hours ?? null,
      coolH: c.cool.hours ?? null,
      withinRate: c.peakRate <= RATE_LIMIT,
      transitionShare: c.reachable ? (c.heat.hours + c.cool.hours) / c.cycleH : null,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const lo = AFT[0] - MARGIN;
    const hi = AFT[1] + MARGIN;
    if (!c.reachable) {
      const P = plotIn(B, B.free, { lo: 0, hi: 1 }, { lo: lo - 40, hi: hi + 40 });
      axes(P, { xLabel: '', yLabel: 'temperature (°C)', xFmt: () => '' });
      label(P, 'The chamber cannot hold this article at both plateaus', [0.5, (lo + hi) / 2], { color: C.red, align: 'center' });
      return;
    }
    const total = c.cycleH;
    const P = plotIn(B, B.free, { lo: 0, hi: total }, { lo: lo - 40, hi: hi + 40 });
    axes(P, { xLabel: 'hours, one cycle', yLabel: 'temperature (°C)' });
    // The operating range, and the plateaus with GEVS's margin.
    poly(P, [[0, AFT[0]], [total, AFT[0]], [total, AFT[1]], [0, AFT[1]]], { fill: alpha(C.green, 0.1), stroke: null });
    for (const T of [lo, hi]) seg(P, [0, T], [total, T], { color: alpha(C.muted, 0.8), width: 1, dash: [5, 4] });
    const t1 = c.heat.hours;
    const t2 = t1 + c.soak;
    const t3 = t2 + c.cool.hours;
    // The shroud: driven past each plateau, then holding.
    const sh = (K) => K - K0;
    line(P, [[0, sh(c.heat.Ts)], [t1, sh(c.heat.Ts)], [t1, sh(c.holdHot)], [t2, sh(c.holdHot)], [t2, sh(c.cool.Ts)], [t3, sh(c.cool.Ts)], [t3, sh(c.holdCold)], [total, sh(c.holdCold)]].map(([t, T]) => [t, Math.max(lo - 40, Math.min(hi + 40, T))]), { color: alpha(C.blue, 0.8), width: 1.5, dash: [3, 3] });
    // The article.
    const heatPts = c.traceHeat.map(([t, T]) => [t, T - K0]);
    const coolPts = c.traceCool.map(([t, T]) => [t2 + t, T - K0]);
    line(P, [...heatPts, [t2, hi], ...coolPts, [total, lo]], { color: C.gold, width: 2.5 });
    label(P, `heat ${hours(c.heat.hours)}`, [t1, hi], { color: C.gold, align: 'left', dx: 6, dy: -10 });
    label(P, `cool ${hours(c.cool.hours)}`, [t3, lo], { color: C.gold, align: 'left', dx: 6, dy: -12 });
    label(P, 'shroud', [t2, Math.max(lo - 40, sh(c.cool.Ts))], { color: C.blue, align: 'right', dx: -6, dy: 4 });
  },
  law: () => [
    String.raw`m c\,\frac{dT}{dt} = \varepsilon\sigma A\,(a^4 - T^4), \quad a^4 = T_s^4 + \frac{Q}{\varepsilon\sigma A}`,
    String.raw`t = \frac{m c}{\varepsilon\sigma A}\left[F(T_1) - F(T_0)\right]`,
  ],
  liveRows(state, c) {
    const deg = (K) => (K === null ? 'out of range' : `${fig(K - K0)} °C`);
    return [
      kv('Plateaus', `${fig(c.Tc - K0)} and ${fig(c.Th - K0)} °C`),
      kv('Heating, closed and RK4', c.reachable ? `${hours(c.heat.hours)}, ${hours(c.heatStep)}` : hours(c.heat.hours)),
      kv('Cooling, closed and RK4', c.reachable ? `${hours(c.cool.hours)}, ${hours(c.coolStep)}` : hours(c.cool.hours)),
      kv('Fastest change', `${fig(c.peakRate)} °C/min`),
      kv('Shroud to hold hot, cold', `${deg(c.holdHot)}, ${deg(c.holdCold)}`),
      kv('Plateau length', `${c.soak} h each`),
      kv('One cycle', hours(c.cycleH)),
      kv('Campaign', c.reachable ? `${fig(c.campaignDays)} days` : 'cannot be run'),
      kv('Two methods differ by', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['cycle', hours(c.cycleH)],
      ['campaign', c.reachable ? `${fig(c.campaignDays)} days` : 'not possible'],
      ['fastest', `${fig(c.peakRate)} °C/min`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Conduction through the mounting plate; temperature differences inside the article; a shroud that ramps rather than steps; the time to pump down and to settle within GEVS's stabilisation rule; and thermal balance phases, which add their own plateaus.`;
    if (!c.reachable) {
      return { title: 'The chamber cannot get there', body: `Dissipating ${fig(state.Q)} W through a surface with ε = ${FINISHES[state.finish].eps}, the article cannot radiate enough to reach ${fig(c.Tc - K0)} °C even with the shroud at its coldest, or the hot plateau needs a shroud beyond the chamber. Lower the power in the cold phase, or add overdrive. ${leavesOut}` };
    }
    if (!c.withinRate) {
      return { title: 'Too fast for GEVS', body: `With the shroud ${fig(state.overdrive)} °C past each plateau, the article changes ${fig(c.peakRate)} °C a minute at the start of a transition, above GEVS's 1 °C/min. Fast changes stress joints and boards more than the flight ever will. Reduce the overdrive or ramp the shroud. ${leavesOut}` };
    }
    const share = c.transitionShare;
    return {
      title: `${fig(c.campaignDays)} days for ${state.cycles} cycles`,
      body: `Heating takes ${hours(c.heat.hours)} and cooling ${hours(c.cool.hours)}: radiation falls as T⁴, so the cold end is slow. ${share < 0.2 ? `The ${c.soak} h plateaus are ${fig(100 * (1 - share))}% of each cycle, so the transitions barely set the schedule.` : `The transitions are ${fig(100 * share)}% of each cycle: a heavier or shinier article stretches the campaign.`} ${leavesOut}`,
    };
  },
  app: false,
});
