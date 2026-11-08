import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { BUS, ageChecked, ageClosed } from '@flux/subjects/em/ageing.js';

/**
* Ageing: a battery cycled once per orbit and a solar array losing power each year, with sliders for
 * the battery's size and the mission's length, capacity, depth of discharge and array power drawn.
 *
 * Shows why power systems are sized for end of life: a 100 Wh battery covering a 35 Wh eclipse starts
 * at 35% depth and is exhausted in under three years, because each cycle deepens the next. A 175 Wh
 * battery, starting at 20%, still has 132 Wh after five years. The array's 160 W falls to 121 W in ten
 * years. The closed form for the fading battery is checked by marching it cycle by cycle
 * (packages/subjects/src/em/ageing.js).
 */
const SCENARIOS = [
  { id: 'sized', name: '175 Wh battery, 5 years', C0: 175, years: 5 },
  { id: 'small', name: '100 Wh battery, 5 years', C0: 100, years: 5 },
  { id: 'long', name: '175 Wh battery, 10 years', C0: 175, years: 10 },
  { id: 'big', name: '300 Wh battery, 15 years', C0: 300, years: 15 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, C0: sc.C0, years: sc.years });
}

const KEYS = [['ag-c', 'C0'], ['ag-y', 'years']];

function fade(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 0, hi: state.years }, { lo: 0, hi: state.C0 * 1.1 });
  axes(P, { xLabel: 'years in orbit', yLabel: 'capacity (Wh)' });
  seg(P, [0, BUS.E], [state.years, BUS.E], { color: alpha(C.red, 0.8), width: 1.5, dash: [6, 4] });
  label(P, 'one eclipse: exhausted', [0, BUS.E], { color: C.red, align: 'left', dx: 6, dy: 14 });
  line(P, c.path, { color: C.gold, width: 2.5 });
  label(P, `${fig(c.C)} Wh, ${fig(100 * c.dod)}% depth`, [state.years, c.C], { color: C.text, align: 'right', dy: c.C > BUS.E * 1.5 ? -10 : -24 });
}

function array(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 0, hi: 15 }, { lo: 80, hi: 170 });
  axes(P, { xLabel: 'years in orbit', yLabel: 'array power (W)' });
  line(P, Array.from({ length: 61 }, (_, i) => [i / 4, BUS.P0 * (1 - BUS.fade) ** (i / 4)]), { color: C.gold, width: 2.5 });
  seg(P, [0, BUS.need], [15, BUS.need], { color: alpha(C.red, 0.8), width: 1.5, dash: [6, 4] });
  label(P, 'loads in sunlight', [0, BUS.need], { color: C.red, align: 'left', dx: 6, dy: 14 });
  dot(P, state.years, c.P, { color: C.pink, r: 6, ring: C.text });
}

export default defineLab({
  id: 'ageing',
  exam: 'u5',
  title: 'Ageing',
  hint: 'Shrink the battery to 100 Wh and watch the depth of discharge run away. Then find the smallest battery that lasts ten years.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('sized', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'years', lo: 1, hi: 15 }),
  controls() {
    return `
      ${slider('ag-c', "Battery capacity at launch (Wh)", 175, 60, 400, 5)}
      ${slider('ag-y', "Mission length (years)", 5, 1, 15, 0.5)}
      <p class="tiny">A 35 Wh eclipse every orbit, 5700 orbits a year. Fade per cycle (C₀/6000)(E/C)², a model of lithium-ion that reaches 80% after 30 000 cycles at 20% depth. The array gives 160 W at launch and loses 2.75% a year; the loads need 120 W in sunlight. Left: capacity and depth over the mission. Right: array power against years.</p>`;
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
    return ageChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      fade(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    fade(B, a, state, c);
    array(B, b, state, c);
  },
  law: () => [String.raw`\frac{dC}{dn} = -k\left(\frac{E}{C}\right)^2 \;\Rightarrow\; C(n) = \left(C_0^3 - 3kE^2n\right)^{1/3}`, String.raw`P(y) = P_0\,(1 - 0.0275)^y`],
  liveRows(state, c) {
    return [
      kv('Depth of discharge, launch and now', `${fig(100 * c.dod0)}%, ${fig(100 * c.dod)}%`),
      kv('Capacity now', `${fig(c.C)} Wh`),
      kv('Battery exhausted after', `${fig(c.deadAt)} years`),
      kv('Array power now', `${fig(c.P)} W against ${BUS.need} W needed`),
      kv('Closed form against the cycle march', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['capacity', `${fig(c.C)} Wh`], ['depth', `${fig(100 * c.dod)}%`], ['array', `${fig(c.P)} W`], ['lasts', `${fig(c.deadAt)} years`]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Real fade also depends on temperature and charge voltage, and cells can fail outright; arrays lose more in radiation belts and after solar storms.`;
    if (c.exhausted) return { title: 'Each cycle deepens the next', body: `Starting at ${fig(100 * c.dod0)}% depth, the battery fades, the same eclipse becomes a deeper discharge, and that fades it faster: it is exhausted after ${fig(c.deadAt)} years. A battery sized for launch-day depth is too small. ${leavesOut}` };
    return { title: 'Sized for end of life', body: `After ${fig(state.years)} years the battery holds ${fig(c.C)} Wh and the eclipse takes ${fig(100 * c.dod)}% of it, up from ${fig(100 * c.dod0)}%. The array gives ${fig(c.P)} W${c.powerOk ? ', still above the loads' : ', below the 120 W the loads need'}. ${leavesOut}` };
  },
  app: false,
});
