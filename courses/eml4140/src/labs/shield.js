import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { PLATES, shieldsChecked, shieldsClosed } from '@flux/subjects/heat/shields.js';

/**
* Shields: two large plates at 600 K and 300 K, with thin radiation shields you add one at a time
 * and a slider for how polished they are, the temperature of every surface drawn.
 *
 * Shows that a shield works without being cold: one shield floats at 512 K, hotter than the midpoint,
 * whatever its emissivity. A black shield halves the flux; a polished one (ε = 0.05) cuts it to 3.7%.
 * The resistance network is checked against a sweep that sets each shield's temperature from the
 * flux balance with its neighbours (packages/subjects/src/heat/shields.js).
 */
const SCENARIOS = [
  {
    id: 'none',
    name: 'No shield',
    N: 0,
    es: 0.05
  },
  {
    id: 'black',
    name: 'One black shield, ε = 0.8',
    N: 1,
    es: 0.8
  },
  {
    id: 'polished',
    name: 'One polished shield, ε = 0.05',
    N: 1,
    es: 0.05
  },
  {
    id: 'three',
    name: 'Three polished shields',
    N: 3,
    es: 0.05
  }
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, N: sc.N, es: sc.es });
}

const KEYS = [['sh-n', 'N'], ['sh-e', 'es']];

const wm2 = (q) => `${fig(q)} W/m²`;

function stack(B, rect, state, c) {
  const n = state.N;
  const P = plotIn(B, rect, { lo: -0.5, hi: n + 1.5 }, { lo: 250, hi: 660 });
  axes(P, { xLabel: 'surface, hot plate to cold plate', yLabel: 'temperature (K)', xFmt: () => '' });
  const mid = (PLATES.T1 + PLATES.T2) / 2;
  seg(P, [-0.5, mid], [n + 1.5, mid], { color: alpha(C.muted, 0.6), width: 1, dash: [4, 4] });
  label(P, `midpoint ${mid} K`, [n + 1.5, mid], { color: C.muted, align: 'right', dy: -10 });
  c.T.forEach((t, i) => {
    const end = i === 0 || i === n + 1;
    seg(P, [i, 250], [i, t], { color: end ? alpha(C.red, 0.85) : alpha(C.gold, 0.85), width: end ? 8 : 4 });
    dot(P, i, t, { color: end ? C.red : C.gold, r: 5 });
    label(P, `${fig(t)} K`, [i, t], { color: C.text, dy: -12 });
  });
  line(P, c.T.map((t, i) => [i, t]), { color: alpha(C.gold, 0.5), width: 1.5, dash: [3, 3] });
}

function flux(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: -0.3, hi: 5.3 }, { lo: 10, hi: 20000, log: true });
  axes(P, { xLabel: 'number of shields', yLabel: 'flux (W/m²)' });
  const mine = [0, 1, 2, 3, 4, 5].map((k) => [k, shieldsClosed({ N: k, es: state.es }).q]);
  const black = [0, 1, 2, 3, 4, 5].map((k) => [k, shieldsClosed({ N: k, es: 1 }).q]);
  line(P, black, { color: alpha(C.muted, 0.8), width: 1.5, dash: [5, 4] });
  label(P, 'black shields', black[5], { color: C.muted, align: 'right', dy: -10 });
  line(P, mine, { color: C.gold, width: 2.5 });
  label(P, `ε_s = ${fig(state.es)}`, mine[5], { color: C.gold, align: 'right', dy: 14 });
  dot(P, state.N, c.q, { color: C.pink, r: 6, ring: C.text });
}

export default defineLab({
  id: 'shield',
  exam: 'u2',
  title: 'Shields',
  hint: 'Add one shield and read its temperature. Then polish it: the flux drops twenty-fold, but the shield’s temperature does not move.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('none', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'es', lo: 0.02, hi: 1 }),
  controls() {
    return `
      ${slider('sh-n', "Number of shields", 0, 0, 5, 1)}
      ${slider('sh-e', "Shield emissivity ε_s", 0.05, 0.02, 1, 0.01)}
      <p class="tiny">Two large plates, the hot one at 600 K and the cold one at 300 K, both with ε = 0.8. Each shield is a thin sheet with the same emissivity on both faces. Left: every surface’s temperature across the gap. Right: the flux against the number of shields, for these shields and for black ones.</p>`;
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
    return shieldsChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      stack(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    stack(B, a, state, c);
    flux(B, b, state, c);
  },
  law: () => [String.raw`q'' = \frac{\sigma(T_1^4 - T_2^4)}{\dfrac{1}{\varepsilon_1} + \dfrac{1}{\varepsilon_2} - 1 + N\left(\dfrac{2}{\varepsilon_s} - 1\right)}`, String.raw`J = \varepsilon E_b + (1 - \varepsilon)G`],
  liveRows(state, c) {
    return [
      kv('Flux with the shields', wm2(c.q)),
      kv('Flux with none', wm2(c.q0)),
      kv('Fraction left', `${fig(100 * c.cut)}%`),
      kv('Shield temperatures', c.T.slice(1, -1).map((t) => `${fig(t)} K`).join(', ') || 'none'),
      kv('Network against the shield sweep', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['flux', wm2(c.q)], ['left', `${fig(100 * c.cut)}%`], ['shields', String(state.N)], ['first shield', state.N ? `${fig(c.T[1])} K` : '—']]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Real shields conduct a little through their supports, and a polished surface’s emissivity rises as it oxidises or gathers dust.`;
    if (state.N === 0) return { title: 'No shield: one gap, three resistances', body: `The plates exchange ${wm2(c.q)}: two surface resistances and one space resistance in series. Add a shield and see where it settles. ${leavesOut}` };
    if (state.es < 0.2) return { title: 'Polish does the work, not cold', body: `${state.N} shield${state.N > 1 ? 's' : ''} at ε_s = ${fig(state.es)} leave ${fig(100 * c.cut)}% of the flux. The first shield sits at ${fig(c.T[1])} K, far above the midpoint: a shield is not a cold sheet. Each one adds two surface resistances, 2(1 − ε_s)/ε_s, and those are large for a shiny sheet. ${leavesOut}` };
    return { title: 'A dull shield adds little', body: `At ε_s = ${fig(state.es)} each shield adds only ${fig(2 / state.es - 1)} to the resistance, so ${state.N} of them leave ${fig(100 * c.cut)}% of the flux. Polish them and watch the flux fall while their temperatures stay put. ${leavesOut}` };
  },
  app: false,
});
