import { cells, eq, kv } from '@flux/shells/math/shared.js';
import { fmtNum as fmt } from '@flux/shells/math/format.js';
import { ladderStep, ladderVelocity } from '../math/calc1.js';
import { GraphView } from '../scene/graph.js';
import { defineLab, planeCamera } from './define.js';

const LENGTH = 10;
const SPEED = 0.45;

const SCENARIOS = [
  { id: 'mid', name: '6 ft out', x: 6, v: 2 },
  { id: 'steep', name: '2 ft out', x: 2, v: 2 },
  { id: 'flat', name: '8 ft out', x: 8, v: 2 },
];

function keepXy(state) {
  state.view = { ...(state.view || {}), plane: 'xy', upm: state.view?.upm || 1 };
}

export default defineLab({
  id: 'rates',
  exam: 'u2',
  title: 'Ladder',
  hint: 'Slide the base. The top does not match that speed.',
  orbit: false,
  probe: false,
  frame: true,
  cameraFor: planeCamera,
  toggles: [
    { key: 'ladder', label: 'Ladder' },
    { key: 'wall', label: 'Wall' },
    { key: 'speeds', label: 'Speeds' },
  ],
  scenarios: SCENARIOS,
  defaultState() {
    return {
      scenarioId: 'mid',
      L: LENGTH,
      x: 6,
      v: 2,
      xMin: -1,
      xMax: LENGTH + 1,
      yMin: -2,
      yMax: LENGTH + 1,
      view: { upm: 1, plane: 'xy' },
      show: { ladder: true, wall: true, speeds: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>base</span>
          <div class="slider-row">
            <input type="range" id="ld-x" min="1" max="9" step="0.1" value="6" />
          </div>
        </label>
        <label class="field">
          <span>base speed</span>
          <div class="slider-row">
            <input type="range" id="ld-v" min="0.5" max="4" step="0.1" value="2" />
          </div>
        </label>
      </div>`;
  },
  bind(api) {
    document.getElementById('ld-x').addEventListener('input', (e) => {
      api.slice().x = Number(e.target.value);
      api.bump();
    });
    document.getElementById('ld-v').addEventListener('input', (e) => {
      api.slice().v = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(state) {
    const x = document.getElementById('ld-x');
    if (!x) return;
    x.max = String(state.L - 1);
    x.value = state.x;
    document.getElementById('ld-v').value = state.v;
  },
  applyScenario(id, state) {
    const s = SCENARIOS.find((item) => item.id === id) || SCENARIOS[0];
    state.scenarioId = s.id;
    state.L = LENGTH;
    state.x = s.x;
    state.v = s.v;
    keepXy(state);
  },
  extent(state) {
    return Math.max(state.L || LENGTH, 1);
  },
  recompute(state, computed) {
    keepXy(state);
    const L = Number.isFinite(state.L) && state.L > 2 ? state.L : LENGTH;
    let x = Number.isFinite(state.x) ? state.x : 6;
    let v = Number.isFinite(state.v) ? state.v : 2;
    x = Math.min(L - 1, Math.max(1, x));
    v = Math.min(4, Math.max(0.5, v));
    state.L = L;
    state.x = x;
    state.v = v;
    const exact = ladderVelocity(L, x, v);
    const step = ladderStep(L, x, v);
    state.xMin = -1;
    state.xMax = L + 2;
    state.yMin = -2;
    state.yMax = L + 1;
    computed.y = exact.y;
    computed.dy = exact.dy;
    computed.step = step;
    computed.agree = Math.abs(exact.dy - step) <= 1e-3;
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
    const L = state.L;
    const y = computed.y;
    view.syncCurve(() => 0, 0, 1, false);
    view.syncLine('secant', 0, 0, 0, 0, false);
    view.syncLine('tangent', 0, 0, 0, 0, false);
    view.syncBars([], false);
    view.syncMarks([], false);
    view.syncRod(state.x, 0, 0, y, show.ladder !== false);
    view.syncGuides(
      [
        { x0: 0, y0: 0, x1: 0, y1: L },
        { x0: 0, y0: 0, x1: L, y1: 0 },
      ],
      show.wall !== false,
    );
    view.syncMotion(
      [
        { x: state.x, y: 0, dx: state.v * SPEED, dy: 0 },
        { x: 0, y, dx: 0, dy: computed.dy * SPEED },
      ],
      show.speeds !== false,
    );
  },
  law() {
    return [String.raw`x^2+y^2=L^2`, String.raw`y'=-\dfrac{x}{y}x'`];
  },
  liveRows(state, computed) {
    return (
      kv('length', `$${fmt(state.L)}$ ft`) +
      kv('base', `$${fmt(state.x)}$ ft`) +
      kv('height', `$${fmt(computed.y)}$ ft`) +
      kv('base speed', `$${fmt(state.v)}$ ft/s`) +
      kv('top speed', `$${fmt(computed.dy)}$ ft/s`) +
      kv('short slide', `$${fmt(computed.step)}$ ft/s`)
    );
  },
  readout(state, computed) {
    return cells([
      ['height', `$${fmt(computed.y)}$`],
      ['top', `$${fmt(computed.dy)}$`],
      ['base', `$${fmt(state.v)}$`],
      ['agree', computed.agree ? 'yes' : 'no'],
    ]);
  },
  coach(state, computed) {
    const body = [
      'The base slides out at a steady speed.',
      'The top speed is that speed times $x/y$.',
      eq(`y'=-\\dfrac{${fmt(state.x)}}{${fmt(computed.y)}}\\cdot${fmt(state.v)}=${fmt(computed.dy)}`),
    ];
    if (Math.abs(computed.dy) < state.v) body.push('The top is slower than the base. The ladder is still steep.');
    else body.push('The top is faster than the base. The ladder is getting flat.');
    return { title: 'The top does not copy the base', body };
  },
  plot() {
    return null;
  },
});
