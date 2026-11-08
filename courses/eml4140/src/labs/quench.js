import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { MATERIALS, SLAB, slabChecked } from '@flux/subjects/heat/transient.js';

/**
* Quench: a 4 cm plate at 200 °C plunged into 20 °C fluid, with the temperature across it drawn as
 * time runs, and a choice of steel, glass or polycarbonate.
 *
 * Shows that a part does not always cool together: steel, with a Biot number of 0.22, stays within
 * 16 °C from centre to surface, while polycarbonate, with Bi = 50, has a surface at 26 °C and a centre
 * still at 189 °C, the gradient that cracks a quenched part. The series solution is checked against a
 * Crank–Nicolson march (packages/subjects/src/heat/transient.js).
 */
const SCENARIOS = [
  {
    id: 'steel',
    name: 'Steel after 32 s',
    mat: 'steel',
    h: 500,
    lt: 1.5
  },
  {
    id: 'plastic',
    name: 'Polycarbonate after 5 minutes',
    mat: 'plastic',
    h: 500,
    lt: 2.5
  },
  {
    id: 'late',
    name: 'Polycarbonate after an hour',
    mat: 'plastic',
    h: 500,
    lt: 3.5
  },
  {
    id: 'glass',
    name: 'Glass in gentle flow',
    mat: 'glass',
    h: 100,
    lt: 2
  }
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, mat: sc.mat, h: sc.h, lt: sc.lt });
}

const KEYS = [['qn-h', 'h'], ['qn-t', 'lt']];

const degC = (T) => `${fig(T)} °C`;

function across(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: -SLAB.L * 1000, hi: SLAB.L * 1000 }, { lo: 0, hi: 215 });
  axes(P, { xLabel: 'position across the plate (mm)', yLabel: 'temperature (°C)' });
  const pts = Array.from({ length: 121 }, (_, i) => {
    const xi = -1 + (2 * i) / 120;
    return [xi * SLAB.L * 1000, c.T(c.at(Math.abs(xi)))];
  });
  line(P, pts, { color: C.gold, width: 3 });
  seg(P, [-SLAB.L * 1000, SLAB.Tinf], [SLAB.L * 1000, SLAB.Tinf], { color: alpha(C.blue, 0.6), width: 1, dash: [5, 4] });
  label(P, `centre ${degC(c.Tc)}`, [0, c.Tc], { color: C.gold, dy: -12 });
  label(P, `surface ${degC(c.Ts)}`, [SLAB.L * 1000, c.Ts], { color: C.pink, align: 'right', dy: 16 });
  label(P, `t = ${fig(c.t)} s, Bi = ${fig(c.Bi)}`, [-SLAB.L * 1000, 215], { color: C.muted, align: 'left', dx: 4, dy: 10 });
}

function history(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 0, hi: 4.5 }, { lo: 0, hi: 215 });
  axes(P, { xLabel: 'time, log₁₀ t (s)', yLabel: 'temperature (°C)' });
  const m = MATERIALS[state.mat];
  const run = (xi) => Array.from({ length: 91 }, (_, i) => {
    const lt = (4.5 * i) / 90;
    const Fo = (m.alpha * 10 ** lt) / SLAB.L ** 2;
    let s = 0;
    for (const z of c.roots) s += ((4 * Math.sin(z)) / (2 * z + Math.sin(2 * z))) * Math.exp(-z * z * Fo) * Math.cos(z * xi);
    return [lt, c.T(s)];
  });
  line(P, run(0), { color: C.gold, width: 2.5 });
  line(P, run(1), { color: C.pink, width: 2.5 });
  seg(P, [state.lt, 0], [state.lt, 215], { color: alpha(C.muted, 0.6), width: 1, dash: [3, 3] });
  label(P, 'centre', [0.2, 205], { color: C.gold, align: 'left', dy: -2 });
  label(P, 'surface', [0.2, 165], { color: C.pink, align: 'left', dy: -2 });
}

export default defineLab({
  id: 'quench',
  exam: 'u1',
  title: 'Quench',
  hint: 'Compare steel and polycarbonate at the same h: one cools as a lump, the other has a cold skin round a hot core.',
  gapLimit: 2e-4,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('steel', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'lt', lo: 0, hi: 4.5 }),
  controls() {
    return `
      <label class="field"><span>Material</span><select id="qn-mat">${Object.entries(MATERIALS).map(([id, m]) => [id, `${m.name}, k = ${m.k} W/(m·K)`]).map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></label>
      ${slider('qn-h', "Heat transfer coefficient h (W/(m²·K))", 500, 10, 2000, 10)}
      ${slider('qn-t', "Time, log₁₀ t (s)", 1.5, 0, 4.5, 0.01)}
      <p class="tiny">A plate 4 cm thick, from 200 °C, in fluid at 20 °C on both faces. Left: temperature across the plate now. Right: centre and surface against time, on a log scale.</p>`;
  },
  bind(api) {
    document.getElementById('qn-mat')?.addEventListener('change', (e) => {
      api.slice().mat = e.target.value;
      api.bump();
    });
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    {
      const el = document.getElementById('qn-mat');
      if (el) el.value = String(state.mat);
    }
    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    return slabChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      across(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    across(B, a, state, c);
    history(B, b, state, c);
  },
  law: () => [String.raw`\theta = \sum C_n e^{-\zeta_n^2\,\mathrm{Fo}}\cos\!\left(\zeta_n\frac{x}{L}\right), \quad \zeta_n\tan\zeta_n = \mathrm{Bi}`, String.raw`\mathrm{Bi} = \frac{hL}{k}, \qquad \mathrm{Fo} = \frac{\alpha t}{L^2}`],
  liveRows(state, c) {
    return [
      kv('Biot and Fourier numbers', `${fig(c.Bi)}, ${fig(c.Fo)}`),
      kv('Centre, surface', `${degC(c.Tc)}, ${degC(c.Ts)}`),
      kv('Centre minus surface', `${fig(c.dT)} K`),
      kv('Series against Crank–Nicolson', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['Bi', fig(c.Bi)], ['centre', degC(c.Tc)], ['surface', degC(c.Ts)], ['difference', `${fig(c.dT)} K`]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> A real quench boils the fluid at first, so h changes hugely with time, and a real part has corners and edges that cool faster than any flat face.`;
    if (c.Bi < 0.1) return { title: 'One lump', body: `With Bi = ${fig(c.Bi)}, conduction inside is far quicker than convection outside: centre and surface differ by only ${fig(c.dT)} K. Treat the plate as one temperature. ${leavesOut}` };
    if (c.Bi > 5) return { title: 'A cold skin round a hot core', body: `With Bi = ${fig(c.Bi)}, the surface falls almost at once to ${degC(c.Ts)} while the centre is still ${degC(c.Tc)}: the skin shrinks round a core that has not, and that stress cracks quenched parts. ${leavesOut}` };
    return { title: 'In between', body: `With Bi = ${fig(c.Bi)} the inside and outside both resist: the centre is at ${degC(c.Tc)}, the surface at ${degC(c.Ts)}. ${leavesOut}` };
  },
  app: false,
});
