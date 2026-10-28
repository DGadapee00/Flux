import { N_PER_LBF, M_PER_IN, PA_PER_PSI } from '@flux/subjects/convert.js';
import { pinSegments, pinShear } from '@flux/subjects/mechanics/materials.js';
import { LBF_PER_TONNE, SHACKLE_URL, SIZES, shackleLoad } from '../data/shackle.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, axes, begin, dot, label, line, plotIn, sceneIn, seg, split } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, leavesOut, slider } from './widgets.js';

/**
 * Shows that a shackle pin in the bow is in double shear, and that the jaw
 * opening does not enter that average. A proof load of twice the working
 * load doubles the stress. Counting one plane does the same.
 *
 * Second method: the shear on each plane from the pin's segments, over the
 * pin area.
 */

const KSI = 1000 * PA_PER_PSI;
const HALF = SIZES['1/2'];

const OUT = `The shackle is a Crosby G-209, stock ${SIZES['1/2'].stock}. The catalog table lists a 1/2 in nominal size, a working load of 2 t, jaw opening ${HALF.jaw} in and pin diameter ${HALF.d} in. This model takes ${LBF_PER_TONNE} lbf for each catalog tonne, which is the 4400 lbf printed beside that 2 t. The bow's bearing on the pin, the screw thread, side loading and fatigue are left out. A design factor of 6, where a listing states one, is not applied as a stress.`;

const SCENARIOS = [
  { id: 'wll', name: '1/2 in at the working load', P: shackleLoad('1/2', 1), d: HALF.d, jaw: HALF.jaw, planes: 2 },
  { id: 'proof', name: '1/2 in at the proof load', P: shackleLoad('1/2', 2), d: HALF.d, jaw: HALF.jaw, planes: 2 },
  { id: 'one', name: 'Counted as one plane', P: shackleLoad('1/2', 1), d: HALF.d, jaw: HALF.jaw, planes: 1 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { ...sc, scenarioId: sc.id });
}

export default defineLab({
  id: 'shackle',
  exam: 'u1',
  title: 'Shackle',
  hint: 'The pin crosses two gaps, so two planes share the load. The jaw width is not in that stress.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('wll', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'P', lo: 1000, hi: 9000 }),
  controls() {
    return `
      <label class="field" id="sh-planes-field"><span>Shear planes</span><select id="sh-planes"><option value="2">two planes (in the bow)</option><option value="1">one plane</option></select></label>
      ${slider('sh-p', 'load (lbf)', 4400, 500, 10000, 100)}
      ${slider('sh-d', 'pin diameter (in)', 0.63, 0.25, 1.5, 0.01)}
      ${slider('sh-jaw', 'jaw opening (in)', 0.81, 0.4, 2, 0.01)}
      <p class="tiny">Crosby G-209 table, <a href="${SHACKLE_URL}">catalog extract</a>. ${LBF_PER_TONNE} lbf per catalog tonne. The 1/2 in pin is ${HALF.d} in.</p>`;
  },
  bind(api) {
    document.getElementById('sh-planes')?.addEventListener('change', (e) => {
      api.slice().planes = Number(e.target.value);
      api.bump();
    });
    bindSlider('sh-p', (s, v) => { s.P = v; }, api);
    bindSlider('sh-d', (s, v) => { s.d = v; }, api);
    bindSlider('sh-jaw', (s, v) => { s.jaw = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('sh-planes', state.planes);
    set('sh-p', state.P);
    set('sh-d', state.d);
    set('sh-jaw', state.jaw);
  },
  compute(state) {
    const P = state.P * N_PER_LBF;
    const d = Math.max(state.d, 0.05) * M_PER_IN;
    const planes = state.planes === 1 ? 1 : 2;
    const tau = pinShear(P, d, planes);
    const seg = pinSegments(P, planes);
    const area = (Math.PI * d * d) / 4;
    const tauSeg = Math.max(...seg.shears) / area;
    return {
      tau,
      tauKsi: tau / KSI,
      planes,
      gap: Math.max(Math.abs(tauSeg - tau) / Math.max(tau, 1), seg.residual / Math.max(P, 1)),
    };
  },
  draw(canvas, state) {
    const B = begin(canvas);
    const [top, bottom] = split(B.free, 0.46);
    const S = sceneIn(B, top, { x0: -2.2, x1: 2.2, y0: -1.3, y1: 1.3 });
    const jaw = 0.9;
    seg(S, [-jaw, 0.55], [jaw, 0.55], { color: C.gold, width: 8 });
    seg(S, [-jaw, -0.55], [jaw, -0.55], { color: C.gold, width: 8 });
    seg(S, [0, 0.55], [0, -0.55], { color: C.pink, width: 6 });
    seg(S, [-0.15, 0.15], [0.15, 0.15], { color: C.teal, width: 3 });
    seg(S, [-0.15, -0.15], [0.15, -0.15], { color: C.teal, width: 3 });
    label(S, 'pin', [0.35, 0], { align: 'left', color: C.pink });
    label(S, state.planes === 2 ? 'two planes' : 'one plane', [0, -1.05], { color: C.teal });

    const Pmax = Math.max(state.P * 1.4, 2000);
    const d = Math.max(state.d, 0.05);
    const ksiAt = (P, planes) => (P * N_PER_LBF) / (planes * Math.PI * (d * M_PER_IN) ** 2 / 4) / KSI;
    const hi = Math.max(ksiAt(Pmax, 1), 1);
    const plot = plotIn(B, bottom, { lo: 0, hi: Pmax }, { lo: 0, hi: hi * 1.05 });
    axes(plot, { xLabel: 'load (lbf)', yLabel: 'shear (ksi)' });
    const two = [];
    const one = [];
    for (let i = 0; i <= 40; i++) {
      const P = (Pmax * i) / 40;
      two.push([P, ksiAt(P, 2)]);
      one.push([P, ksiAt(P, 1)]);
    }
    line(plot, two, { color: C.gold, width: 3 });
    line(plot, one, { color: C.teal, width: 2 });
    dot(plot, state.P, ksiAt(state.P, state.planes === 1 ? 1 : 2), { color: C.pink, r: 5 });
  },
  law(state) {
    return [state.planes === 1 ? String.raw`\tau=\frac{P}{A}` : String.raw`\tau=\frac{P}{2A}`];
  },
  liveRows(state, c) {
    return [
      kv('shear stress', `${fig(c.tauKsi)} ksi`),
      kv('planes', String(c.planes)),
      kv('jaw', `${fig(state.jaw)} in`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['shear', `${fig(c.tauKsi)} ksi`],
      ['planes', String(c.planes)],
      ['pin', `${fig(state.d)} in`],
      ['load', `${fig(state.P)} lbf`],
    ]);
  },
  coach: leavesOut(OUT, (s, c) => ({
    title: s.planes === 1 ? 'One plane carries the whole load' : 'Two planes share the pin',
    body: `The average shear is ${fig(c.tauKsi)} ksi. The jaw is ${fig(s.jaw)} in and does not appear in that number. Doubling the load doubles the stress. Counting one plane does the same.`,
  })),
});
