import { N_PER_LBF, PA_PER_PSI } from '@flux/subjects/convert.js';
import { combinedReduced, hitchSides } from '@flux/subjects/mechanics/materials.js';
import { HITCH_ARM, HITCH_BALL_IN, HITCH_D, HITCH_D_IN, HITCH_GTW_LBF, HITCH_LEN_IN } from '../data/hitch.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, axes, begin, dot, line, plotIn } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, leavesOut, slider } from './widgets.js';

/**
 * Shows that a compressive tongue load and a horizontal force add on one side
 * of a hitch-ball shank and subtract on the other, so the peak is not proportional
 * to the horizontal force alone.
 *
 * Cited: CURT trailer ball 40004, 2 in ball, 1 in shank, 2-1/8 in shank length,
 * 0 rise, 6000 lb gross trailer weight. The moment arm is the ball radius because
 * the catalog does not give the flange height. The 6000 lb figure is gross trailer
 * weight, not the vertical force.
 *
 * Second method: 4W/(πd²) and 32M/(πd³) in the inch-pound form.
 */

const KSI = 1000 * PA_PER_PSI;
const LBF = N_PER_LBF;
const OUT = 'The shank is a solid 1 in circle. CURT lists 6000 lb as the gross trailer weight, not the tongue load, and does not give a yield strength or a flange height. The moment arm is the ball radius, 1 in. Threads, the nut, and the fillet under the flange are left out. A pull aimed through the ball center produces bending, not torsion about the shank.';

const SCENARIOS = [
  { id: 'plan', name: '600 lbf tongue, 600 lbf horizontal', W: 600 * LBF, H: 600 * LBF },
  { id: 'heavy', name: '900 lbf tongue, 1500 lbf horizontal', W: 900 * LBF, H: 1500 * LBF },
  { id: 'straight', name: 'Tongue load only', W: 600 * LBF, H: 0 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, W: sc.W, H: sc.H });
}

export default defineLab({
  id: 'hitch',
  exam: 'u5',
  title: 'Trailer ball shank',
  app: true,
  hint: 'Tongue weight compresses the shank. A horizontal force bends it. The two add on one side and subtract on the other.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('plan', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'H', lo: 0, hi: 2000 * LBF }),
  controls() {
    return `
      ${slider('ht-w', 'tongue load (lbf)', 600, 0, 2000, 20)}
      ${slider('ht-h', 'horizontal force (lbf)', 600, 0, 2000, 20)}
      <p class="tiny">Cited: CURT 40004, ${HITCH_BALL_IN} in ball, ${HITCH_D_IN} in shank, ${HITCH_LEN_IN} in shank length, 0 rise, ${HITCH_GTW_LBF} lb gross trailer weight. Moment arm ${HITCH_BALL_IN / 2} in, the ball radius. The tongue loads drawn here are assumed.</p>`;
  },
  bind(api) {
    bindSlider('ht-w', (s, v) => { s.W = v * LBF; }, api);
    bindSlider('ht-h', (s, v) => { s.H = v * LBF; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('ht-w', state.W / LBF);
    set('ht-h', state.H / LBF);
  },
  compute(state) {
    const s = hitchSides(state.W, state.H, HITCH_D, HITCH_ARM);
    const red = combinedReduced(-Math.abs(state.W), Math.abs(state.H) * HITCH_ARM, 0, HITCH_D);
    const gap = Math.max(Math.abs(s.bend - red.bend), Math.abs(s.axial - red.axial))
      / Math.max(Math.abs(s.bend), Math.abs(s.axial), 1);
    return { ...s, gap };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const tension = [];
    const compression = [];
    let yHi = 1;
    for (let i = 0; i <= 40; i++) {
      const H = (2000 * LBF * i) / 40;
      const s = hitchSides(state.W, H, HITCH_D, HITCH_ARM);
      tension.push([H / LBF, s.tension / KSI]);
      compression.push([H / LBF, s.compression / KSI]);
      yHi = Math.max(yHi, Math.abs(s.tension / KSI), Math.abs(s.compression / KSI));
    }
    const P = plotIn(B, B.free, { lo: 0, hi: 2000 }, { lo: -yHi * 1.1, hi: yHi * 1.1 });
    axes(P, { xLabel: 'horizontal force (lbf)', yLabel: 'stress (ksi)' });
    line(P, tension, { color: C.red, width: 3 });
    line(P, compression, { color: C.blue, width: 3 });
    dot(P, state.H / LBF, c.tension / KSI, { color: C.red, r: 5 });
    dot(P, state.H / LBF, c.compression / KSI, { color: C.blue, r: 5 });
  },
  law: () => [String.raw`\sigma=-\frac{W}{A}\pm\frac{Mc}{I}`],
  liveRows(state, c) {
    return [
      kv('axial', `${fig(c.axial / KSI)} ksi`),
      kv('bending', `${fig(c.bend / KSI)} ksi`),
      kv('tension side', `${fig(c.tension / KSI)} ksi`),
      kv('compression side', `${fig(c.compression / KSI)} ksi`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['tension', `${fig(c.tension / KSI)} ksi`],
      ['compression', `${fig(c.compression / KSI)} ksi`],
      ['axial', `${fig(c.axial / KSI)} ksi`],
      ['bending', `${fig(c.bend / KSI)} ksi`],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => ({
    title: 'The two sides are not the same stress',
    body: `The tension side is ${fig(c.tension / KSI)} ksi and the compression side is ${fig(c.compression / KSI)} ksi. Axial is ${fig(c.axial / KSI)} ksi and bending is ${fig(c.bend / KSI)} ksi.`,
  })),
});
