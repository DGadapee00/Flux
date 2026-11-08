import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { PART, parisChecked, parisClosed } from '@flux/subjects/matsci/fatigue.js';

/**
* Fatigue: an edge crack in a steel part under a stress that cycles from zero, with sliders for the
 * stress range and the starting crack depth, the crack's growth drawn to the length where it runs.
 *
 * Shows that a load below yield is not safe forever: at a fifth of yield, a 1 mm crack grows every
 * cycle and breaks the part after 724 000 cycles. Halving the stress multiplies the life by 8.5. The
 * Paris-law life is checked by integrating dN = da/C(ΔK)^m numerically
 * (packages/subjects/src/matsci/fatigue.js).
 */
const SCENARIOS = [
  { id: 'fifth', name: '100 MPa, a 1 mm crack', ds: 100, a0mm: 1 },
  { id: 'double', name: '200 MPa, the same crack', ds: 200, a0mm: 1 },
  { id: 'low', name: '50 MPa, a 0.5 mm crack', ds: 50, a0mm: 0.5 },
  { id: 'high', name: '300 MPa, a 2 mm crack', ds: 300, a0mm: 2 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, ds: sc.ds, a0mm: sc.a0mm });
}

const KEYS = [['pa-s', 'ds'], ['pa-a', 'a0mm']];

const cyc = (n) => (n >= 1e6 ? `${fig(n / 1e6)} million` : `${fig(n / 1000)} thousand`);

function growth(B, rect, state, c) {
  const top = c.ac * 1000 * 1.12;
  const P = plotIn(B, rect, { lo: 0, hi: c.N * 1.05 }, { lo: 0, hi: top });
  axes(P, { xLabel: 'cycles', yLabel: 'crack depth (mm)', xFmt: (v) => (v >= 1e6 ? `${fig(v / 1e6)}M` : v >= 1e3 ? `${fig(v / 1e3)}k` : fig(v)) });
  seg(P, [0, c.ac * 1000], [c.N * 1.05, c.ac * 1000], { color: alpha(C.red, 0.8), width: 1.5, dash: [6, 4] });
  label(P, `runs at ${fig(c.ac * 1000)} mm`, [0, c.ac * 1000], { color: C.red, align: 'left', dx: 6, dy: -10 });
  const pts = Array.from({ length: 301 }, (_, i) => [(c.N * i) / 300, Math.min(top, c.aAt((c.N * i) / 300) * 1000)]);
  line(P, pts, { color: C.gold, width: 2.5 });
  dot(P, c.N, c.ac * 1000, { color: C.pink, r: 6, ring: C.text });
  label(P, `${cyc(c.N)} cycles`, [c.N, c.ac * 1000], { color: C.text, align: 'right', dx: -10, dy: 16 });
}

function life(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 40, hi: 400, log: true }, { lo: 1e3, hi: 1e8, log: true });
  axes(P, { xLabel: 'stress range Δσ (MPa)', yLabel: 'cycles to failure' });
  const pts = Array.from({ length: 101 }, (_, i) => {
    const ds = 40 * 10 ** (i / 100);
    return [ds, parisClosed({ ds, a0mm: state.a0mm }).N];
  }).filter((p) => p[1] > 0);
  line(P, pts, { color: C.gold, width: 2.5 });
  seg(P, [PART.sy, 1e3], [PART.sy, 1e8], { color: alpha(C.red, 0.6), width: 1.5, dash: [4, 4] });
  dot(P, state.ds, c.N, { color: C.pink, r: 6, ring: C.text });
}

export default defineLab({
  id: 'paris',
  exam: 'u4',
  title: 'Fatigue',
  hint: 'Read the life at 100 MPa, a fifth of yield. Then double the stress range and see the life fall almost ninefold.',
  gapLimit: 1e-8,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('fifth', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'ds', lo: 50, hi: 300 }),
  controls() {
    return `
      ${slider('pa-s', "Stress range Δσ (MPa), from zero", 100, 50, 300, 5)}
      ${slider('pa-a', "Starting crack depth (mm)", 1, 0.5, 5, 0.1)}
      <p class="tiny">A steel part with an edge crack, Y = 1.12, C = 10⁻¹¹ m/cycle and m = 3 (ΔK in MPa·m^½), K_Ic = 60 MPa·m^½, yield 500 MPa. Left: crack depth against cycles, up to the depth where it runs. Right: the life against the stress range.</p>`;
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
    return parisChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      growth(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    growth(B, a, state, c);
    life(B, b, state, c);
  },
  law: () => [String.raw`\frac{da}{dN} = C(\Delta K)^m, \qquad \Delta K = Y\Delta\sigma\sqrt{\pi a}`, String.raw`N_f = \frac{a_c^{1 - m/2} - a_0^{1 - m/2}}{C\,(Y\Delta\sigma\sqrt\pi)^m\,(1 - m/2)}`],
  liveRows(state, c) {
    return [
      kv('ΔK at the start', `${fig(c.dK0)} MPa·m^½`),
      kv('Growth per cycle at the start', `${fig(c.rate0 * 1e9)} nm`),
      kv('Depth where it runs', `${fig(c.ac * 1000)} mm`),
      kv('Life', `${cyc(c.N)} cycles`),
      kv('Stress range against yield', `${fig((100 * state.ds) / PART.sy)}%`),
      kv('Closed form against the integral', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['life', `${cyc(c.N)}`], ['runs at', `${fig(c.ac * 1000)} mm`], ['ΔK start', `${fig(c.dK0)} MPa·m^½`], ['of yield', `${fig((100 * state.ds) / PART.sy)}%`]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Below a threshold ΔK, a few MPa·m^½ in steel, a crack does not grow at all; a mean stress, overloads and the environment all change the rate; and finding a crack in time is what inspection intervals are for.`;
    return { title: 'Below yield, and still failing', body: `Each cycle the crack grows by C(ΔK)^m: ${fig(c.rate0 * 1e9)} nm at first, faster as it deepens. At ${fig((100 * state.ds) / PART.sy)}% of yield it reaches ${fig(c.ac * 1000)} mm, where K_max = K_Ic, after ${cyc(c.N)} cycles. Life goes roughly as Δσ^{−3}: halve the stress and it lasts about eight times longer, not forever. ${leavesOut}` };
  },
  app: false,
});
