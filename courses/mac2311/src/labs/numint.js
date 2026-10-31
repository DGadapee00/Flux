import * as THREE from 'three';
import { cells, eq, kv } from '@flux/shells/math/shared.js';
import { fmtNum as fmt } from '@flux/shells/math/format.js';
import { sinExact, sinSimpson, sinSimpsonPanels, sinTrap, sinTrapPanels } from '../math/calc2.js';
import { GraphView } from '../scene/graph-integral.js';
import { defineLab } from './define.js';

const SCENARIOS = [
  { id: 'coarse', name: '4 panels', n: 4 },
  { id: 'mid', name: '8 panels', n: 8 },
  { id: 'fine', name: '16 panels', n: 16 },
];

const FRAME = { xMin: -0.3, xMax: 3.5, yMin: -0.35, yMax: 1.45 };

function keepXy(state) {
  state.view = { ...(state.view || {}), plane: 'xy', upm: state.view?.upm || 1 };
}

function numCamera(state) {
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

function evenCount(n) {
  let k = Math.round(Number.isFinite(n) ? n : 4);
  if (k % 2) k += 1;
  return Math.min(100, Math.max(2, k));
}

function chordAt(xs, ys, x) {
  if (x <= xs[0]) return ys[0];
  for (let i = 0; i < xs.length - 1; i++) {
    if (x <= xs[i + 1]) {
      const t = (x - xs[i]) / (xs[i + 1] - xs[i]);
      return ys[i] + t * (ys[i + 1] - ys[i]);
    }
  }
  return ys[ys.length - 1];
}

export default defineLab({
  id: 'numint',
  exam: 'u2',
  title: 'Numerical',
  hint: 'Add panels. Simpson should pull ahead of the trapezoid.',
  orbit: true,
  probe: false,
  frame: true,
  cameraFor: numCamera,
  toggles: [
    { key: 'curve', label: 'Sine' },
    { key: 'chords', label: 'Chords' },
  ],
  scenarios: SCENARIOS,
  defaultState() {
    return {
      scenarioId: 'coarse',
      n: 4,
      ...FRAME,
      view: { upm: 1, plane: 'xy' },
      show: { curve: true, chords: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>panels</span>
          <div class="slider-row">
            <input type="range" id="num-n" min="2" max="100" step="2" value="4" />
          </div>
        </label>
      </div>`;
  },
  bind(api) {
    document.getElementById('num-n').addEventListener('input', (e) => {
      api.slice().n = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(state) {
    const n = document.getElementById('num-n');
    if (n) n.value = state.n;
  },
  applyScenario(id, state) {
    const s = SCENARIOS.find((item) => item.id === id) || SCENARIOS[0];
    state.scenarioId = s.id;
    state.n = s.n;
    Object.assign(state, FRAME);
    keepXy(state);
  },
  extent() {
    return Math.max(Math.abs(FRAME.xMin), FRAME.xMax, Math.abs(FRAME.yMin), FRAME.yMax);
  },
  recompute(state, computed) {
    keepXy(state);
    const n = evenCount(state.n);
    state.n = n;
    Object.assign(state, FRAME);
    const trap = sinTrap(n);
    const simp = sinSimpson(n);
    const exact = sinExact();
    computed.trap = trap;
    computed.simp = simp;
    computed.exact = exact;
    computed.trapErr = Math.abs(trap - exact);
    computed.simpErr = Math.abs(simp - exact);
    computed.n = n;
    computed.agree = Math.abs(trap - sinTrapPanels(n)) <= 1e-9 && Math.abs(simp - sinSimpsonPanels(n)) <= 1e-9;
    computed.closer = computed.simpErr < computed.trapErr;
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
    const n = state.n;
    const xs = [];
    const ys = [];
    for (let i = 0; i <= n; i++) {
      const x = (Math.PI * i) / n;
      xs.push(x);
      ys.push(Math.sin(x));
    }
    view.syncCurve('curve', Math.sin, 0, Math.PI, show.curve !== false);
    view.syncCurve('poly', (x) => chordAt(xs, ys, x), 0, Math.PI, show.chords !== false);
    view.syncNodes(xs.map((x, i) => ({ x, y: ys[i] })), true);
    view.syncMark(0, 0, false);
    view.syncHatch(() => 0, 0, 1, false);
    view.syncBound(0, 0, false);
    void computed;
  },
  law() {
    return [String.raw`T=\dfrac{h}{2}(y_0+2y_1+\cdots+y_n)`, String.raw`S=\dfrac{h}{3}(y_0+4y_1+2y_2+\cdots+y_n)`];
  },
  liveRows(state, computed) {
    return (
      kv('panels', `$${fmt(state.n)}$`) +
      kv('trapezoid', `$${fmt(computed.trap)}$`) +
      kv('Simpson', `$${fmt(computed.simp)}$`) +
      kv('exact', `$${fmt(computed.exact)}$`) +
      kv('trap error', `$${fmt(computed.trapErr)}$`) +
      kv('Simpson error', `$${fmt(computed.simpErr)}$`)
    );
  },
  readout(state, computed) {
    return cells([
      ['trapezoid', `$${fmt(computed.trap)}$`],
      ['Simpson', `$${fmt(computed.simp)}$`],
      ['exact', `$${fmt(computed.exact)}$`],
      ['closer', computed.closer ? 'Simpson' : 'trap'],
    ]);
  },
  coach(state, computed) {
    const body = [
      'The curve is sine on [0, π]. The yellow chords are the trapezoid.',
      'Each chord cuts off a slice of the hump. That slice is the trapezoid error.',
      eq(String.raw`T_{${state.n}} = ${fmt(computed.trap)}, \quad |T-2| = ${fmt(computed.trapErr)}`),
      eq(String.raw`S_{${state.n}} = ${fmt(computed.simp)}, \quad |S-2| = ${fmt(computed.simpErr)}`),
    ];
    if (computed.closer) body.push('Simpson uses the same points and lands closer. The panel sum agrees with the weights.');
    else body.push('Here the trapezoid is closer. Add panels and check again.');
    return { title: 'Same points, faster error', body };
  },
  plot() {
    return null;
  },
});
