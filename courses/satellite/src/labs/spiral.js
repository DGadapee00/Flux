import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { spiralChecked, spiralClosed } from '@flux/subjects/mechanics/propulsion.js';

/**
 * Electric spiral: a small craft raising or lowering its orbit with a power-limited electric
 * thruster.
 *
 * Shows the trade that defines electric propulsion. The jet carries ½ F u_e of power, so at a fixed
 * power F = 2ηP/u_e: doubling the specific impulse halves the propellant and doubles the time. The
 * array, not the tank, sets how fast the craft can move. A slow spiral needs exactly the difference
 * of the two circular speeds; the closed form for the time and propellant is checked by flying the
 * spiral, two-body plus thrust along the velocity (packages/subjects/src/mechanics/propulsion.js).
 *
 * The specific-impulse range is NASA's small spacecraft report's for gridded ion and Hall thrusters
 * (Table 4-1); the efficiency of 0.5 keeps thrust per power near the report's 75 mN/kW at 1500 s.
 * The craft's 12 kg and the powers are our own round figures.
 */
const SCENARIOS = [
  { id: 'raise', name: 'Raise 400 km to 550 km on 40 W at 1500 s', h1: 400, h2: 550, power: 40, isp: 1500, mass: 12 },
  { id: 'lower', name: 'Lower 550 km to 300 km for disposal', h1: 550, h2: 300, power: 40, isp: 1500, mass: 12 },
  { id: 'high', name: 'The raise at 3000 s', h1: 400, h2: 550, power: 40, isp: 3000, mass: 12 },
  { id: 'power', name: 'The raise on 100 W', h1: 400, h2: 550, power: 100, isp: 1500, mass: 12 },
];
const ETA = 0.5;

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, h1: sc.h1, h2: sc.h2, power: sc.power, isp: sc.isp, mass: sc.mass });
}

const SLIDERS = [['sp-1', 'h1'], ['sp-2', 'h2'], ['sp-p', 'power'], ['sp-i', 'isp'], ['sp-m', 'mass']];
const days = (d) => (d === null ? '—' : d < 2 ? `${fig(d * 24)} h` : `${fig(d)} days`);
const grams = (kg) => (kg < 1 ? `${fig(kg * 1000)} g` : `${fig(kg)} kg`);

export default defineLab({
  id: 'spiral',
  exam: 'u14',
  title: 'Electric spiral',
  hint: 'Double the specific impulse and watch the propellant halve while the trip takes twice as long. Then give the thruster more power: only that makes it faster without more propellant.',
  gapLimit: 1e-3,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('raise', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'isp', lo: 500, hi: 3000 }),
  controls() {
    return `
      ${slider('sp-1', 'Start altitude (km)', 400, 300, 1000, 10)}
      ${slider('sp-2', 'End altitude (km)', 550, 300, 1000, 10)}
      ${slider('sp-p', 'Power to the thruster (W)', 40, 10, 200, 5)}
      ${slider('sp-i', 'Specific impulse (s)', 1500, 500, 3000, 50)}
      ${slider('sp-m', 'Craft mass (kg)', 12, 4, 50, 1)}
      <p class="tiny">Thrust along the velocity, from circular orbit to circular orbit, at 50% efficiency.</p>`;
  },
  bind(api) {
    for (const [id, key] of SLIDERS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    for (const [id, key] of SLIDERS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    const c = spiralChecked({ ...state, eta: ETA });
    return { ...c, mN: c.F * 1000, flownDays: c.flown.days, flownMp: c.flown.mp, flownDv: c.flown.dv };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const both = H > 380 || (W > 1.5 * H && W > 560);
    const [top, bottom] = both ? split(B.free, 0.55) : [B.free, null];
    // The flight: altitude against days.
    const lo = Math.min(state.h1, state.h2) - 30;
    const hi = Math.max(state.h1, state.h2) + 30;
    const tEnd = Math.max(c.days, 0.01) * 1.08;
    const P = plotIn(B, top, { lo: 0, hi: tEnd }, { lo, hi });
    axes(P, { xLabel: 'days', yLabel: 'altitude (km)' });
    seg(P, [0, state.h2], [tEnd, state.h2], { color: alpha(C.muted, 0.8), width: 1, dash: [5, 4] });
    if (c.flown.path.length) line(P, c.flown.path, { color: C.teal, width: 2 });
    dot(P, c.days, state.h2, { color: C.gold, r: 5 });
    label(P, `${days(c.days)}, ${grams(c.mp)}`, [c.days, state.h2], { color: C.gold, align: 'right', dx: -8, dy: state.h2 > state.h1 ? 14 : -12 });
    if (!bottom) return;
    // The trade at this power: days and propellant against specific impulse.
    const isps = Array.from({ length: 101 }, (_, i) => 500 + 25 * i);
    const rows = isps.map((isp) => spiralClosed({ ...state, isp, eta: ETA }));
    const dMax = Math.max(...rows.map((r) => r.days)) * 1.1;
    const Q = plotIn(B, bottom, { lo: 500, hi: 3000 }, { lo: 0, hi: dMax }, { left: 52, right: 16, top: 22, bottom: 40 });
    axes(Q, { xLabel: 'specific impulse (s)', yLabel: 'days' });
    line(Q, isps.map((isp, i) => [isp, rows[i].days]), { color: C.teal, width: 2 });
    const mMax = Math.max(...rows.map((r) => r.mp));
    line(Q, isps.map((isp, i) => [isp, (rows[i].mp / mMax) * dMax * 0.9]), { color: C.pink, width: 2, dash: [6, 4] });
    dot(Q, state.isp, c.days, { color: C.gold, r: 4 });
    label(Q, 'days', [3000, rows[rows.length - 1].days], { color: C.teal, align: 'right', dy: -10 });
    label(Q, `propellant, ${grams(mMax)} at 500 s`, [500, dMax * 0.9], { color: C.pink, align: 'left', dx: 8, dy: -10 });
  },
  law: () => [
    String.raw`F = \frac{2\eta P}{u_e}, \qquad \Delta v = \left|\sqrt{\tfrac{\mu}{r_1}} - \sqrt{\tfrac{\mu}{r_2}}\right|`,
    String.raw`t = \frac{m_0 u_e}{F}\left(1 - e^{-\Delta v/u_e}\right)`,
  ],
  liveRows(state, c) {
    return [
      kv('Thrust', `${fig(c.mN)} mN, ${fig(c.perKW)} mN/kW`),
      kv('Δv, closed and flown', `${fig(c.dv)}, ${fig(c.flown.dv)} m/s`),
      kv('Time, closed and flown', `${days(c.days)}, ${days(c.flown.days)}`),
      kv('Propellant, closed and flown', `${grams(c.mp)}, ${grams(c.flown.mp)}`),
      kv('Two methods differ by', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['thrust', `${fig(c.mN)} mN`],
      ['time', days(c.days)],
      ['propellant', grams(c.mp)],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Eclipses, when the array gives nothing and the thruster stops; drag, which slows a raise and speeds a descent; the power the craft's other loads take; plane changes; and the thruster's start-up and lifetime limits.`;
    if (state.h1 === state.h2) return { title: 'No change', body: `Start and end at the same altitude. ${leavesOut}` };
    return {
      title: `${days(c.days)} on ${fig(c.mN)} mN`,
      body: `${fig(state.power)} W at ${fig(state.isp)} s gives ${fig(c.mN)} mN. The spiral needs ${fig(c.dv)} m/s, the difference of the two circular speeds, and uses ${grams(c.mp)} of propellant. Doubling the specific impulse would halve the propellant and double the time; only more power makes it faster without costing propellant. ${leavesOut}`,
    };
  },
  app: false,
});
