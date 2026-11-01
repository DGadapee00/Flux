import { cells, eq, kv } from '@flux/shells/math/shared.js';
import { fmtNum as fmt } from '@flux/shells/math/format.js';
import { riemann1d } from '@flux/subjects/math/riemann.js';
import { simpson } from '@flux/subjects/math/quadrature.js';
import { graphById } from '../math/calc1.js';
import { GraphView } from '../scene/graph.js';
import { defineLab, planeCamera } from './define.js';

const SCENARIOS = [
  { id: 'cube', name: 'x³ on [0,1]', graphId: 'cube', a: 0, b: 1 },
  { id: 'quad', name: 'x² on [0, 1]', graphId: 'quad', a: 0, b: 1 },
  { id: 'line', name: '2x+1 on [0, 2]', graphId: 'line', a: 0, b: 2 },
  { id: 'sine', name: 'sin x on [0, π]', graphId: 'sine', a: 0, b: Math.PI },
];

function keepXy(state) {
  state.view = { ...(state.view || {}), plane: 'xy', upm: state.view?.upm || 1 };
}

function sampleX(x0, dx, sample) {
  if (sample === 'right') return x0 + dx;
  if (sample === 'mid') return x0 + 0.5 * dx;
  return x0;
}

export default defineLab({
  id: 'riemann',
  exam: 'u4',
  title: 'Riemann',
  hint: 'Change $n$ and the sample. The rectangles approach the area.',
  orbit: false,
  probe: false,
  frame: true,
  cameraFor: planeCamera,
  toggles: [
    { key: 'curve', label: 'Graph' },
    { key: 'bars', label: 'Rectangles' },
  ],
  scenarios: SCENARIOS,
  defaultState() {
    return {
      scenarioId: 'quad',
      graphId: 'quad',
      a: 0,
      b: 1,
      n: 4,
      sample: 'left',
      xMin: -0.2,
      xMax: 1.3,
      yMin: -0.2,
      yMax: 1.4,
      view: { upm: 1, plane: 'xy' },
      show: { curve: true, bars: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>n</span>
          <div class="slider-row">
            <input type="range" id="rm-n" min="2" max="60" step="1" value="4" />
          </div>
        </label>
        <label class="field">
          <span>Sample</span>
          <select id="rm-sample">
            <option value="left">Left</option>
            <option value="mid">Midpoint</option>
            <option value="right">Right</option>
          </select>
        </label>
      </div>`;
  },
  bind(api) {
    document.getElementById('rm-n').addEventListener('input', (e) => {
      api.slice().n = Number(e.target.value);
      api.bump();
    });
    document.getElementById('rm-sample').addEventListener('change', (e) => {
      api.slice().sample = e.target.value;
      api.bump();
    });
  },
  syncControls(state) {
    const n = document.getElementById('rm-n');
    if (!n) return;
    n.value = state.n;
    document.getElementById('rm-sample').value = state.sample;
  },
  applyScenario(id, state) {
    const s = SCENARIOS.find((item) => item.id === id) || SCENARIOS[0];
    state.scenarioId = s.id;
    state.graphId = s.graphId;
    state.a = s.a;
    state.b = s.b;
    if (!state.sample) state.sample = 'left';
    if (!state.n) state.n = 4;
    keepXy(state);
  },
  extent(state) {
    const g = graphById(state.graphId);
    let m = Math.max(Math.abs(state.a), Math.abs(state.b), 1);
    for (let i = 0; i <= 24; i++) {
      const y = g.f(state.a + ((state.b - state.a) * i) / 24);
      if (Number.isFinite(y)) m = Math.max(m, Math.abs(y));
    }
    return m;
  },
  recompute(state, computed) {
    keepXy(state);
    const g = graphById(state.graphId);
    const a = state.a;
    const b = state.b;
    const n = Math.max(2, Math.min(60, Math.round(state.n) || 4));
    const sample = state.sample === 'right' || state.sample === 'mid' ? state.sample : 'left';
    state.n = n;
    state.sample = sample;
    const summed = riemann1d(g.f, a, b, { n, sample });
    const exact = g.F(b) - g.F(a);
    const simp = simpson(g.f, a, b);
    computed.g = g;
    computed.tex = g.tex;
    computed.sum = summed.sum;
    computed.dx = summed.dx;
    computed.exact = exact;
    computed.simp = simp;
    computed.err = summed.sum - exact;
    computed.agree = Math.abs(simp - exact) <= Math.max(1e-6, 1e-4 * Math.abs(exact));
    const dx = (b - a) / n;
    computed.rects = [];
    for (let i = 0; i < n; i++) {
      const x0 = a + i * dx;
      computed.rects.push({ x0, x1: x0 + dx, y: g.f(sampleX(x0, dx, sample)) });
    }
    state.xMin = Math.min(a, 0) - 0.3;
    state.xMax = b + 0.3;
    state.yMin = -0.4;
    state.yMax = Math.max(1, ...computed.rects.map((r) => Math.abs(r.y))) + 0.4;
  },
  init(ctx) {
    return { view: new GraphView(ctx.scene) };
  },
  enter(ctx, handle) {
    handle.view.setVisible(true);
  },
  exit(ctx, handle) {
    handle.view.setVisible(false);
  },
  syncViews(state, computed, ctx) {
    const show = state.show || {};
    const g = computed.g || graphById(state.graphId);
    const view = ctx.handle.view;
    view.syncCurve(g.f, state.a, state.b, show.curve !== false);
    view.syncLine('secant', 0, 0, 0, 0, false);
    view.syncLine('tangent', 0, 0, 0, 0, false);
    view.syncBars(computed.rects || [], show.bars !== false);
  },
  law() {
    return ['\\displaystyle\\int_a^b f(x)\\,dx=\\lim_{n\\to\\infty}\\sum_{i=1}^{n} f(x_i^*)\\,\\Delta x'];
  },
  liveRows(state, computed) {
    return (
      kv('$f$', `$${computed.tex}$`) +
      kv('$n$', String(state.n)) +
      kv('sample', state.sample) +
      kv('Riemann sum', `$${fmt(computed.sum)}$`) +
      kv('$F(b)-F(a)$', `$${fmt(computed.exact)}$`) +
      kv('Simpson', `$${fmt(computed.simp)}$`) +
      kv('sum − exact', `$${fmt(computed.err)}$`)
    );
  },
  readout(state, computed) {
    return cells([
      ['sum', `$${fmt(computed.sum)}$`],
      ['exact', `$${fmt(computed.exact)}$`],
      ['Simpson', `$${fmt(computed.simp)}$`],
      ['agree', computed.agree ? 'yes' : 'no'],
    ]);
  },
  coach(state, computed) {
    const body = [
      'Each rectangle uses one sample height.',
      'More rectangles shrink the gap to the integral.',
      eq('\\Delta x=(b-a)/n'),
    ];
    if (state.graphId === 'quad' && state.a === 0 && state.b === 1 && state.sample === 'left') {
      body.push('$x^2$ is increasing here, so the left sum sits under the area.');
    }
    if (Number.isFinite(computed.err)) {
      body.push(`The sum misses the exact area by $${fmt(computed.err)}$.`);
    }
    return { title: 'Rectangles to the integral', body };
  },
  plot() {
    return null;
  },
});
