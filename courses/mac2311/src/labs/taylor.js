import * as THREE from 'three';
import { cells, eq, kv } from '@flux/shells/math/shared.js';
import { fmtNum as fmt } from '@flux/shells/math/format.js';
import { sampleFn, taylorError, taylorHorner, taylorSum } from '../math/calc2.js';
import { GraphView } from '../scene/graph-integral.js';
import { defineLab } from './define.js';

const SCENARIOS = [
  { id: 'line', name: 'Order 1', n: 1, a: 0, x: 0.5 },
  { id: 'fifth', name: 'Order 5', n: 5, a: 0, x: 0.5 },
  { id: 'shift', name: 'Centre π/2', n: 2, a: Math.PI / 2, x: Math.PI / 2 + 0.4 },
];

const FRAME = { xMin: -1.8, xMax: 2.4, yMin: -1.6, yMax: 1.6 };

function keepXy(state) {
  state.view = { ...(state.view || {}), plane: 'xy', upm: state.view?.upm || 1 };
}

function taylorCamera(state) {
  const u = state?.view?.upm > 0 ? state.view.upm : 1;
  const xMin = Number.isFinite(state?.xMin) ? state.xMin : FRAME.xMin;
  const xMax = Number.isFinite(state?.xMax) ? state.xMax : FRAME.xMax;
  const yMin = Number.isFinite(state?.yMin) ? state.yMin : FRAME.yMin;
  const yMax = Number.isFinite(state?.yMax) ? state.yMax : FRAME.yMax;
  const cx = ((xMin + xMax) / 2) * u;
  const cy = ((yMin + yMax) / 2) * u;
  const halfW = ((xMax - xMin) / 2) * u;
  const z = (halfW * 1.25) / (Math.tan(Math.PI / 9) * (380 / 780));
  return { pos: new THREE.Vector3(cx, cy, z), target: new THREE.Vector3(cx, cy, 0) };
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

export default defineLab({
  id: 'taylor',
  exam: 'u3',
  title: 'Taylor',
  hint: 'Raise the order. The match should reach farther from the centre.',
  orbit: true,
  probe: false,
  frame: true,
  cameraFor: taylorCamera,
  toggles: [
    { key: 'curve', label: 'Sine' },
    { key: 'poly', label: 'Polynomial' },
  ],
  scenarios: SCENARIOS,
  defaultState() {
    return {
      scenarioId: 'line',
      kind: 'sin',
      n: 1,
      a: 0,
      x: 0.5,
      ...FRAME,
      view: { upm: 1, plane: 'xy' },
      show: { curve: true, poly: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>order</span>
          <div class="slider-row">
            <input type="range" id="tay-n" min="1" max="7" step="1" value="1" />
          </div>
        </label>
        <label class="field">
          <span>centre</span>
          <div class="slider-row">
            <input type="range" id="tay-a" min="-0.5" max="2" step="0.05" value="0" />
          </div>
        </label>
        <label class="field">
          <span>probe</span>
          <div class="slider-row">
            <input type="range" id="tay-x" min="-1.2" max="2.2" step="0.05" value="0.5" />
          </div>
        </label>
      </div>`;
  },
  bind(api) {
    document.getElementById('tay-n').addEventListener('input', (e) => {
      api.slice().n = Number(e.target.value);
      api.bump();
    });
    document.getElementById('tay-a').addEventListener('input', (e) => {
      api.slice().a = Number(e.target.value);
      api.bump();
    });
    document.getElementById('tay-x').addEventListener('input', (e) => {
      api.slice().x = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(state) {
    const n = document.getElementById('tay-n');
    const a = document.getElementById('tay-a');
    const x = document.getElementById('tay-x');
    if (n) n.value = state.n;
    if (a) a.value = state.a;
    if (x) x.value = state.x;
  },
  applyScenario(id, state) {
    const s = SCENARIOS.find((item) => item.id === id) || SCENARIOS[0];
    state.scenarioId = s.id;
    state.kind = 'sin';
    state.n = s.n;
    state.a = s.a;
    state.x = s.x;
    Object.assign(state, FRAME);
    keepXy(state);
  },
  extent() {
    return Math.max(Math.abs(FRAME.xMin), FRAME.xMax, Math.abs(FRAME.yMin), FRAME.yMax);
  },
  recompute(state, computed) {
    keepXy(state);
    const kind = 'sin';
    const n = clamp(Math.round(Number.isFinite(state.n) ? state.n : 1), 1, 7);
    const a = clamp(Number.isFinite(state.a) ? state.a : 0, -0.5, 2);
    const x = clamp(Number.isFinite(state.x) ? state.x : 0.5, -1.2, 2.2);
    state.kind = kind;
    state.n = n;
    state.a = a;
    state.x = x;
    Object.assign(state, FRAME);
    const poly = taylorSum(kind, a, n, x);
    const horner = taylorHorner(kind, a, n, x);
    computed.poly = poly;
    computed.horner = horner;
    computed.f = sampleFn(kind, x);
    computed.err = taylorError(kind, a, n, x);
    computed.n = n;
    computed.agree = Math.abs(poly - horner) <= 1e-9;
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
    const view = ctx.handle.view;
    const kind = state.kind || 'sin';
    view.syncCurve('curve', (x) => sampleFn(kind, x), state.xMin, state.xMax, show.curve !== false);
    view.syncCurve('poly', (x) => taylorSum(kind, state.a, state.n, x), state.xMin, state.xMax, show.poly !== false);
    view.syncMark(state.x, computed.f, true);
  },
  law() {
    return [String.raw`P_n(x)=\sum_{k=0}^{n} \dfrac{f^{(k)}(a)}{k!}(x-a)^k`];
  },
  liveRows(state, computed) {
    return (
      kv('order', `$${fmt(state.n)}$`) +
      kv('centre', `$${fmt(state.a)}$`) +
      kv('probe', `$${fmt(state.x)}$`) +
      kv('P_n', `$${fmt(computed.poly)}$`) +
      kv('sin', `$${fmt(computed.f)}$`) +
      kv('error', `$${fmt(computed.err)}$`)
    );
  },
  readout(state, computed) {
    return cells([
      ['P_n', `$${fmt(computed.poly)}$`],
      ['sin', `$${fmt(computed.f)}$`],
      ['error', `$${fmt(computed.err)}$`],
      ['agree', computed.agree ? 'yes' : 'no'],
    ]);
  },
  coach(state, computed) {
    const body = [
      'The teal curve is sine. The yellow curve is its Taylor polynomial.',
      eq(String.raw`P_{${state.n}}(${fmt(state.x)}) = ${fmt(computed.poly)}`),
      eq(String.raw`\left|\sin x - P_n(x)\right| = ${fmt(computed.err)}`),
    ];
    if (Math.abs(state.x - state.a) < 1e-9) body.push('At the centre the polynomial matches sine.');
    else if (state.n <= 1) body.push('Order 1 is the tangent line. The gap grows as you leave the centre.');
    else body.push('A higher order holds the curve farther from the centre.');
    if (computed.agree) body.push('Term-by-term addition and Horner form agree.');
    return { title: 'Order buys reach', body };
  },
  plot() {
    return null;
  },
});
