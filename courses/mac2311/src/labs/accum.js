import { cells, eq, kv } from '@flux/shells/math/shared.js';
import { fmtNum as fmt } from '@flux/shells/math/format.js';
import { accumArea, accumHeight, accumStep, graphById } from '../math/calc1.js';
import { GraphView } from '../scene/graph.js';
import { defineLab, planeCamera } from './define.js';

const SLICES = 32;

const SCENARIOS = [
  { id: 'quad', name: 'x²', graphId: 'quad', a: 0, b: 2, x: 1 },
  { id: 'line', name: '2x+1', graphId: 'line', a: 0, b: 2, x: 1 },
  { id: 'sine', name: 'sin x', graphId: 'sine', a: 0, b: Math.PI, x: Math.PI / 2 },
];

function keepXy(state) {
  state.view = { ...(state.view || {}), plane: 'xy', upm: state.view?.upm || 1 };
}

function peakOf(g, a, b) {
  let peak = 1;
  for (let i = 0; i <= 24; i++) {
    const y = g.f(a + ((b - a) * i) / 24);
    if (Number.isFinite(y)) peak = Math.max(peak, Math.abs(y));
  }
  return peak;
}

function slices(g, a, x) {
  const n = SLICES;
  const dx = (x - a) / n;
  const rects = [];
  if (!(dx > 0)) return rects;
  for (let i = 0; i < n; i++) {
    const x0 = a + i * dx;
    rects.push({ x0, x1: x0 + dx, y: g.f(x0 + 0.5 * dx) });
  }
  return rects;
}

export default defineLab({
  id: 'accum',
  exam: 'u4',
  title: 'FTC',
  hint: 'Slide $x$. The area grows at the height of the curve.',
  orbit: false,
  probe: false,
  frame: true,
  cameraFor: planeCamera,
  toggles: [
    { key: 'curve', label: 'Curve' },
    { key: 'area', label: 'Area' },
    { key: 'height', label: 'Height' },
  ],
  scenarios: SCENARIOS,
  defaultState() {
    return {
      scenarioId: 'quad',
      graphId: 'quad',
      a: 0,
      b: 2,
      x: 1,
      xMin: -0.35,
      xMax: 2.35,
      yMin: -0.45,
      yMax: 4.5,
      view: { upm: 1, plane: 'xy' },
      show: { curve: true, area: true, height: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>x</span>
          <div class="slider-row">
            <input type="range" id="ac-x" min="0.2" max="2" step="0.05" value="1" />
          </div>
        </label>
      </div>`;
  },
  bind(api) {
    document.getElementById('ac-x').addEventListener('input', (e) => {
      api.slice().x = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(state) {
    const x = document.getElementById('ac-x');
    if (!x) return;
    x.min = String(state.a + 0.2);
    x.max = String(state.b);
    x.value = state.x;
  },
  applyScenario(id, state) {
    const s = SCENARIOS.find((item) => item.id === id) || SCENARIOS[0];
    state.scenarioId = s.id;
    state.graphId = s.graphId;
    state.a = s.a;
    state.b = s.b;
    state.x = s.x;
    keepXy(state);
  },
  extent(state) {
    const g = graphById(state.graphId);
    return Math.max(Math.abs(state.a) || 0, Math.abs(state.b) || 1, peakOf(g, state.a ?? 0, state.b ?? 2));
  },
  recompute(state, computed) {
    keepXy(state);
    const g = graphById(state.graphId);
    const a = Number.isFinite(state.a) ? state.a : 0;
    const b = Number.isFinite(state.b) && state.b > a + 0.2 ? state.b : a + 2;
    let x = Number.isFinite(state.x) ? state.x : a + 1;
    x = Math.min(b, Math.max(a + 0.2, x));
    state.a = a;
    state.b = b;
    state.x = x;
    const peak = peakOf(g, a, b);
    state.xMin = Math.min(a, 0) - 0.35;
    state.xMax = b + 0.35;
    state.yMin = -0.45;
    state.yMax = peak + 0.45;
    computed.area = accumArea(state.graphId, a, x);
    computed.height = accumHeight(state.graphId, x);
    computed.step = accumStep(state.graphId, a, x);
    computed.agree = Math.abs(computed.step - computed.height) <= 1e-3;
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
    const g = graphById(state.graphId);
    const view = ctx.handle.view;
    const x = state.x;
    const y = computed.height;
    view.syncCurve(g.f, state.a, state.b, show.curve !== false);
    view.syncLine('secant', 0, 0, 0, 0, false);
    view.syncLine('tangent', x, 0, x, y, show.height !== false);
    view.syncBars(slices(g, state.a, x), show.area !== false);
    view.syncGuides([], false);
    view.syncMarks([], false);
    view.syncRod(0, 0, 0, 0, false);
    view.syncMotion([], false);
    view.syncBox('wire', [], false);
    view.syncBox('peak', [], false);
  },
  law(state) {
    const g = graphById(state.graphId);
    return [String.raw`A(x)=\int_a^x f(t)\,dt`, String.raw`A'(x)=f(x)=${g.tex}`];
  },
  liveRows(state, computed) {
    const g = graphById(state.graphId);
    return (
      kv('$f$', `$${g.tex}$`) +
      kv('$x$', `$${fmt(state.x)}$`) +
      kv('area', `$${fmt(computed.area)}$`) +
      kv('height', `$${fmt(computed.height)}$`) +
      kv('short step', `$${fmt(computed.step)}$`)
    );
  },
  readout(state, computed) {
    return cells([
      ['area', `$${fmt(computed.area)}$`],
      ['height', `$${fmt(computed.height)}$`],
      ['step', `$${fmt(computed.step)}$`],
      ['agree', computed.agree ? 'yes' : 'no'],
    ]);
  },
  coach(state, computed) {
    const body = [
      'The gold region is the area from the left edge to $x$.',
      'That area grows at the height of the curve.',
      eq(String.raw`A'(${fmt(state.x)})=${fmt(computed.height)}`),
    ];
    const midH = accumHeight(state.graphId, (state.a + state.b) / 2);
    if (computed.height > midH + 1e-6) body.push('The curve is above its middle height, so the area grows faster.');
    else if (computed.height < midH - 1e-6) body.push('The curve is below its middle height, so the area grows slower.');
    else body.push('The curve is at its middle height.');
    return { title: 'Area grows at the height', body };
  },
  plot(state) {
    const g = graphById(state.graphId);
    const n = 48;
    const xs = [];
    const ys = [];
    for (let i = 0; i < n; i++) {
      const x = state.a + ((state.b - state.a) * i) / (n - 1);
      xs.push(x);
      ys.push(g.f(x));
    }
    return { type: 'accum', xs, ys, x: state.x, title: 'A(x)' };
  },
});
