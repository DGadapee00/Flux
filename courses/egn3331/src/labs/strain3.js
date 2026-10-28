import { hooke3, hooke3Deviator } from '@flux/subjects/mechanics/materials.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, axes, begin, dot, line, plotIn } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, slider } from './widgets.js';

/**
 * Shows that a stress in a second direction changes the strain in the first.
 * Uniaxial strain is σ/E. An equal transverse tension cuts that strain by the factor (1 − ν).
 *
 * Second method: split the stress into a hydrostatic part and a deviator.
 * The bulk piece uses (1−2ν)/E. The deviator uses (1+ν)/E.
 */

const E = 200e9;
const SCENARIOS = [
  { id: 'uni', name: 'Uniaxial tension', sx: 100e6, sy: 0, sz: 0 },
  { id: 'bi', name: 'Equal biaxial tension', sx: 100e6, sy: 100e6, sz: 0 },
  { id: 'hydro', name: 'Hydrostatic tension', sx: 100e6, sy: 100e6, sz: 100e6 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, sx: sc.sx, sy: sc.sy, sz: sc.sz, nu: 0.3 });
}

export default defineLab({
  id: 'strain3',
  exam: 'u4',
  title: 'Three-dimensional Hooke',
  hint: 'A pull in a second direction changes the strain along the first. σ/E is the strain only when the other stresses are zero.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('uni', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'sy', lo: 0, hi: 150e6 }),
  controls() {
    return `
      ${slider('s3-x', 'σx (MPa)', 100, -50, 200, 5)}
      ${slider('s3-y', 'σy (MPa)', 0, -50, 200, 5)}
      ${slider('s3-z', 'σz (MPa)', 0, -50, 200, 5)}
      ${slider('s3-n', 'Poisson ν', 0.3, 0.2, 0.45, 0.01)}
      <p class="tiny">E = 200 GPa. Tension is positive. The gold line on the chart is σx/E, the strain you would get with the other stresses absent.</p>`;
  },
  bind(api) {
    bindSlider('s3-x', (s, v) => { s.sx = v * 1e6; }, api);
    bindSlider('s3-y', (s, v) => { s.sy = v * 1e6; }, api);
    bindSlider('s3-z', (s, v) => { s.sz = v * 1e6; }, api);
    bindSlider('s3-n', (s, v) => { s.nu = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('s3-x', state.sx / 1e6);
    set('s3-y', state.sy / 1e6);
    set('s3-z', state.sz / 1e6);
    set('s3-n', state.nu);
  },
  compute(state) {
    const h = hooke3(state.sx, state.sy, state.sz, E, state.nu);
    const d = hooke3Deviator(state.sx, state.sy, state.sz, E, state.nu);
    const gap = Math.max(Math.abs(h.ex - d.ex), Math.abs(h.ey - d.ey), Math.abs(h.ez - d.ez))
      / Math.max(Math.abs(h.ex), Math.abs(h.ey), Math.abs(h.ez), 1 / E);
    const uni = state.sx / E;
    return { ...h, uni, nu: state.nu, sx: state.sx, sy: state.sy, sz: state.sz, gap };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const span = Math.max(Math.abs(c.ex), Math.abs(c.ey), Math.abs(c.ez), Math.abs(c.uni), 1e-6) * 1.3;
    const P = plotIn(B, B.free, { lo: -50, hi: 200 }, { lo: -span * 1e3, hi: span * 1e3 });
    axes(P, { xLabel: 'σy (MPa)', yLabel: 'strain (millistrain)' });
    const ex = [];
    const uni = [];
    for (let i = 0; i <= 40; i++) {
      const sy = -50e6 + (250e6 * i) / 40;
      const h = hooke3(c.sx, sy, c.sz, E, c.nu);
      ex.push([sy / 1e6, h.ex * 1e3]);
      uni.push([sy / 1e6, (c.sx / E) * 1e3]);
    }
    line(P, uni, { color: C.gold, width: 2, dash: [5, 4] });
    line(P, ex, { color: C.teal, width: 3 });
    dot(P, c.sy / 1e6, c.ex * 1e3, { color: C.yellow, r: 5 });
  },
  law: () => [String.raw`\varepsilon_x=\frac{1}{E}\left[\sigma_x-\nu(\sigma_y+\sigma_z)\right]`],
  liveRows(state, c) {
    return [
      kv('εx', `${fig(c.ex * 1e3)} millistrain`),
      kv('σx/E', `${fig(c.uni * 1e3)} millistrain`),
      kv('εy', `${fig(c.ey * 1e3)} millistrain`),
      kv('volume', `${fig(c.vol * 1e6)} µε`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['εx', `${fig(c.ex * 1e3)} mε`],
      ['σx/E', `${fig(c.uni * 1e3)} mε`],
      ['εy', `${fig(c.ey * 1e3)} mε`],
      ['ΔV/V', `${fig(c.vol * 1e6)} µε`],
    ]);
  },
  coach(state, c) {
    if (Math.abs(c.sy) < 1e5 && Math.abs(c.sz) < 1e5) {
      return {
        title: 'The other stresses are zero',
        body: String.raw`εx is ${fig(c.ex * 1e3)} millistrain, which is σx/E. The side strains are −ν times that.`,
      };
    }
    const cut = c.ex < c.uni - 1e-8;
    return {
      title: cut ? 'The transverse tension reduces εx' : 'The transverse stress has changed εx',
      body: String.raw`σx/E would be ${fig(c.uni * 1e3)} millistrain. With the other stresses present, εx is ${fig(c.ex * 1e3)} millistrain.`,
    };
  },
});
