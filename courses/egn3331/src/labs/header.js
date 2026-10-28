import { M_PER_FT, M_PER_IN, N_PER_LBF } from '@flux/subjects/convert.js';
import { shearFlow } from '@flux/subjects/mechanics/materials.js';
import {
  HEADER_LINES, HEADER_LOAD_PLF, HEADER_NAIL_IN, HEADER_ROOF_PLF, HEADER_SPAN_FT,
  HEADER_TABLE_PLF, HEADER_WEIGHT_PLF, PLF_TO_NPM, headerInchForce, headerNail,
} from '../data/header.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, axes, begin, dot, line, plotIn } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, leavesOut, slider } from './widgets.js';

/**
 * Shows that the flange nails on a box beam work hardest at the supports,
 * because the shear flow follows V, not the moment.
 *
 * Second method: inch-pound Q and I, and the change in flange force (ΔM)Q/I.
 */

const OUT = 'The webs are 15/32 in thick, the panel category, and they run the full 24 in beside the flanges. Each flange is two dressed 2×4s stacked, 3.5 in wide and 3 in deep. Wood and the panel do not share a modulus, so this section is not transformed. The table allowable of 413 plf, the L/240 limit, the stiffeners, and the nail yield modes are not in this force. The published schedule doubles the spacing in the middle half of the span. The force shown is what one nail carries under the example load, not an allowable.';

const SCENARIOS = [
  { id: 'design', name: '363 plf at 18 ft', L: HEADER_SPAN_FT * M_PER_FT, w: HEADER_LOAD_PLF * PLF_TO_NPM, x: 0 },
  { id: 'roof', name: 'Roof load only', L: HEADER_SPAN_FT * M_PER_FT, w: HEADER_ROOF_PLF * PLF_TO_NPM, x: 0 },
  { id: 'short', name: '12 ft opening', L: 12 * M_PER_FT, w: HEADER_LOAD_PLF * PLF_TO_NPM, x: 0 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, L: sc.L, w: sc.w, x: sc.x });
}

export default defineLab({
  id: 'header',
  exam: 'u7',
  title: 'Garage header',
  app: true,
  hint: 'A simple header\'s shear is largest at the supports. The flange nails follow that shear, not the midspan moment.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('design', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'w', lo: 100 * PLF_TO_NPM, hi: 500 * PLF_TO_NPM }),
  controls() {
    return `
      ${slider('hd-l', 'span (ft)', 18, 8, 36, 1)}
      ${slider('hd-w', 'line load (lb/ft)', 363, 100, 500, 1)}
      ${slider('hd-x', 'station from the left (ft)', 0, 0, 36, 0.5)}
      <p class="tiny">APA Z416T, February 2009, cross section B: 24 in deep, 15/32 in webs, two 2×4s each flange. 8d common nails at 1.5 in, four lines. The table lists 413 plf at 18 ft. The example is 350 plf of roof plus ${HEADER_WEIGHT_PLF} plf of beam.</p>`;
  },
  bind(api) {
    bindSlider('hd-l', (s, v) => { s.L = v * M_PER_FT; }, api);
    bindSlider('hd-w', (s, v) => { s.w = v * PLF_TO_NPM; }, api);
    bindSlider('hd-x', (s, v) => { s.x = v * M_PER_FT; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('hd-l', state.L / M_PER_FT);
    set('hd-w', state.w / PLF_TO_NPM);
    set('hd-x', state.x / M_PER_FT);
  },
  compute(state) {
    const x = Math.min(Math.max(state.x, 0), state.L);
    const here = headerNail(state.w, state.L, x);
    const support = headerNail(state.w, state.L, 0);
    const inchN = headerInchForce(state.w / PLF_TO_NPM, state.L / M_PER_FT) * N_PER_LBF;
    const gapI = Math.abs(support.nail - inchN) / Math.max(Math.abs(support.nail), 1);
    const dx = state.L / 200;
    const x0 = Math.min(x, state.L - dx);
    const M = (xx) => state.w * (state.L / 2) * xx - state.w * xx * xx / 2;
    const qDiff = ((M(x0 + dx) - M(x0)) / dx) * here.sec.Qf / here.sec.I;
    const Vmid = state.w * (state.L / 2 - (x0 + dx / 2));
    const qMid = shearFlow(Vmid, here.sec.Qf, here.sec.I);
    const gapM = Math.abs(qDiff - qMid) / Math.max(Math.abs(support.q), 1);
    return {
      V: Math.abs(here.V),
      q: Math.abs(here.q),
      nail: Math.abs(here.nail),
      nailMax: Math.abs(support.nail),
      w: state.w,
      L: state.L,
      x,
      gap: Math.max(gapI, gapM),
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const pts = [];
    let yHi = 1;
    for (let i = 0; i <= 40; i++) {
      const x = (state.L * i) / 40;
      const nail = Math.abs(headerNail(state.w, state.L, x).nail) / N_PER_LBF;
      pts.push([x / M_PER_FT, nail]);
      yHi = Math.max(yHi, nail);
    }
    const P = plotIn(B, B.free, { lo: 0, hi: state.L / M_PER_FT }, { lo: 0, hi: yHi * 1.1 });
    axes(P, { xLabel: 'x (ft)', yLabel: 'force in one nail (lbf)' });
    line(P, pts, { color: C.gold, width: 3 });
    dot(P, c.x / M_PER_FT, c.nail / N_PER_LBF, { color: C.gold, r: 5 });
    line(P, [[HEADER_SPAN_FT, 0], [HEADER_SPAN_FT, yHi * 1.1]], { color: C.teal, width: 2, dash: [5, 4] });
  },
  law: () => [String.raw`F=\frac{q s}{n}`],
  liveRows(state, c) {
    return [
      kv('shear', `${fig(c.V / N_PER_LBF)} lbf`),
      kv('flange flow', `${fig((c.q * M_PER_IN) / N_PER_LBF)} lb/in`),
      kv('one nail', `${fig(c.nail / N_PER_LBF)} lbf`),
      kv('nail lines', `${HEADER_LINES}`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['shear', `${fig(c.V / N_PER_LBF)} lbf`],
      ['flow', `${fig((c.q * M_PER_IN) / N_PER_LBF)} lb/in`],
      ['nail', `${fig(c.nail / N_PER_LBF)} lbf`],
      ['span', `${fig(state.L / M_PER_FT)} ft`],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => ({
    title: 'The nails follow the shear',
    body: `At ${fig(c.x / M_PER_FT)} ft one nail carries ${fig(c.nail / N_PER_LBF)} lbf. The support shear is ${fig(Math.abs(state.w * state.L / 2) / N_PER_LBF)} lbf. The teal line is the 18 ft example. The table allowable is ${HEADER_TABLE_PLF} plf, and the nails are ${HEADER_NAIL_IN} in apart.`,
  })),
});
