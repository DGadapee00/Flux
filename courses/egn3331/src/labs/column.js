import { tubeColumn, tubeSection } from '@flux/subjects/mechanics/buckling.js';
import {
  COLUMN_E_KSI, COLUMN_FY_KSI, COLUMN_OD_IN, COLUMN_T_IN, COLUMN_URL, columnRow,
} from '../data/column.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, axes, begin, dot, label, line, plotIn, sceneIn, split } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, leavesOut, slider } from './widgets.js';

/**
 * Shows that a listed basement column is not safe at its Euler load.
 * At 124 in the Euler stress is still under yield, and several times the
 * published allowable. At 76 in the Euler stress is already past yield.
 *
 * Second method: the same tube in SI, against the inch formula.
 * The drawing uses the inch formula only.
 */

const OUT = `The column is an Akron 3 in adjustable column in ICC-ES ESR-1767, Table 2. The design wall is ${COLUMN_T_IN} in, not the nominal 0.120 in. Fy is 42 ksi. The report does not print E. This model uses ${COLUMN_E_KSI} ksi. The listed length includes up to 4 in of adjusting screw, and the screw is not the tube. The ends are fixed against translation and free to rotate, so K is 1. The AISC column curve, the factors on the allowable, eccentricity, and the end plates are left out. The published ASD is not this Euler load.`;

const SCENARIOS = [
  { id: 'elastic', name: '124 in, still elastic', L: 124, K: 1 },
  { id: 'yield', name: '76 in, yield first', L: 76, K: 1 },
  { id: 'long', name: '145 in', L: 145, K: 1 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, L: sc.L, K: sc.K });
}

export default defineLab({
  id: 'column',
  exam: 'u11',
  title: 'Steel column',
  hint: 'The catalog allowable is not the Euler load. A short listed length yields first.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('elastic', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'L', lo: 60, hi: 160 }),
  controls() {
    return `
      <label class="field"><span>Ends</span><select id="col-k">
        <option value="1">free to rotate, K = 1</option>
        <option value="2">fixed-free, K = 2</option>
        <option value="0.5">fixed-fixed, K = 0.5</option>
      </select></label>
      ${slider('col-L', 'length (in)', 124, 60, 160, 1)}
      <p class="tiny">ESR-1767 Table 2, <a href="${COLUMN_URL}">the report</a>. Design wall ${COLUMN_T_IN} in. E = ${COLUMN_E_KSI} ksi is assumed.</p>`;
  },
  bind(api) {
    document.getElementById('col-k')?.addEventListener('change', (e) => {
      api.slice().K = Number(e.target.value);
      api.bump();
    });
    bindSlider('col-L', (s, v) => { s.L = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('col-k', state.K);
    set('col-L', state.L);
  },
  compute(state) {
    const c = tubeColumn(state.L, COLUMN_OD_IN, COLUMN_T_IN, COLUMN_E_KSI, COLUMN_FY_KSI, state.K);
    const row = state.K === 1 ? columnRow(state.L) : null;
    return { ...c, L: state.L, K: state.K, asd: row ? row.asd : null };
  },
  draw(canvas, state) {
    const B = begin(canvas);
    const [top, bottom] = split(B.free, 0.42);
    const S = sceneIn(B, top, { x0: -2, x1: 2, y0: -2, y1: 2 });
    const { inner, A } = tubeSection(COLUMN_OD_IN, COLUMN_T_IN);
    const ring = (r) => {
      const pts = [];
      for (let i = 0; i <= 48; i++) {
        const a = (2 * Math.PI * i) / 48;
        pts.push([r * Math.cos(a), r * Math.sin(a)]);
      }
      return pts;
    };
    line(S, ring(1), { color: C.gold, width: 3 });
    line(S, ring(inner / COLUMN_OD_IN), { color: C.teal, width: 2 });
    label(S, '3 in tube', [0, -1.55], { color: C.gold });
    label(S, `A = ${fig(A)} in²`, [0, 1.55], { color: C.teal });

    const { I } = tubeSection(COLUMN_OD_IN, COLUMN_T_IN);
    const kip = (Lin, K) => (Math.PI ** 2 * COLUMN_E_KSI * I) / (K * Lin) ** 2;
    const Py = COLUMN_FY_KSI * A;
    const yHi = Math.max(kip(60, 1), Py) * 1.08;
    const P = plotIn(B, bottom, { lo: 60, hi: 160 }, { lo: 0, hi: yHi });
    axes(P, { xLabel: 'length (in)', yLabel: 'load (kip)' });
    const curve = [];
    for (let i = 0; i <= 40; i++) {
      const L = 60 + (100 * i) / 40;
      curve.push([L, kip(L, 1)]);
    }
    line(P, curve, { color: C.gold, width: 3 });
    line(P, [[60, Py], [160, Py]], { color: C.yellow, width: 1.5, dash: [5, 4] });
    dot(P, state.L, kip(state.L, state.K), { color: C.pink, r: 5 });
  },
  law: (state) => [state.K === 1 ? String.raw`P_{cr}=\frac{\pi^2 EI}{L^2}` : String.raw`P_{cr}=\frac{\pi^2 EI}{(KL)^2}`],
  liveRows(state, c) {
    return [
      kv('Euler load', `${fig(c.eulerKip)} kip`),
      kv('Euler stress', `${fig(c.stressKsi)} ksi`),
      kv('yield load', `${fig(c.Py)} kip`),
      kv('ASD', c.asd == null ? 'not this length' : `${fig(c.asd)} kip`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['Euler', `${fig(c.eulerKip)} kip`],
      ['stress', `${fig(c.stressKsi)} ksi`],
      ['governs', c.yielded ? 'yield' : 'Euler'],
      ['ASD', c.asd == null ? 'off table' : `${fig(c.asd)} kip`],
    ]);
  },
  coach: leavesOut(OUT, (s, c) => ({
    title: c.yielded ? 'Yield is reached first' : 'Euler is still below yield',
    body: c.yielded
      ? `The Euler load is ${fig(c.eulerKip)} kip and the stress is ${fig(c.stressKsi)} ksi, above 42 ksi. The course model stops at ${fig(c.Py)} kip. ${c.asd == null ? '' : `The report still lists an ASD of ${fig(c.asd)} kip at this length.`}`
      : `The Euler load is ${fig(c.eulerKip)} kip, stress ${fig(c.stressKsi)} ksi. ${c.asd == null ? 'This length is not a row in the table.' : `The published ASD at this length is ${fig(c.asd)} kip.`}`,
  })),
});
