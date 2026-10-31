import { fitArcCamera, plotWindow } from './arc.js';
import { cells, eq, kv } from '@flux/shells/math/shared.js';
import { fmtNum as fmt } from '@flux/shells/math/format.js';
import {
  cardioidArea,
  cardioidNaive,
  cardioidR,
  cardioidSimpson,
  shiftArea,
  shiftNaive,
  shiftR,
  shiftSimpson,
  unitArea,
  unitAreaDisk,
  unitNaive,
} from '../math/calc2.js';
import { GraphView } from '../scene/graph-integral.js';
import { defineLab } from './define.js';

const SCENARIOS = [
  { id: 'disk', name: 'Unit disk', kind: 'disk', k: 4 },
  { id: 'card', name: 'Cardioid', kind: 'card', k: 4 },
  { id: 'shift', name: 'Shifted circle', kind: 'shift', k: 4 },
];

const FRAME = { xMin: -1.5, xMax: 2.6, yMin: -1.8, yMax: 1.8 };

function keepXy(state) {
  state.view = { ...(state.view || {}), plane: 'xy', upm: state.view?.upm || 1 };
}

function polarCamera(state) {
  const c = fitArcCamera(state, plotWindow());
  return { pos: c.pos, target: c.target };
}

function kindOf(kind) {
  if (kind === 'card' || kind === 'shift') return kind;
  return 'disk';
}

function clampK(k, kind) {
  const n = Number.isFinite(k) ? k : 4;
  if (kind === 'shift') return Math.min(4, Math.max(1, n));
  return Math.min(50, Math.max(1, Math.round(n)));
}

function endAngle(kind, k) {
  if (kind === 'shift') return -Math.PI / 2 + (k / 4) * Math.PI;
  return (k * Math.PI) / 2;
}

function radiusAt(kind, theta) {
  if (kind === 'card') return cardioidR(theta);
  if (kind === 'shift') return shiftR(theta);
  return 1;
}

function startAngle(kind) {
  return kind === 'shift' ? -Math.PI / 2 : 0;
}

function sweep(kind, alpha) {
  if (kind === 'card')
    return { area: cardioidArea(alpha), alt: cardioidSimpson(alpha), naive: cardioidNaive(alpha) };
  if (kind === 'shift') return { area: shiftArea(alpha), alt: shiftSimpson(alpha), naive: shiftNaive(alpha) };
  return { area: unitArea(alpha), alt: unitAreaDisk(alpha), naive: unitNaive(alpha) };
}

function loop(kind) {
  const n = 120;
  const t0 = startAngle(kind);
  const t1 = kind === 'shift' ? Math.PI / 2 : 2 * Math.PI;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = t0 + ((t1 - t0) * i) / n;
    const r = radiusAt(kind, t);
    pts.push({ x: r * Math.cos(t), y: r * Math.sin(t) });
  }
  return pts;
}

function fan(kind, alpha) {
  const n = 32;
  const t0 = startAngle(kind);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = t0 + ((alpha - t0) * i) / n;
    const r = radiusAt(kind, t);
    pts.push({ x: r * Math.cos(t), y: r * Math.sin(t) });
  }
  return pts;
}

export default defineLab({
  id: 'polar',
  exam: 'u4',
  title: 'Polar',
  hint: 'Sweep the angle. The area grows with r squared, not with r.',
  orbit: true,
  probe: false,
  frame: true,
  cameraFor: polarCamera,
  toggles: [
    { key: 'curve', label: 'Curve' },
    { key: 'area', label: 'Area' },
  ],
  scenarios: SCENARIOS,
  defaultState() {
    return {
      scenarioId: 'disk',
      kind: 'disk',
      k: 4,
      ...FRAME,
      view: { upm: 1, plane: 'xy' },
      show: { curve: true, area: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span id="pol-name">quarter turns</span>
          <div class="slider-row">
            <input type="range" id="pol-k" min="1" max="50" step="1" value="4" />
          </div>
        </label>
      </div>`;
  },
  bind(api) {
    document.getElementById('pol-k').addEventListener('input', (e) => {
      api.slice().k = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(state) {
    const slider = document.getElementById('pol-k');
    const name = document.getElementById('pol-name');
    if (!slider) return;
    const shift = state.kind === 'shift';
    slider.min = '1';
    slider.max = shift ? '4' : '50';
    slider.step = shift ? '0.06' : '1';
    slider.value = state.k;
    if (name) name.textContent = shift ? 'fourths of the curve' : 'quarter turns';
  },
  applyScenario(id, state) {
    const s = SCENARIOS.find((item) => item.id === id) || SCENARIOS[0];
    state.scenarioId = s.id;
    state.kind = s.kind;
    state.k = s.k;
    Object.assign(state, FRAME);
    keepXy(state);
  },
  extent() {
    return Math.max(Math.abs(FRAME.xMin), FRAME.xMax, Math.abs(FRAME.yMin), FRAME.yMax);
  },
  recompute(state, computed) {
    keepXy(state);
    const kind = kindOf(state.kind);
    const k = clampK(state.k, kind);
    state.kind = kind;
    state.k = k;
    Object.assign(state, FRAME);
    const alpha = endAngle(kind, k);
    const here = sweep(kind, alpha);
    const r = radiusAt(kind, alpha);
    computed.alpha = alpha;
    computed.area = here.area;
    computed.naive = here.naive;
    computed.r = r;
    computed.x = r * Math.cos(alpha);
    computed.y = r * Math.sin(alpha);
    computed.kind = kind;
    computed.k = k;
    computed.agree = Math.abs(here.area - here.alt) <= 1e-6;
    computed.differs = Math.abs(here.area - here.naive) > 1e-4;
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
    const end = { x: computed.x, y: computed.y };
    view.syncPath('curve', loop(state.kind), show.curve !== false);
    view.syncFan(fan(state.kind, computed.alpha), show.area !== false);
    view.syncPath('poly', [{ x: 0, y: 0 }, end], show.area !== false);
    view.syncNodes([end], true, 0.08);
    view.syncMark(0, 0, false);
    view.syncBound(0, 0, false);
  },
  law(state) {
    const kind = state?.kind || 'disk';
    if (kind === 'card') return [String.raw`r=1+\cos\theta`, String.raw`A=\frac12\int r^2\,d\theta`];
    if (kind === 'shift') return [String.raw`r=2\cos\theta`, String.raw`A=\frac12\int r^2\,d\theta`];
    return [String.raw`r=1`, String.raw`A=\frac12\alpha`];
  },
  liveRows(state, computed) {
    return (
      kv('angle', `$${fmt(computed.alpha)}$`) +
      kv('area', `$${fmt(computed.area)}$`) +
      kv('∫ r dθ', `$${fmt(computed.naive)}$`) +
      kv('same', computed.differs ? 'no' : 'yes')
    );
  },
  readout(state, computed) {
    return cells([
      ['area', `$${fmt(computed.area)}$`],
      ['∫ r', `$${fmt(computed.naive)}$`],
      ['angle', `$${fmt(computed.alpha)}$`],
      ['match', computed.agree ? 'yes' : 'no'],
    ]);
  },
  coach(state, computed) {
    const body = ['Teal is the curve. Gold rays are the swept area. Yellow is the moving ray.'];
    if (state.kind === 'card') {
      body.push('A full turn of this cardioid encloses 3π/2. Integrating r instead gives 2π.');
    } else if (state.kind === 'shift') {
      body.push('r = 2 cos θ is a circle of radius 1. The whole circle has area π.');
    } else {
      body.push('A full turn of the unit circle encloses π. Integrating r around that turn gives 2π.');
    }
    body.push(eq(String.raw`A=${fmt(computed.area)},\quad \int r\,d\theta=${fmt(computed.naive)}`));
    if (computed.differs) body.push('The two totals disagree. The area is the one with (1/2) r².');
    if (computed.agree) body.push('A second way of finding the area agrees.');
    return { title: 'Area carries r squared', body };
  },
  plot() {
    return null;
  },
});
