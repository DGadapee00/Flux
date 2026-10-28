import { M_PER_FT, M_PER_IN, N_PER_LBF, PA_PER_PSI } from '@flux/subjects/convert.js';
import { simpleBendingStress } from '@flux/subjects/mechanics/materials.js';
import { beamGap, simpleUniform } from '@flux/subjects/mechanics/sections.js';
import {
  JOIST_B, JOIST_B_IN, JOIST_DEAD_PSF, JOIST_H, JOIST_H_IN, JOIST_LIVE,
  JOIST_SPACE, JOIST_SPAN, JOIST_SPAN_FT, PA_PER_PSF, joistLine,
} from '../data/joist.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, axes, begin, dot, line, plotIn } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, leavesOut, slider } from './widgets.js';

/**
 * Shows that the bending stress in a floor joist grows with the square of the
 * span, on the dressed size, not the nominal name.
 *
 * Second method: the left-segment moment from internalAt, then Mc/I.
 */

const PSI = PA_PER_PSI;
const OUT = 'The dressed size is 1.5 in by 9.25 in, not the nominal 2 by 10. The 14 ft span is the Southern Pine No. 2 maximum at 16 in on center for 40 psf live and 10 psf dead, with deflection limited to L/360. That limit, shear, bearing, and the repetitive-member factor are not in this stress. The published table does not give a bending stress, so 916 psi is this model, not an allowable Fb.';

const SCENARIOS = [
  { id: 'table', name: 'No. 2 at the table span', L: JOIST_SPAN, space: JOIST_SPACE, live: JOIST_LIVE, b: JOIST_B, h: JOIST_H },
  { id: 'short', name: '10 ft span', L: 10 * M_PER_FT, space: JOIST_SPACE, live: JOIST_LIVE, b: JOIST_B, h: JOIST_H },
  { id: 'nominal', name: 'Nominal 2×10 size', L: JOIST_SPAN, space: JOIST_SPACE, live: JOIST_LIVE, b: 2 * M_PER_IN, h: 10 * M_PER_IN },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, L: sc.L, space: sc.space, live: sc.live, b: sc.b, h: sc.h });
}

function stressOf(state) {
  const w = joistLine(state.live, state.space);
  const model = simpleUniform(w, state.L);
  const closed = simpleBendingStress(w, state.L, state.b, state.h);
  const cut = model.at(state.L / 2).M;
  const fromCut = (cut * (state.h / 2)) / ((state.b * state.h ** 3) / 12);
  const gapS = Math.abs(fromCut - closed) / Math.max(Math.abs(closed), 1);
  return { w, moment: model.Mmax, stress: closed, gap: Math.max(beamGap(model), gapS) };
}

export default defineLab({
  id: 'joist',
  exam: 'u6',
  title: 'Floor joist',
  app: true,
  hint: 'A simple joist carries the strip of floor between its neighbors. The moment, and the bending stress, grow with the square of the span.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('table', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'L', lo: 8 * M_PER_FT, hi: 20 * M_PER_FT }),
  controls() {
    return `
      ${slider('js-l', 'span (ft)', 14, 6, 28, 0.5)}
      ${slider('js-s', 'spacing (in)', 16, 8, 24, 1)}
      ${slider('js-p', 'live load (psf)', 40, 10, 60, 1)}
      <p class="tiny">Southern Pine No. 2, Table 2 of the SFPA maximum spans (1 June 2013): 14 ft at 16 in on center, 40 psf live, ${JOIST_DEAD_PSF} psf dead, L/360. Dressed size ${JOIST_B_IN} in by ${JOIST_H_IN} in (PS 20). Dead load stays at ${JOIST_DEAD_PSF} psf.</p>`;
  },
  bind(api) {
    bindSlider('js-l', (s, v) => { s.L = v * M_PER_FT; }, api);
    bindSlider('js-s', (s, v) => { s.space = v * M_PER_IN; }, api);
    bindSlider('js-p', (s, v) => { s.live = v * PA_PER_PSF; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('js-l', state.L / M_PER_FT);
    set('js-s', state.space / M_PER_IN);
    set('js-p', state.live / PA_PER_PSF);
  },
  compute(state) {
    const s = stressOf(state);
    return { ...s, b: state.b, h: state.h, L: state.L };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const pts = [];
    let yHi = 1;
    for (let i = 0; i <= 40; i++) {
      const ft = 6 + (22 * i) / 40;
      const w = joistLine(state.live, state.space);
      const psi = simpleBendingStress(w, ft * M_PER_FT, state.b, state.h) / PSI;
      pts.push([ft, psi]);
      yHi = Math.max(yHi, psi);
    }
    const P = plotIn(B, B.free, { lo: 6, hi: 28 }, { lo: 0, hi: yHi * 1.1 });
    axes(P, { xLabel: 'span (ft)', yLabel: 'bending stress (psi)' });
    line(P, pts, { color: C.gold, width: 3 });
    dot(P, state.L / M_PER_FT, c.stress / PSI, { color: C.gold, r: 5 });
    line(P, [[JOIST_SPAN_FT, 0], [JOIST_SPAN_FT, yHi * 1.1]], { color: C.teal, width: 2, dash: [5, 4] });
  },
  law: () => [String.raw`\sigma=\frac{wL^2}{8}\cdot\frac{6}{bh^2}`],
  liveRows(state, c) {
    const plf = (c.w * M_PER_FT) / N_PER_LBF;
    const lbft = c.moment / N_PER_LBF / M_PER_FT;
    return [
      kv('line load', `${fig(plf)} lb/ft`),
      kv('moment', `${fig(lbft)} lb·ft`),
      kv('bending stress', `${fig(c.stress / PSI)} psi`),
      kv('section', `${fig(state.b / M_PER_IN)} × ${fig(state.h / M_PER_IN)} in`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['stress', `${fig(c.stress / PSI)} psi`],
      ['moment', `${fig(c.moment / N_PER_LBF / M_PER_FT)} lb·ft`],
      ['load', `${fig((c.w * M_PER_FT) / N_PER_LBF)} lb/ft`],
      ['span', `${fig(state.L / M_PER_FT)} ft`],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => ({
    title: 'The stress grows with the square of the span',
    body: `At ${fig(state.L / M_PER_FT)} ft the bending stress is ${fig(c.stress / PSI)} psi. The moment is ${fig(c.moment / N_PER_LBF / M_PER_FT)} lb·ft. The teal line is the 14 ft table span.`,
  })),
});
