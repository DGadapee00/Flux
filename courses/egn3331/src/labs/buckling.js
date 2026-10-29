import { eulerLoad, rectColumn, rectI } from '@flux/subjects/mechanics/buckling.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, axes, begin, chartIn, circle, dot, hidden, label, line, panes, pinSupport, poly, sceneIn, seg } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, slider } from './widgets.js';

/**
 * Shows that the Euler load falls with (KL)², follows the weak axis, and
 * stops being the failure load once the Euler stress reaches yield.
 *
 * Second method: inverse iteration on EI v″ + P v = 0, pinned on the
 * effective length. The drawing uses the closed form only.
 */

const E = 200e9;
const SY = 250e6;
const WEAK = { b: 0.06, h: 0.02 };
const STRONG = { b: 0.02, h: 0.06 };

const SCENARIOS = [
  { id: 'weak', name: 'Pinned, weak axis, 2 m', L: 2, K: 1, axis: 'weak' },
  { id: 'free', name: 'Fixed-free, 2 m', L: 2, K: 2, axis: 'weak' },
  { id: 'short', name: 'Pinned, 0.3 m', L: 0.3, K: 1, axis: 'weak' },
  { id: 'strong', name: 'Pinned, strong axis, 2 m', L: 2, K: 1, axis: 'strong' },
];

function dims(axis) {
  return axis === 'strong' ? STRONG : WEAK;
}

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  const d = dims(sc.axis);
  Object.assign(state, { scenarioId: sc.id, L: sc.L, K: sc.K, axis: sc.axis, b: d.b, h: d.h, E });
}

function governKN(L, b, h, K) {
  const euler = eulerLoad(E, rectI(b, h), L, K);
  const Py = SY * b * h;
  return Math.min(euler, Py) / 1e3;
}

export default defineLab({
  id: 'buckling',
  exam: 'u11',
  title: 'Buckling',
  hint: 'The Euler load falls with the square of the effective length, and only while it stays under yield.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('weak', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'L', lo: 0.25, hi: 4 }),
  controls() {
    return `
      <label class="field"><span>Ends</span><select id="bk-k">
        <option value="1">pinned-pinned, K = 1</option>
        <option value="0.5">fixed-fixed, K = 0.5</option>
        <option value="2">fixed-free, K = 2</option>
        <option value="0.7">fixed-pinned, K = 0.7</option>
      </select></label>
      <label class="field"><span>Axis</span><select id="bk-axis">
        <option value="weak">weak axis, 20 mm depth</option>
        <option value="strong">strong axis, 60 mm depth</option>
      </select></label>
      ${slider('bk-L', 'length L (m)', 2, 0.25, 4, 0.05)}
      <p class="tiny">Steel, E = 200 GPa, σY = 250 MPa. The section is 20 mm by 60 mm. K = 0.7 is the fixed-pinned root rounded.</p>`;
  },
  bind(api) {
    document.getElementById('bk-k')?.addEventListener('change', (e) => {
      api.slice().K = Number(e.target.value);
      api.bump();
    });
    document.getElementById('bk-axis')?.addEventListener('change', (e) => {
      const d = dims(e.target.value);
      const s = api.slice();
      s.axis = e.target.value;
      s.b = d.b;
      s.h = d.h;
      api.bump();
    });
    bindSlider('bk-L', (s, v) => { s.L = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('bk-k', state.K);
    set('bk-axis', state.axis);
    set('bk-L', state.L);
  },
  compute(state) {
    const b = state.b;
    const h = state.h;
    const c = rectColumn(state.L, b, h, state.E || E, SY, state.K);
    return { ...c, b, h, K: state.K, L: state.L, axis: state.axis };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [top, bottom] = panes(B, 0.4);
    // The column, its ends, and the shape it buckles into: a half sine between pins, a quarter
    // sine standing free, a full cosine wave between fixed ends, and the tan(kL) = kL root for
    // fixed and pinned. The dashed shape is drawn, not computed to scale.
    const S = sceneIn(B, top, { x0: -1.3, x1: 1.3, y0: -1.35, y1: 1.45 }, 8);
    const K = Number(state.K) || 1;
    const shape = (u) => {
      if (K === 2) return 1 - Math.cos((Math.PI * u) / 2);
      if (K === 0.5) return (1 - Math.cos(2 * Math.PI * u)) / 2;
      if (Math.abs(K - 0.7) < 0.01) {
        const kL = 4.4934;
        const f = (x) => kL * (1 - Math.cos(kL * x)) - (kL * x - Math.sin(kL * x));
        return f(u) / 6.2;
      }
      return Math.sin(Math.PI * u);
    };
    seg(S, [0, -1], [0, 1], { color: alpha(C.gold, 0.35), width: 6 });
    let prev = null;
    for (let i = 0; i <= 40; i++) {
      const u = i / 40;
      const p = [0.45 * shape(u), -1 + 2 * u];
      if (prev) seg(S, prev, p, { color: C.gold, width: 3, dash: [6, 4] });
      prev = p;
    }
    const pinBase = K === 1;
    if (pinBase) pinSupport(S, [0, -1], { size: 11 });
    else poly(S, [[-0.5, -1.12], [0.5, -1.12], [0.5, -1], [-0.5, -1]], { fill: alpha(C.muted, 0.4), stroke: C.muted });
    if (K === 0.5) poly(S, [[-0.5, 1], [0.5, 1], [0.5, 1.12], [-0.5, 1.12]], { fill: alpha(C.muted, 0.4), stroke: C.muted });
    else if (K !== 2) circle(S, [0, 1], 0.05, { stroke: C.muted, fill: C.bg, width: 2 });
    arrow(S, [0, K === 0.5 ? 1.12 : 1], Math.PI / 2, 30, { color: C.pink, width: 3, tail: true });
    if (!veiled) {
      const ends = { 1: 'pinned–pinned', 2: 'fixed–free', 0.5: 'fixed–fixed', 0.7: 'fixed–pinned' }[K] || `K = ${K}`;
      label(S, `${ends}, K = ${K}`, [0.55, 0.15], { align: 'left', color: C.teal });
      label(S, `KL = ${fig(K * state.L)} m`, [0.55, -0.15], { align: 'left', color: C.teal });
      label(S, state.axis === 'strong' ? 'strong axis' : 'weak axis', [0, -1.12], { color: C.gold, dy: 12 });
    }
    if (veiled) return;

    const yHi = (SY * WEAK.b * WEAK.h) / 1e3 * 1.15;
    const P = chartIn(B, bottom, { lo: 0.2, hi: 4.2 }, { lo: 0, hi: yHi });
    axes(P, { xLabel: 'length (m)', yLabel: 'governing load (kN)' });
    const weak = [];
    const strong = [];
    for (let i = 0; i <= 40; i++) {
      const L = 0.35 + (3.8 * i) / 40;
      weak.push([L, governKN(L, WEAK.b, WEAK.h, 1)]);
      strong.push([L, governKN(L, STRONG.b, STRONG.h, 1)]);
    }
    line(P, weak, { color: C.gold, width: 3 });
    line(P, strong, { color: C.teal, width: 2 });
    line(P, [[0.2, yHi / 1.15], [4.2, yHi / 1.15]], { color: C.yellow, width: 1.5, dash: [5, 4] });
    dot(P, state.L, governKN(state.L, state.b, state.h, state.K), { color: C.pink, r: 5 });
  },
  law: () => [String.raw`P_{cr}=\frac{\pi^2 EI}{(KL)^2}`],
  liveRows(state, c) {
    return [
      kv('Euler load', `${fig(c.euler / 1e3)} kN`),
      kv('Euler stress', `${fig(c.stress / 1e6)} MPa`),
      kv('yield load', `${fig(c.Py / 1e3)} kN`),
      kv('governs', c.yielded ? 'yield' : 'Euler'),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['Euler', `${fig(c.euler / 1e3)} kN`],
      ['stress', `${fig(c.stress / 1e6)} MPa`],
      ['governs', c.yielded ? 'yield' : 'Euler'],
      ['K', fig(c.K)],
    ]);
  },
  coach(state, c) {
    const who = c.yielded ? 'Yield is reached first' : 'Euler still governs';
    const body = c.yielded
      ? `The Euler load is ${fig(c.euler / 1e3)} kN and the Euler stress is ${fig(c.stress / 1e6)} MPa, above 250 MPa. The course model stops at the yield load, ${fig(c.Py / 1e3)} kN.`
      : `The Euler load is ${fig(c.euler / 1e3)} kN. The stress is ${fig(c.stress / 1e6)} MPa, under 250 MPa. Doubling the length divides that load by four. The strong axis carries nine times the weak-axis load.`;
    return { title: who, body };
  },
});
