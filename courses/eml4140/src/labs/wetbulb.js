import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { AIRW, rhoSat, wetChecked, wetClosed } from '@flux/subjects/heat/wetbulb.js';

/**
* Wet bulb: a wet wick in moving air, with sliders for the air's temperature and relative
 * humidity, the wick's temperature drawn as it settles.
 *
 * Shows that a wet surface does not settle at the air temperature: evaporation holds it below, by an
 * amount the heat and mass analogy predicts. In air at 30 °C and 50% the wick sits at 21.5 °C; in a
 * desert at 40 °C and 10%, at 17.5 °C. The balance is solved by Newton's method and checked by
 * marching a wet bead in time until it stops changing (packages/subjects/src/heat/wetbulb.js).
 */
const SCENARIOS = [
  {
    id: 'mild',
    name: 'Air at 30 °C, 50% humidity',
    T: 30,
    rh: 50
  },
  {
    id: 'desert',
    name: 'A desert, 40 °C and 10%',
    T: 40,
    rh: 10
  },
  {
    id: 'saturated',
    name: 'Saturated air at 30 °C',
    T: 30,
    rh: 100
  },
  {
    id: 'cool',
    name: 'A cool damp day, 15 °C and 80%',
    T: 15,
    rh: 80
  }
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, T: sc.T, rh: sc.rh });
}

const KEYS = [['wb-t', 'T'], ['wb-rh', 'rh']];

function settle(B, rect, state, c) {
  const lo = Math.min(c.dew, c.Tw) - 3;
  const P = plotIn(B, rect, { lo: 0, hi: 120 }, { lo, hi: state.T + 3 });
  axes(P, { xLabel: 'time (s)', yLabel: 'bead temperature (°C)' });
  seg(P, [0, state.T], [120, state.T], { color: alpha(C.red, 0.8), width: 1.5, dash: [6, 4] });
  label(P, `air ${fig(state.T)} °C`, [120, state.T], { color: C.red, align: 'right', dy: -10 });
  seg(P, [0, c.dew], [120, c.dew], { color: alpha(C.blue, 0.7), width: 1.5, dash: [3, 3] });
  label(P, `dew point ${fig(c.dew)} °C`, [120, c.dew], { color: C.blue, align: 'right', dy: 14 });
  line(P, c.hist, { color: C.gold, width: 3 });
  label(P, `settles at ${fig(c.Tw)} °C`, [60, c.Tw], { color: C.gold, dy: c.Tw - c.dew > 2 ? 16 : -12 });
}

function depression(B, rect, state, c) {
  const pts = Array.from({ length: 96 }, (_, i) => [5 + i, wetClosed({ T: state.T, rh: 5 + i }).depression]);
  const hi = Math.max(5, pts[0][1] * 1.15);
  const P = plotIn(B, rect, { lo: 0, hi: 100 }, { lo: 0, hi });
  axes(P, { xLabel: 'relative humidity (%)', yLabel: 'air minus wick (K)' });
  line(P, pts, { color: C.gold, width: 2.5 });
  dot(P, state.rh, c.depression, { color: C.pink, r: 6, ring: C.text });
}

export default defineLab({
  id: 'wetbulb',
  exam: 'u4',
  title: 'Wet bulb',
  hint: 'Dry the air and watch the wick fall below it. Then make the air saturated: evaporation stops and the wick sits at the air temperature.',
  gapLimit: 1e-8,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('mild', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'rh', lo: 5, hi: 100 }),
  controls() {
    return `
      ${slider('wb-t', "Air temperature (°C)", 30, 5, 45, 0.5)}
      ${slider('wb-rh', "Relative humidity (%)", 50, 5, 100, 1)}
      <p class="tiny">Air at 1 atm, with h/h_m = ρc_p Le^{2/3}, Le = 0.85. Left: a 2 mm water bead with h = 50 W/(m²·K), starting at the air temperature, as it settles. Right: how far below the air the wick settles against humidity, at this air temperature.</p>`;
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
    return wetChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      settle(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    settle(B, a, state, c);
    depression(B, b, state, c);
  },
  law: () => [String.raw`h(T_\infty - T_w) = h_m h_{fg}\left[\rho_{v,\text{sat}}(T_w) - \phi\,\rho_{v,\text{sat}}(T_\infty)\right]`, String.raw`\frac{h}{h_m} = \rho c_p\,\text{Le}^{2/3}, \qquad \text{Sh} = \frac{h_m L}{D_{AB}}`],
  liveRows(state, c) {
    return [
      kv('Wick temperature', `${fig(c.Tw)} °C`),
      kv('Below the air by', `${fig(c.depression)} K`),
      kv('Dew point', `${fig(c.dew)} °C`),
      kv('h/h_m', `${fig(c.hOverHm)} J/(m³·K)`),
      kv('Newton against the time march', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['wick', `${fig(c.Tw)} °C`], ['below air', `${fig(c.depression)} K`], ['dew point', `${fig(c.dew)} °C`], ['humidity', `${fig(state.rh)}%`]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> A real wick also gains heat by radiation from its surroundings, which a shield or a fast fan keeps small, and the analogy assumes a low evaporation rate.`;
    if (c.depression < 0.05) return { title: 'Saturated: no evaporation, no cooling', body: `At ${fig(state.rh)}% the air holds all the vapour it can at ${fig(state.T)} °C. Nothing evaporates, so the wick sits at the air temperature. ${leavesOut}` };
    return { title: 'Evaporation holds the wick below the air', body: `The wick settles where the air’s convection just pays for the latent heat carried off: ${fig(c.Tw)} °C, ${fig(c.depression)} K below the air. The same analogy that links h to h_m makes this independent of the air speed. It is above the dew point, ${fig(c.dew)} °C. ${leavesOut}` };
  },
  app: false,
});
