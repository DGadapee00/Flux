import { cells, eq, kv } from '@flux/shells/math/shared.js';
import { fmtNum as fmt } from '@flux/shells/math/format.js';
import { df1, df1left, df1right } from '@flux/subjects/math/ndiff.js';
import { graphById, secantSlope } from '../math/calc1.js';
import { GraphView } from '../scene/graph.js';
import { defineLab, planeCamera } from './define.js';

const SCENARIOS = [
  { id: 'tangent1', name: '(x−1)²+1: a tangent through the origin', graphId: 'tangent1', a: -3, b: 3 },
  { id: 'tangent2', name: 'x²+4: two symmetric tangents', graphId: 'tangent2', a: -3, b: 3 },
  { id: 'fall', name: 'Falling height (ft versus seconds)', graphId: 'fall', a: 0, b: 5 },
  { id: 'mathlet', name: '0.5x³−x: secant direction matters', graphId: 'mathlet', a: -1.5, b: 1.5 },
  { id: 'quad', name: 'x²', graphId: 'quad', a: -2, b: 2 },
  { id: 'line', name: '2x + 1', graphId: 'line', a: -2, b: 2 },
  { id: 'cube', name: 'x³', graphId: 'cube', a: -1.5, b: 1.5 },
  { id: 'abs', name: '|x|', graphId: 'abs', a: -2, b: 2 },
  { id: 'sine', name: 'sin x', graphId: 'sine', a: -3, b: 3 },
];

function keepXy(state) {
  state.view = { ...(state.view || {}), plane: 'xy', upm: state.view?.upm || 1 };
}

function lineEnds(x, y, slope, half = 0.9) {
  return { x0: x - half, y0: y - slope * half, x1: x + half, y1: y + slope * half };
}

export default defineLab({
  id: 'secant',
  exam: 'u2',
  title: 'Secant',
  hint: 'Slide $x_0$ and $h$. The secant becomes the tangent.',
  orbit: true,
  probe: false,
  frame: true,
  cameraFor: planeCamera,
  toggles: [
    { key: 'curve', label: 'Graph' },
    { key: 'secant', label: 'Secant' },
    { key: 'tangent', label: 'Tangent' },
  ],
  scenarios: SCENARIOS,
  defaultState() {
    return {
      scenarioId: 'quad',
      graphId: 'quad',
      x0: 1,
      h: 0.4,
      a: -2,
      b: 2,
      xMin: -2.4,
      xMax: 2.4,
      yMin: -0.5,
      yMax: 4.5,
      view: { upm: 1, plane: 'xy' },
      show: { curve: true, secant: true, tangent: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>x₀</span>
          <div class="slider-row">
            <input type="range" id="sc-x0" min="-2" max="2" step="0.01" value="1" />
          </div>
        </label>
        <label class="field">
          <span>h</span>
          <div class="slider-row">
            <input type="range" id="sc-h" min="0.05" max="1.2" step="0.01" value="0.4" />
          </div>
        </label>
      </div>`;
  },
  bind(api) {
    document.getElementById('sc-x0').addEventListener('input', (e) => {
      api.slice().x0 = Number(e.target.value);
      api.bump();
    });
    document.getElementById('sc-h').addEventListener('input', (e) => {
      api.slice().h = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(state) {
    const x = document.getElementById('sc-x0');
    if (!x) return;
    x.min = String(state.a);
    x.max = String(state.b);
    x.value = state.x0;
    document.getElementById('sc-h').value = state.h;
  },
  applyScenario(id, state) {
    const s = SCENARIOS.find((item) => item.id === id) || SCENARIOS[0];
    state.scenarioId = s.id;
    state.graphId = s.graphId;
    state.a = s.a;
    state.b = s.b;
    state.x0 = Math.min(s.b - 0.2, Math.max(s.a, state.x0 ?? 0.5 * (s.a + s.b)));
    keepXy(state);
  },
  extent(state) {
    const g = graphById(state.graphId);
    let m = Math.max(Math.abs(state.a), Math.abs(state.b), 1);
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
      const y = g.f(state.a + ((state.b - state.a) * i) / steps);
      if (Number.isFinite(y)) m = Math.max(m, Math.abs(y));
    }
    return m;
  },
  recompute(state, computed) {
    keepXy(state);
    const g = graphById(state.graphId);
    const a = state.a;
    const b = state.b;
    let h = Number.isFinite(state.h) ? state.h : 0.4;
    h = (h < 0 ? -1 : 1) * Math.min(2, Math.max(0.01, Math.abs(h)));
    let x0 = Number.isFinite(state.x0) ? state.x0 : 0;
    x0 = Math.max(a, Math.min(b, x0));
    state.h = h;
    state.x0 = x0;
    const y0 = g.f(x0);
    const msec = secantSlope(g.f, x0, h);
    const fp = g.fp(x0);
    const dq = df1(g.f, x0, 1e-5);
    const left = df1left(g.f, x0, 1e-5);
    const right = df1right(g.f, x0, 1e-5);
    computed.g = g;
    computed.tex = g.tex;
    computed.f0 = y0;
    computed.fp = fp;
    computed.msec = msec;
    computed.dq = dq;
    computed.left = left;
    computed.right = right;
    computed.y1 = g.f(x0 + h);
    computed.agree =
      Number.isFinite(fp) && Number.isFinite(dq) && Math.abs(fp - dq) <= Math.max(1e-4, 1e-3 * Math.abs(fp));
    state.xMin = a - 0.4;
    state.xMax = b + 0.4;
    state.yMin = -1;
    state.yMax = Math.max(4, Math.abs(y0), Math.abs(computed.y1)) + 1;
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
    view.syncBars([], false);
    const sec = lineEnds(state.x0 + state.h / 2, computed.f0 + computed.msec * (state.h / 2), computed.msec);
    view.syncLine(
      'secant',
      sec.x0,
      sec.y0,
      sec.x1,
      sec.y1,
      show.secant !== false && Number.isFinite(computed.msec),
    );
    const tan = lineEnds(state.x0, computed.f0, Number.isFinite(computed.fp) ? computed.fp : 0);
    view.syncLine(
      'tangent',
      tan.x0,
      tan.y0,
      tan.x1,
      tan.y1,
      show.tangent !== false && Number.isFinite(computed.fp),
    );
  },
  law() {
    return ["f'(x_0)=\\lim_{h\\to 0}\\dfrac{f(x_0+h)-f(x_0)}{h}"];
  },
  liveRows(state, computed) {
    const fp = Number.isFinite(computed.fp) ? `$${fmt(computed.fp)}$` : 'undefined';
    return (
      kv('$f$', `$${computed.tex}$`) +
      kv('$x_0$', `$${fmt(state.x0)}$`) +
      kv('$h$', `$${fmt(state.h)}$`) +
      kv('secant slope', Number.isFinite(computed.msec) ? `$${fmt(computed.msec)}$` : '—') +
      kv("analytic $f'$", fp) +
      kv('central quotient', Number.isFinite(computed.dq) ? `$${fmt(computed.dq)}$` : '—')
    );
  },
  readout(state, computed) {
    return cells([
      ['$f(x_0)$', Number.isFinite(computed.f0) ? `$${fmt(computed.f0)}$` : '—'],
      ['secant', Number.isFinite(computed.msec) ? `$${fmt(computed.msec)}$` : '—'],
      ["$f'$", Number.isFinite(computed.fp) ? `$${fmt(computed.fp)}$` : '—'],
      ['agree', computed.agree ? 'yes' : 'not yet'],
    ]);
  },
  coach(state, computed) {
    const body = [
      'The secant uses two points on the graph.',
      'Shrink $h$. That line turns into the tangent.',
      eq('m_{\\mathrm{sec}}=\\dfrac{f(x_0+h)-f(x_0)}{h}'),
    ];
    if (computed.g?.id === 'abs' && Math.abs(state.x0) < 0.08) {
      body.push(
        `Left slope $${fmt(computed.left)}$, right slope $${fmt(computed.right)}$. They disagree, so $f'(0)$ does not exist.`,
      );
    } else if (!computed.agree && Number.isFinite(computed.fp)) {
      body.push('The secant is still steep or flat. A smaller $h$ closes the gap.');
    } else if (computed.agree) {
      body.push('The secant slope and the derivative now agree.');
    }
    return { title: 'Secant to tangent', body };
  },
  plot() {
    return null;
  },
});
