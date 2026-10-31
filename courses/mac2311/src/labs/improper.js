import * as THREE from 'three';
import { cells, eq, kv } from '@flux/shells/math/shared.js';
import { fmtNum as fmt } from '@flux/shells/math/format.js';
import { improperArea, improperSimpson, improperTail } from '../math/calc2.js';
import { GraphView } from '../scene/graph-integral.js';
import { defineLab } from './define.js';

const SCENARIOS = [
  { id: 'near', name: 'Bound 2', b: 2 },
  { id: 'mid', name: 'Bound 4', b: 4 },
  { id: 'far', name: 'Bound 8', b: 8 },
];

const FRAME = { xMin: 0.2, xMax: 8.8, yMin: -0.25, yMax: 1.35 };
const X0 = 1;
const X_FAR = 8;

function keepXy(state) {
  state.view = { ...(state.view || {}), plane: 'xy', upm: state.view?.upm || 1 };
}

function impCamera(state) {
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

function invSquare(x) {
  return 1 / (x * x);
}

export default defineLab({
  id: 'improper',
  exam: 'u2',
  title: 'Improper',
  hint: 'Slide the bound. The area approaches 1, and the tail is what is left.',
  orbit: true,
  probe: false,
  frame: true,
  cameraFor: impCamera,
  toggles: [
    { key: 'curve', label: 'Curve' },
    { key: 'area', label: 'Area' },
  ],
  scenarios: SCENARIOS,
  defaultState() {
    return {
      scenarioId: 'near',
      b: 2,
      ...FRAME,
      view: { upm: 1, plane: 'xy' },
      show: { curve: true, area: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>bound</span>
          <div class="slider-row">
            <input type="range" id="imp-b" min="2" max="8" step="0.5" value="2" />
          </div>
        </label>
      </div>`;
  },
  bind(api) {
    document.getElementById('imp-b').addEventListener('input', (e) => {
      api.slice().b = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(state) {
    const b = document.getElementById('imp-b');
    if (b) b.value = state.b;
  },
  applyScenario(id, state) {
    const s = SCENARIOS.find((item) => item.id === id) || SCENARIOS[0];
    state.scenarioId = s.id;
    state.b = s.b;
    Object.assign(state, FRAME);
    keepXy(state);
  },
  extent() {
    return Math.max(Math.abs(FRAME.xMin), FRAME.xMax, Math.abs(FRAME.yMin), FRAME.yMax);
  },
  recompute(state, computed) {
    keepXy(state);
    let b = Number.isFinite(state.b) ? state.b : 2;
    b = Math.min(8, Math.max(2, b));
    state.b = b;
    Object.assign(state, FRAME);
    const area = improperArea(b);
    const tail = improperTail(b);
    const num = improperSimpson(b);
    computed.area = area;
    computed.tail = tail;
    computed.num = num;
    computed.limit = 1;
    computed.height = invSquare(b);
    computed.agree = Math.abs(area - num) <= 1e-6 && Math.abs(area + tail - 1) <= 1e-12;
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
    view.syncCurve('curve', invSquare, X0, X_FAR, show.curve !== false);
    view.syncCurve('poly', () => 0, 0, 1, false);
    view.syncMark(0, 0, false);
    view.syncNodes([], false);
    view.syncHatch(invSquare, X0, state.b, show.area !== false);
    view.syncBound(state.b, computed.height, true);
  },
  law() {
    return [String.raw`\int_1^{B} x^{-2}\,dx = 1-\dfrac{1}{B}`, String.raw`\int_1^{\infty} x^{-2}\,dx = 1`];
  },
  liveRows(state, computed) {
    return (
      kv('bound', `$${fmt(state.b)}$`) +
      kv('area', `$${fmt(computed.area)}$`) +
      kv('tail', `$${fmt(computed.tail)}$`) +
      kv('limit', `$${fmt(computed.limit)}$`)
    );
  },
  readout(state, computed) {
    return cells([
      ['area', `$${fmt(computed.area)}$`],
      ['tail', `$${fmt(computed.tail)}$`],
      ['limit', `$${fmt(computed.limit)}$`],
      ['agree', computed.agree ? 'yes' : 'no'],
    ]);
  },
  coach(state, computed) {
    const body = [
      'The curve is 1/x². The gold strokes are the area from 1 out to the bound.',
      'The antiderivative is −1/x. The tail past the bound is 1/B.',
      eq(String.raw`1-\dfrac{1}{${fmt(state.b)}} = ${fmt(computed.area)}`),
      eq(String.raw`\dfrac{1}{${fmt(state.b)}} = ${fmt(computed.tail)}`),
    ];
    if (computed.tail < 0.2) body.push('The tail is small. The area is close to 1, and it never passes 1.');
    else body.push('A short bound leaves a large tail. Slide it out and the area climbs toward 1.');
    if (computed.agree) body.push("Simpson's rule agrees with the antiderivative.");
    return { title: 'The tail is the rest of 1', body };
  },
  plot() {
    return null;
  },
});
