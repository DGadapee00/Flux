import { barElongation, taperedElongation } from '@flux/subjects/mechanics/materials.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, line, plotIn } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, showField, slider } from './widgets.js';

/**
 * Shows that the displacement of a bar is the running sum of NL/AE, so the internal-force
 * diagram, not the external load alone, sets how far the free end moves.
 *
 * Second method: Simpson's rule on ∫ N/(AE) dx against the closed sum, and against
 * 4PL/(π E d0 d1) for a linear taper.
 */

const E = 200e9;

const SCENARIOS = [
  { id: 'uniform', name: 'Uniform bar', kind: 'step', P: 20e3, Q: 0, L1: 0.8, A1: 200e-6, A2: 200e-6 },
  { id: 'step', name: 'Stepped bar', kind: 'step', P: 20e3, Q: 12e3, L1: 0.4, A1: 300e-6, A2: 150e-6 },
  { id: 'taper', name: 'Tapered bar', kind: 'taper', P: 30e3, Q: 0, L1: 0.6, A1: 0.04, A2: 0.02 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, {
    scenarioId: sc.id, kind: sc.kind, P: sc.P, Q: sc.Q, L1: sc.L1, A1: sc.A1, A2: sc.A2,
  });
}

function simpson(f, a, b, n = 800) {
  if (b <= a) return 0;
  const h = (b - a) / n;
  let sum = f(a) + f(b);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * f(a + i * h);
  return (sum * h) / 3;
}

function profile(state) {
  const L = state.kind === 'taper' ? state.L1 : state.L1 + 0.6;
  if (state.kind === 'taper') {
    const d0 = state.A1;
    const d1 = state.A2;
    const delta = taperedElongation(state.P, L, E, d0, d1);
    const quad = simpson((x) => {
      const d = d0 + (d1 - d0) * (x / L);
      const A = (Math.PI * d * d) / 4;
      return state.P / (A * E);
    }, 0, L);
    const samples = [];
    let run = 0;
    for (let i = 0; i <= 40; i++) {
      const x = (L * i) / 40;
      const d = d0 + (d1 - d0) * (x / L);
      const A = (Math.PI * d * d) / 4;
      if (i) run += (state.P / (A * E)) * (L / 40);
      samples.push([x, run]);
    }
    return { delta, quad, L, Nmax: state.P, samples, gap: Math.abs(delta - quad) / Math.max(Math.abs(delta), 1e-12) };
  }
  const L2 = 0.6;
  const segs = [
    { N: state.P + state.Q, L: state.L1, A: state.A1, E },
    { N: state.P, L: L2, A: state.A2, E },
  ];
  const delta = barElongation(segs);
  const quad = simpson((x) => (state.P + state.Q) / (state.A1 * E), 0, state.L1)
    + simpson((x) => state.P / (state.A2 * E), state.L1, state.L1 + L2);
  const N = (x) => (x <= state.L1 ? state.P + state.Q : state.P);
  const A = (x) => (x <= state.L1 ? state.A1 : state.A2);
  const samples = [];
  let run = 0;
  const total = state.L1 + L2;
  for (let i = 0; i <= 40; i++) {
    const x = (total * i) / 40;
    if (i) {
      const xm = x - total / 80;
      run += (N(xm) / (A(xm) * E)) * (total / 40);
    }
    samples.push([x, run]);
  }
  return { delta, quad, L: total, Nmax: state.P + state.Q, samples, gap: Math.abs(delta - quad) / Math.max(Math.abs(delta), 1e-12) };
}

export default defineLab({
  id: 'axial',
  exam: 'u3',
  title: 'Axial bar',
  hint: 'The free end moves by the sum of NL/AE. A step in the force, or in the area, changes the slope of that sum.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('step', s);
    return s;
  },
  applyScenario: apply,
  sweep(state) {
    return { key: 'P', lo: 0, hi: state.kind === 'taper' ? 60e3 : 40e3 };
  },
  controls() {
    return `
      ${slider('ax-P', 'end load P (kN)', 20, 0, 60, 1)}
      ${slider('ax-Q', 'step load Q (kN)', 12, 0, 40, 1)}
      <p class="tiny">The bar is fixed at the left. P pulls the free end. Q pulls at the step. E = 200 GPa. On the taper, the two diameters replace the two areas.</p>`;
  },
  bind(api) {
    bindSlider('ax-P', (s, v) => { s.P = v * 1e3; }, api);
    bindSlider('ax-Q', (s, v) => { s.Q = v * 1e3; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    showField('ax-Q', state.kind !== 'taper');
    set('ax-P', state.P / 1e3);
    set('ax-Q', state.Q / 1e3);
  },
  compute(state) {
    const p = profile(state);
    return { ...p, P: state.P, Q: state.Q, kind: state.kind };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const yHi = Math.max(...c.samples.map((p) => p[1]), 1e-6) * 1.15;
    const P = plotIn(B, B.free, { lo: 0, hi: c.L }, { lo: 0, hi: yHi * 1e3 });
    axes(P, { xLabel: 'x (m)', yLabel: 'displacement (mm)' });
    line(P, c.samples.map(([x, u]) => [x, u * 1e3]), { color: C.teal, width: 3 });
    if (state.kind !== 'taper') {
      line(P, [[state.L1, 0], [state.L1, yHi * 1e3]], { color: alpha(C.gold, 0.8), width: 2, dash: [5, 4] });
    }
    dot(P, c.L, c.delta * 1e3, { color: C.yellow, r: 5 });
  },
  law: () => [String.raw`\delta=\sum\frac{NL}{AE}`],
  liveRows(state, c) {
    return [
      kv('end displacement', `${fig(c.delta * 1e3)} mm`),
      kv('integral check', `${fig(c.quad * 1e3)} mm`),
      kv('largest internal force', `${fig(c.Nmax / 1e3)} kN`),
      kv('length', `${fig(c.L)} m`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['δ end', `${fig(c.delta * 1e3)} mm`],
      ['∫ N/AE', `${fig(c.quad * 1e3)} mm`],
      ['N max', `${fig(c.Nmax / 1e3)} kN`],
      ['length', `${fig(c.L)} m`],
    ]);
  },
  coach(state, c) {
    if (state.kind === 'taper') {
      return {
        title: 'A taper is not the average area',
        body: String.raw`The end moves ${fig(c.delta * 1e3)} mm. The closed form is $4PL/(\pi E d_0 d_1)$. An average of the two end areas misses it, because $1/d^2$ is not linear.`,
      };
    }
    return {
      title: 'The displacement adds up',
      body: String.raw`Each slice contributes $N\,dx/AE$. The gold line is the step. The free end has moved ${fig(c.delta * 1e3)} mm, which is the whole sum.`,
    };
  },
});
